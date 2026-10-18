const key = 'xz-visitor-v1';
const year = 365 * 24 * 60 * 60 * 1000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// The identifier belongs to the homepage origin, so no third-party cookie is needed.
export function visitorRequest({ endpoint, baseUrl, pageUrl, storage, randomUUID,
  optedOut = false, now = Date.now() }) {
  const url = new URL(endpoint || './api/visitors', baseUrl);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid statistics endpoint');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(pageUrl).hostname);
  let visitorId;
  if (!local && !optedOut) {
    try {
      let saved;
      try { saved = JSON.parse(storage.getItem(key) || 'null'); } catch { /* Replace malformed local state. */ }
      if (saved && uuid.test(saved.id || '') && Number.isFinite(saved.expires) &&
          saved.expires > now && saved.expires <= now + year) {
        visitorId = saved.id;
      } else {
        visitorId = randomUUID();
        if (!uuid.test(visitorId)) throw new Error('Invalid identifier');
        storage.setItem(key, JSON.stringify({ id: visitorId, expires: now + year }));
      }
    } catch {
      // With storage blocked, read the totals rather than count every reload as a new browser.
      visitorId = undefined;
    }
  }
  const options = { method: visitorId ? 'POST' : 'GET', credentials: 'omit',
    mode: 'cors', cache: 'no-store', referrerPolicy: 'no-referrer' };
  if (visitorId) {
    options.headers = { 'Content-Type': 'application/json', 'X-Visitor-Intent': 'count' };
    options.body = JSON.stringify({ visitorId });
  }
  return { url, options };
}
