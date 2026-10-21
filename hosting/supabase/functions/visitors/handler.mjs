const pageOrigins = new Set([
  'https://elliott-xiaowei-zhang.github.io',
  'https://xiaowei-zhang-academic.aqua-plum-8641.chatgpt.site',
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const countryCode = /^[A-Z]{2}$/;

function localOrigin(origin) {
  try {
    const u = new URL(origin);
    return ['http:', 'https:'].includes(u.protocol) && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
  } catch { return false; }
}

export function createVisitorHandler({ totals, previousCountry, record, resolveCountry }) {
  return async function handle(request) {
    const origin = request.headers.get('Origin') || '';
    const known = pageOrigins.has(origin);
    const readable = known || localOrigin(origin);
    const headers = {
      'Cache-Control': 'no-store', 'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff',
    };
    if (readable) headers['Access-Control-Allow-Origin'] = origin;
    const json = (value, status = 200) => Response.json(value, { status, headers });
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
    const bot = /bot|crawler|spider|headless|preview|lighthouse|globalping/i.test(request.headers.get('User-Agent') || '');
    try {
      if (request.method === 'POST' && !optedOut && !bot) {
        if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
          return json({ error: 'JSON required' }, 415);
        }
        if (Number(request.headers.get('Content-Length') || 0) > 256) return json({ error: 'Request too large' }, 413);
        const text = await request.text();
        if (text.length > 256) return json({ error: 'Request too large' }, 413);
        let body;
        try { body = JSON.parse(text); } catch { return json({ error: 'Invalid JSON' }, 400); }
        if (!body || typeof body !== 'object' || Array.isArray(body) ||
            Object.keys(body).length !== 1 || typeof body.visitorId !== 'string' || !uuid.test(body.visitorId)) {
          return json({ error: 'A random browser identifier is required' }, 400);
        }
        const id = body.visitorId.toLowerCase();
        const previous = await previousCountry(id);
        let country = previous;
        if (!country || country === 'ZZ') {
          try { country = await resolveCountry(request); }
          catch { country = 'ZZ'; }
        }
        if (typeof country !== 'string' || !countryCode.test(country) || ['XX', 'T1'].includes(country)) country = 'ZZ';
        await record(id, country);
      }
      const value = await totals();
      return json(value);
    } catch {
      return json({ error: 'Visitor statistics are temporarily unavailable' }, 503);
    }
  };
}
