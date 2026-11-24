import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkedStats, loadVisitorStatistics, startVisitorRefresh } from '../visitor-data.js';

const now = Date.parse('2026-10-21T10:00:00Z');
const totals = { total: 15, since: '2026-10-18T15:34:05Z', countries: [
  { country: 'CN', visitors: 8 }, { country: 'JP', visitors: 7 },
] };
const saved = { ...totals, updatedAt: '2026-10-21T09:00:00Z' };
const snapshotUrl = 'https://homepage.example/visitor-snapshot.json';
const request = { url: 'https://counter.example/api/visitors',
  options: { method: 'POST', credentials: 'omit', body: '{"visitorId":"example"}' } };
function storage() {
  const entries = new Map();
  return { getItem: key => entries.get(key) || null, setItem: (key, value) => entries.set(key, value) };
}
const response = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });

test('blocked counter still displays the same-origin snapshot before the counter times out', async () => {
  const updates = [];
  let displayed;
  const firstUpdate = new Promise(resolve => { displayed = resolve; });
  const loading = loadVisitorStatistics({ request, snapshotUrl, storage: storage(), now: () => now,
    timeoutMs: 20, onUpdate(value) { updates.push(value); displayed(value); },
    fetcher: async (url, options) => {
      if (url === snapshotUrl) return response(saved);
      return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('Network blocked')), { once: true });
      });
    },
  });
  assert.equal((await firstUpdate).stats.total, 15);
  assert.equal(updates[0].mode, 'snapshot');
  assert.equal((await loading).stats.total, 15);
  assert.equal(updates.length, 1);
});

test('live totals replace a snapshot and a late snapshot cannot overwrite them', async () => {
  const live = { ...totals, total: 16, countries: [{ country: 'CN', visitors: 9 }, { country: 'JP', visitors: 7 }] };
  const updates = [], s = storage();
  let finishSnapshot;
  const snapshot = new Promise(resolve => { finishSnapshot = resolve; });
  const done = loadVisitorStatistics({ request, snapshotUrl, storage: s, now: () => now,
    onUpdate(value) { updates.push(value); if (value.mode === 'live') finishSnapshot(response(saved)); },
    fetcher: async url => url === snapshotUrl ? snapshot : response(live),
  });
  assert.equal((await done).stats.total, 16);
  assert.deepEqual(updates.map(value => value.mode), ['live']);
  assert.equal(JSON.parse(s.getItem('xz-visitor-totals-v1')).total, 16);
});

test('failed POST retries a read-only GET without the counting body or custom headers', async () => {
  const calls = [];
  const result = await loadVisitorStatistics({ request, snapshotUrl, storage: storage(), now: () => now,
    onUpdate() {}, fetcher: async (url, options) => {
      if (url === snapshotUrl) return response(saved);
      calls.push(options);
      if (options.method === 'POST') throw new TypeError('Preflight failed');
      return response(totals);
    },
  });
  assert.equal(result.mode, 'live');
  assert.equal(calls[1].method, 'GET');
  assert.equal(calls[1].body, undefined);
  assert.equal(calls[1].headers, undefined);
  assert.equal(calls[1].credentials, 'omit');
});

test('cached totals survive both network failures; malformed data never replaces them', async () => {
  const s = storage();
  s.setItem('xz-visitor-totals-v1', JSON.stringify(saved));
  const result = await loadVisitorStatistics({ request, snapshotUrl, storage: s, now: () => now,
    onUpdate() {}, fetcher: async () => response({ ...saved, total: 1000000 }),
  });
  assert.equal(result.mode, 'cached');
  assert.equal(result.stats.total, 15);
  assert.throws(() => checkedStats({ ...totals, countries: [totals.countries[0], totals.countries[0]] }));
});

test('blocked browser storage does not prevent snapshot display', async () => {
  const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
  const result = await loadVisitorStatistics({ request, snapshotUrl, storage: blocked, now: () => now,
    onUpdate() {}, fetcher: async url => {
      if (url === snapshotUrl) return response(saved);
      throw new TypeError('Network blocked');
    },
  });
  assert.equal(result.stats.total, 15);
  assert.equal(result.mode, 'snapshot');
});

test('open pages retry every minute and when returning online, but hidden pages stay quiet', async () => {
  const doc = new EventTarget(), win = new EventTarget();
  doc.visibilityState = 'visible';
  let ticks, calls = 0, time = 0, cleared = false;
  const refresher = startVisitorRefresh({ refresh: async () => { calls++; }, document: doc, window: win,
    now: () => time,
    setTimer(callback, interval) { ticks = callback; assert.equal(interval, 60000); return 123; },
    clearTimer(id) { assert.equal(id, 123); cleared = true; },
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  time = 60000;
  ticks();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 2);
  doc.visibilityState = 'hidden';
  time = 120000;
  ticks();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 2);
  doc.visibilityState = 'visible';
  win.dispatchEvent(new Event('online'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 3);
  refresher.stop();
  assert.equal(cleared, true);
  time = 180000;
  ticks();
  win.dispatchEvent(new Event('focus'));
  assert.equal(calls, 3);
});

test('manual refresh works immediately and concurrent retries never duplicate the request', async () => {
  const doc = new EventTarget(), win = new EventTarget();
  doc.visibilityState = 'visible';
  let calls = 0, finish;
  const refresher = startVisitorRefresh({
    refresh: () => { calls++; return new Promise(resolve => { finish = resolve; }); },
    document: doc, window: win, setTimer: () => 1, clearTimer() {}, now: () => 0,
  });
  await refresher.refresh();
  win.dispatchEvent(new Event('online'));
  assert.equal(calls, 1);
  finish();
  await new Promise(resolve => setImmediate(resolve));
  const next = refresher.refresh();
  assert.equal(calls, 2);
  finish();
  await next;
  refresher.stop();
});

test('a Sites page can read a newer published snapshot while retaining its bundled offline copy', async () => {
  const publishedSnapshotUrl = 'https://published.example/visitor-snapshot.json';
  const newer = { total: 16, countries: [{ country: 'CN', visitors: 9 }, { country: 'JP', visitors: 7 }],
    updatedAt: '2026-10-21T09:30:00Z' };
  const result = await loadVisitorStatistics({ request, snapshotUrl, publishedSnapshotUrl,
    storage: storage(), now: () => now, onUpdate() {},
    fetcher: async url => {
      if (url === publishedSnapshotUrl) return response(newer);
      if (url === snapshotUrl) return response(saved);
      throw new TypeError('Network blocked');
    },
  });
  assert.equal(result.stats.total, 16);
  assert.equal(result.updatedAt, '2026-10-21T09:30:00.000Z');
});
