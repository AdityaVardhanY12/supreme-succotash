import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {initial} from '../public/game.js';
test('HTTP assets, validation, origin protection and BYOK forwarding',async()=>{
  let calls=0;
  const server=createServer(async(s,key)=>{calls++;assert.equal(key,'test-key');assert.deepEqual(s,initial());return {action:'up',scores:[],model:'mock'};});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    for(const path of ['/','/app.js','/game.js','/style.css']){const r=await fetch(base+path);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.ok(r.headers.get('content-security-policy'));}
    assert.equal((await fetch(base+'/.env')).status,404);
    const post=(body,headers={})=>fetch(base+'/api/decide',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-key',...headers},body});
    assert.equal((await post(JSON.stringify(initial()),{Origin:'https://evil.example'})).status,403);
    assert.equal((await post('{}',{Authorization:''})).status,401);
    assert.equal((await post('{')).status,400);
    assert.equal((await post('{}')).status,400);
    assert.equal((await post('x'.repeat(9000))).status,413);
    const result=await post(JSON.stringify(initial()));assert.equal(result.status,200);assert.equal((await result.json()).action,'up');assert.equal(calls,1);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
