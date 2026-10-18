const pageOrigins = new Set([
  'https://elliott-xiaowei-zhang.github.io',
  'https://xiaowei-zhang-academic.aqua-plum-8641.chatgpt.site',
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function localOrigin(origin: string) {
  try {
    const u = new URL(origin);
    return ['http:', 'https:'].includes(u.protocol) && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
  } catch { return false; }
}

export async function handleVisitorApi(request: Request, db: D1Database): Promise<Response> {
  const origin = request.headers.get('Origin') || '';
  const ownOrigin = new URL(request.url).origin;
  const known = pageOrigins.has(origin) || origin === ownOrigin;
  const readable = known || localOrigin(origin);
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store', 'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
  if (readable) headers['Access-Control-Allow-Origin'] = origin;
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
  if (request.method === 'OPTIONS') {
    if (!known) return json({ error: 'Origin not allowed for counting' }, 403);
    return new Response(null, { status: 204, headers: {
      ...headers, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Visitor-Intent',
      'Access-Control-Max-Age': '86400',
    } });
  }
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
  if (origin && !readable) return json({ error: 'Origin not allowed' }, 403);
  if (request.method === 'POST' && (!known || request.headers.get('X-Visitor-Intent') !== 'count')) {
    return json({ error: 'Counting is restricted to the configured homepages' }, 403);
  }
  const optedOut = request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1';
  const bot = /bot|crawler|spider|headless|preview|lighthouse/i.test(request.headers.get('User-Agent') || '');
  try {
    if (request.method === 'POST' && !optedOut && !bot) {
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'JSON required' }, 415);
      if (Number(request.headers.get('Content-Length') || 0) > 256) return json({ error: 'Request too large' }, 413);
      const text = await request.text();
      if (text.length > 256) return json({ error: 'Request too large' }, 413);
      let body: Record<string, unknown>;
      try { body = JSON.parse(text); } catch { return json({ error: 'Invalid JSON' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body) ||
          Object.keys(body).some(key => key !== 'visitorId') || typeof body.visitorId !== 'string' || !uuid.test(body.visitorId)) {
        return json({ error: 'A random browser identifier is required' }, 400);
      }
      const edgeCountry = String((request as Request & { cf?: { country?: string } }).cf?.country || '').toUpperCase();
      const country = /^[A-Z]{2}$/.test(edgeCountry) && !['XX', 'T1'].includes(edgeCountry) ? edgeCountry : 'ZZ';
      await db.prepare('INSERT OR IGNORE INTO visitors (id, country, first_seen) VALUES (?, ?, ?)')
        .bind(body.visitorId.toLowerCase(), country, new Date().toISOString()).run();
    }
    const rows = await db.prepare('SELECT country, COUNT(*) AS visitors, MIN(first_seen) AS since FROM visitors GROUP BY country ORDER BY visitors DESC, country ASC')
      .all<{ country: string; visitors: number; since: string }>();
    return json({
      total: rows.results.reduce((sum, row) => sum + Number(row.visitors), 0),
      since: rows.results.map(row => row.since).sort()[0] || null,
      countries: rows.results.map(({ country, visitors }) => ({ country, visitors: Number(visitors) })),
    });
  } catch {
    return json({ error: 'Visitor statistics are temporarily unavailable' }, 503);
  }
}
