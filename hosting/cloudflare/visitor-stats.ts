const cookieName = 'xz_visitor';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie', ...headers } });
}

export async function handleVisitorStats(request: Request, db: D1Database) {
  const url = new URL(request.url);
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
  if (request.method === 'POST' && (request.headers.get('Origin') !== url.origin || request.headers.get('X-Visitor-Intent') !== 'count' || request.headers.get('Sec-Fetch-Site') === 'cross-site')) {
    return json({ error: 'Same-origin requests only' }, 403);
  }
  const cookies: Record<string, string> = {};
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    cookies[key] = value.join('=');
  }
  const headers: Record<string, string> = {};
  const optedOut = request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1';
  const bot = /bot|crawler|spider|headless|preview|lighthouse/i.test(request.headers.get('User-Agent') || '');
  try {
    if (request.method === 'POST' && !optedOut && !bot) {
      const existing = cookies[cookieName];
      const id = uuidPattern.test(existing || '') ? existing : crypto.randomUUID();
      // Country metadata comes from the hosting edge, never the browser payload.
      const code = String((request as Request & { cf?: { country?: string } }).cf?.country || '').toUpperCase();
      const country = /^[A-Z]{2}$/.test(code) && !['XX', 'T1'].includes(code) ? code : 'ZZ';
      await db.prepare('INSERT OR IGNORE INTO visitors (id, country, first_seen) VALUES (?, ?, ?)')
        .bind(id, country, new Date().toISOString()).run();
      headers['Set-Cookie'] = `${cookieName}=${id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`;
    }
    const rows = await db.prepare('SELECT country, COUNT(*) AS visitors, MIN(first_seen) AS since FROM visitors GROUP BY country ORDER BY visitors DESC, country ASC').all<{ country: string; visitors: number; since: string }>();
    const total = rows.results.reduce((sum, row) => sum + Number(row.visitors), 0);
    const since = rows.results.map(row => row.since).sort()[0] || null;
    return json({ total, since, countries: rows.results.map(({ country, visitors }) => ({ country, visitors: Number(visitors) })) }, 200, headers);
  } catch {
    // A failed counter must never prevent the academic homepage from loading.
    return json({ error: 'Visitor statistics are temporarily unavailable' }, 503);
  }
}
