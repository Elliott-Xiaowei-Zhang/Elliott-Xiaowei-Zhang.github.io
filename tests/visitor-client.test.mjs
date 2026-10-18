import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visitorRequest } from '../visitor-client.js';

const id='5d6a87d8-e9a4-43c0-a809-65f34b1bd0bd';
const settings={endpoint:'https://statistics.example/api/visitors',baseUrl:'https://elliott-xiaowei-zhang.github.io/MyHomepage/visitors.js',pageUrl:'https://elliott-xiaowei-zhang.github.io/MyHomepage/',now:100000,randomUUID:()=>id};
function storage() {const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};}
test('GitHub Pages uses the configured API and stable first-party IDs without cross-site credentials',()=>{
  const s=storage(),first=visitorRequest({...settings,storage:s}),again=visitorRequest({...settings,storage:s,randomUUID:()=>{throw new Error('should reuse');}});
  assert.equal(first.url.href,settings.endpoint);assert.equal(first.options.credentials,'omit');
  assert.equal(first.options.mode,'cors');assert.equal(first.options.body,again.options.body);
  assert.equal(JSON.parse(first.options.body).visitorId,id);
});
test('local preview and privacy opt-outs read totals without touching browser storage',()=>{
  const s={getItem(){throw new Error('must not read');},setItem(){throw new Error('must not write');}};
  for(const options of [{pageUrl:'http://127.0.0.1:8000/'},{pageUrl:'http://localhost:8000/MyHomepage/'},{optedOut:true}]) {
    assert.equal(visitorRequest({...settings,storage:s,...options}).options.method,'GET');
  }
});
test('blocked storage does not inflate counts, and expired IDs rotate',()=>{
  const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
  assert.equal(visitorRequest({...settings,storage:blocked}).options.method,'GET');
  const s=storage();s.setItem('xz-visitor-v1',JSON.stringify({id,expires:settings.now-1}));
  const next='d217d515-1b83-4520-9be1-113b788de076';
  assert.equal(JSON.parse(visitorRequest({...settings,storage:s,randomUUID:()=>next}).options.body).visitorId,next);
});
