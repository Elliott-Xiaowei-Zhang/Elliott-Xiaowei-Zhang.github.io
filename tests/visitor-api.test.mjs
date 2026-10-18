import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleVisitorApi } from '../hosting/visitor-service/visitor-api.ts';

const origin = 'https://elliott-xiaowei-zhang.github.io';
const id = '3de6916e-b41a-4cf3-a134-2996d49459a7';
function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec('CREATE TABLE visitors (id TEXT PRIMARY KEY NOT NULL, country TEXT NOT NULL, first_seen TEXT NOT NULL)');
  return { prepare(query) {
    const statement = sql.prepare(query); let params = [];
    return { bind(...values) { params = values; return this; }, async run() { return statement.run(...params); }, async all() { return { results: statement.all(...params) }; } };
  } };
}
function request({ method='POST', country='CN', visitorId=id, headers={}, body }={}) {
  const req = new Request('https://counter.example/api/visitors', { method,
    headers: { Origin: origin, 'User-Agent': 'Mozilla/5.0', 'X-Visitor-Intent': 'count', 'Content-Type': 'application/json', ...headers },
    ...(method==='POST'?{body:body??JSON.stringify({visitorId})}:{}) });
  if(country) Object.defineProperty(req,'cf',{value:{country}});
  return req;
}
test('GitHub preflight is allowed without cookies; unlisted origins cannot write', async()=>{
  const db=database(), r=await handleVisitorApi(request({method:'OPTIONS'}),db);
  assert.equal(r.status,204);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
  assert.equal(r.headers.get('Access-Control-Allow-Credentials'),null);
  assert.equal((await handleVisitorApi(request({headers:{Origin:'https://unrelated.example'}}),db)).status,403);
  assert.equal((await handleVisitorApi(request({headers:{Origin:'http://localhost:8000'}}),db)).status,403);
});
test('stable first-party browser IDs prevent refresh inflation and aggregate real edge countries',async()=>{
  const db=database();
  assert.equal((await (await handleVisitorApi(request(),db)).json()).total,1);
  assert.equal((await (await handleVisitorApi(request({country:'US'}),db)).json()).total,1);
  const r=await handleVisitorApi(request({visitorId:crypto.randomUUID(),country:'HK'}),db);
  const value=await r.json();
  assert.equal(value.total,2);
  assert.deepEqual(value.countries,[{country:'CN',visitors:1},{country:'HK',visitors:1}]);
  assert.equal(JSON.stringify(value).includes(id),false);
  assert.equal(r.headers.get('Set-Cookie'),null);
});
test('local preview, privacy opt-outs, and bots never create visitor records',async()=>{
  const db=database();
  for(const req of [request({method:'GET',headers:{Origin:'http://localhost:8000'}}),request({headers:{DNT:'1'}}),request({headers:{'Sec-GPC':'1'}}),request({headers:{'User-Agent':'Googlebot'}})]) {
    assert.equal((await (await handleVisitorApi(req,db)).json()).total,0);
  }
});
test('invalid input and browser-supplied geography are rejected; missing geography remains unknown',async()=>{
  const db=database();
  assert.equal((await handleVisitorApi(request({visitorId:'not-a-uuid'}),db)).status,400);
  assert.equal((await handleVisitorApi(request({body:JSON.stringify({visitorId:id,country:'US'})}),db)).status,400);
  assert.equal((await handleVisitorApi(request({body:'{'}),db)).status,400);
  assert.deepEqual((await (await handleVisitorApi(request({country:null}),db)).json()).countries,[{country:'ZZ',visitors:1}]);
});
test('database errors remain explicit and retain the authorized CORS header',async()=>{
  const r=await handleVisitorApi(request(),{prepare(){throw new Error('Unavailable');}});
  assert.equal(r.status,503); assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
});

test('forwarded Cloudflare geography fills unknown records without increasing the count',async()=>{
  const db=database();
  assert.deepEqual((await (await handleVisitorApi(request({country:null}),db)).json()).countries,[{country:'ZZ',visitors:1}]);
  const corrected=await (await handleVisitorApi(request({country:null,headers:{'CF-IPCountry':'CN'}}),db)).json();
  assert.equal(corrected.total,1);
  assert.deepEqual(corrected.countries,[{country:'CN',visitors:1}]);
  assert.deepEqual((await (await handleVisitorApi(request({country:null,headers:{'CF-IPCountry':'HK'}}),db)).json()).countries,[{country:'CN',visitors:1}]);
});
