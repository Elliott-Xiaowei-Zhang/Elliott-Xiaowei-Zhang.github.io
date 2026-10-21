const cacheKey = 'xz-visitor-totals-v1';

export function checkedStats(value) {
  if (!value || !Number.isSafeInteger(value.total) || value.total < 0 ||
      !Array.isArray(value.countries) || value.countries.length > 300) {
    throw new Error('Invalid statistics');
  }
  const seen = new Set();
  let total = 0;
  const countries = value.countries.map(row => {
    if (!row || !/^[A-Z]{2}$/.test(row.country) || seen.has(row.country) ||
        !Number.isSafeInteger(row.visitors) || row.visitors <= 0) {
      throw new Error('Invalid country totals');
    }
    seen.add(row.country);
    total += row.visitors;
    return { country: row.country, visitors: row.visitors };
  });
  if (total !== value.total) throw new Error('Inconsistent statistics');
  return { total, since: typeof value.since === 'string' ? value.since : null, countries };
}

function checkedSnapshot(value, now) {
  const time = Date.parse(value?.updatedAt);
  if (!Number.isFinite(time) || time <= 0 || time > now + 300000) {
    throw new Error('Invalid snapshot date');
  }
  return { stats: checkedStats(value), updatedAt: new Date(time).toISOString() };
}

async function readJson(fetcher, url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error('Statistics unavailable');
    return await response.json();
  } finally { clearTimeout(timeout); }
}

// The same-origin snapshot loads independently of the cross-origin counter.
// A blocked counter must neither delay the saved totals nor erase them.
export async function loadVisitorStatistics({ request, snapshotUrl, storage,
  onUpdate, fetcher = fetch, now = Date.now, timeoutMs = 5000 }) {
  let current;
  function publish(next) {
    if (current?.mode === 'live' && next.mode !== 'live') return;
    if (next.mode !== 'live' && current &&
        Date.parse(next.updatedAt) <= Date.parse(current.updatedAt)) return;
    current = next;
    onUpdate(next);
  }
  try {
    const cached = JSON.parse(storage.getItem(cacheKey) || 'null');
    publish({ ...checkedSnapshot(cached, now()), mode: 'cached' });
  } catch { /* Storage is optional, including for first-time visitors. */ }

  const snapshot = (async () => {
    const value = await readJson(fetcher, snapshotUrl, {
      method: 'GET', credentials: 'omit', cache: 'no-cache', referrerPolicy: 'no-referrer',
    }, timeoutMs);
    publish({ ...checkedSnapshot(value, now()), mode: 'snapshot' });
  })();

  const live = (async () => {
    let value;
    try {
      value = checkedStats(await readJson(fetcher, request.url, request.options, timeoutMs));
    } catch (error) {
      if (request.options.method !== 'POST') throw error;
      // Some networks reject a cross-origin POST/preflight but permit a read.
      value = checkedStats(await readJson(fetcher, request.url, {
        method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store',
        referrerPolicy: 'no-referrer',
      }, timeoutMs));
    }
    const updatedAt = new Date(now()).toISOString();
    try { storage.setItem(cacheKey, JSON.stringify({ ...value, updatedAt })); }
    catch { /* A valid response can still be displayed with storage blocked. */ }
    publish({ stats: value, updatedAt, mode: 'live' });
  })();

  await Promise.allSettled([snapshot, live]);
  if (!current) throw new Error('No visitor statistics available');
  return current;
}
