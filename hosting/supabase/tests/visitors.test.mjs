import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisitorHandler } from '../functions/visitors/handler.mjs';
import { countryFromGateway } from '../functions/visitors/country.mjs';

const origin = 'https://elliott-xiaowei-zhang.github.io';
const id = '6af2a21a-1612-45a3-a36a-ad5507692301';

test('country is resolved offline for IPv4 and IPv6 and never calls a lookup service', () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => assert.fail('Country lookup must not send network requests');
  try {
    for (const [address, country] of [['114.114.114.114', 'CN'], ['8.8.8.8', 'US'], ['2001:4860:4860::8888', 'US']]) {
      assert.equal(countryFromGateway(request('GET', { headers: { 'X-Forwarded-For': address,
        'cf-ipcountry': 'ZZ' } })), country);
    }
    for (const address of ['', 'invalid', '203.0.113.1', '127.0.0.1', '192.168.1.1', '::1']) {
      assert.equal(countryFromGateway(request('GET', { headers: { 'X-Forwarded-For': address } })), 'ZZ');
    }
  } finally { globalThis.fetch = originalFetch; }
});

function fixture({ resolve = async () => 'CN', initial = [] } = {}) {
  const rows = new Map(initial.map(row => [row.id, row.country]));
  const calls = [];
  const handle = createVisitorHandler({
    previousCountry: async id => rows.get(id),
    record: async (id, country) => {
      calls.push(id);
      if (!rows.has(id) || rows.get(id) === 'ZZ') rows.set(id, country);
    },
    totals: async () => {
      const counts = new Map();
      for (const country of rows.values()) counts.set(country, (counts.get(country) || 0) + 1);
      return { total: rows.size, since: null,
        countries: [...counts].map(([country, visitors]) => ({ country, visitors })) };
    },
    resolveCountry: resolve,
  });
  return { handle, rows, calls };
}

function request(method = 'POST', options = {}) {
  return new Request('https://example.supabase.co/functions/v1/visitors', {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json',
      'X-Visitor-Intent': 'count', 'User-Agent': 'Mozilla/5.0', ...options.headers },
    ...(method === 'POST' ? { body: options.body ?? JSON.stringify({ visitorId: id }) } : {}),
  });
}

test('concurrent repeated calls deduplicate and reads never count', async () => {
  const { handle, calls } = fixture();
  assert.equal((await (await handle(request('GET'))).json()).total, 0);
  assert.equal(calls.length, 0);
  const responses = await Promise.all(Array.from({ length: 12 }, () => handle(request())));
  assert.ok(responses.every(response => response.status === 200));
  assert.equal((await (await handle(request('GET'))).json()).total, 1);
});

test('preflight and counting require a configured homepage origin', async () => {
  const { handle, rows } = fixture();
  const preflight = await handle(request('OPTIONS'));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal((await handle(request('OPTIONS', { headers: { Origin: 'https://unrelated.example' } }))).status, 403);
  assert.equal((await handle(request('POST', { headers: { Origin: 'https://unrelated.example' } }))).status, 403);
  assert.equal((await handle(request('POST', { headers: { Origin: 'http://localhost:8080' } }))).status, 403);
  assert.equal((await handle(request('GET', { headers: { Origin: 'http://localhost:8080' } }))).status, 200);
  assert.equal(rows.size, 0);
});

test('explicit intent, JSON and a random UUID are required', async () => {
  const { handle, rows } = fixture();
  assert.equal((await handle(request('POST', { headers: { 'X-Visitor-Intent': '' } }))).status, 403);
  assert.equal((await handle(request('POST', { headers: { 'Content-Type': 'text/plain' } }))).status, 415);
  assert.equal((await handle(request('POST', { body: '{' }))).status, 400);
  assert.equal((await handle(request('POST', { body: JSON.stringify({ visitorId: id, country: 'US' }) }))).status, 400);
  assert.equal((await handle(request('POST', { body: JSON.stringify({ visitorId: 'invalid' }) }))).status, 400);
  assert.equal((await handle(request('DELETE'))).status, 405);
  assert.equal(rows.size, 0);
});

test('opt-out and identified bots read without counting or resolving location', async () => {
  const { handle, rows } = fixture({ resolve: () => assert.fail('Must not resolve') });
  for (const headers of [{ DNT: '1' }, { 'Sec-GPC': '1' }, { 'User-Agent': 'SearchBot' }]) {
    assert.equal((await handle(request('POST', { headers }))).status, 200);
  }
  assert.equal(rows.size, 0);
});

test('location lookup failure still counts, then unknown country can be filled', async () => {
  let available = false;
  const { handle } = fixture({ resolve: async () => {
    if (!available) throw new Error('Network unavailable');
    return 'CN';
  } });
  assert.deepEqual((await (await handle(request())).json()).countries, [{ country: 'ZZ', visitors: 1 }]);
  available = true;
  const value = await (await handle(request())).json();
  assert.equal(value.total, 1);
  assert.deepEqual(value.countries, [{ country: 'CN', visitors: 1 }]);
});

test('migrated known visitors retain their identity and country', async () => {
  const { handle } = fixture({ initial: [{ id, country: 'JP' }], resolve: () => assert.fail('Already known') });
  const value = await (await handle(request())).json();
  assert.equal(value.total, 1);
  assert.deepEqual(value.countries, [{ country: 'JP', visitors: 1 }]);
  assert.ok(!JSON.stringify(value).includes(id));
});

test('read responses disable caches and database failures return a safe error', async () => {
  const { handle } = fixture();
  const response = await handle(request('GET'));
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const unavailable = createVisitorHandler({ totals: async () => { throw new Error('Private database details'); } });
  const failed = await unavailable(request('GET'));
  assert.equal(failed.status, 503);
  assert.deepEqual(await failed.json(), { error: 'Visitor statistics are temporarily unavailable' });
});
