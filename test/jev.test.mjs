import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,legal} from '../public/game.js';
import {requestFor,decide,ENDPOINT} from '../jev.mjs';
test('official noul request and legal maximum score selection',async()=>{
  const s=initial(),actions=legal(s.guardian),body=requestFor(s);
  assert.equal(body.model,'jev-latest');assert.deepEqual(Object.keys(body.questions),actions);
  const result=await decide(s,'test-secret',async(url,options)=>{
    assert.equal(url,ENDPOINT);assert.equal(options.headers.Authorization,'Bearer test-secret');
    assert.equal(options.redirect,'error');assert.ok(!options.body.includes('test-secret'));
    assert.equal(JSON.parse(options.body).questions.wait.type,'noul');
    return {ok:true,json:async()=>({model:'test-model',answers:Object.fromEntries(actions.map((a,i)=>[a,{type:'noul',noul:i/(actions.length-1)}]))})};
  });assert.equal(result.action,actions.at(-1));
});
test('provider errors redact bodies and malformed scores fail closed',async()=>{
  for(const status of [401,403,429,500])await assert.rejects(()=>decide(initial(),'secret',async()=>({ok:false,status,json:async()=>({error:'secret'})})),e=>!e.message.includes('secret'));
  for(const answer of [{}, {answers:{wait:{type:'noul',noul:2}}}])await assert.rejects(()=>decide(initial(),'secret',async()=>({ok:true,json:async()=>answer})),/Invalid JEV response/);
  await assert.rejects(()=>decide(initial(),'secret',async()=>{throw new Error('secret');}),e=>!e.message.includes('secret'));
});
