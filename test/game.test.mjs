import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,legal,playerTurn,guardianTurn,demoAction,move,distance,validateState} from '../public/game.js';
test('walls and invalid actions do not advance time',()=>{const s=initial();assert.equal(playerTurn(s,'up'),s);assert.equal(playerTurn(s,'teleport'),s);});
test('cores collect once and locked exit does not win',()=>{let s={...initial(),player:{x:8,y:1}};s=playerTurn(s,'right');assert.equal(s.cores.length,2);assert.equal(playerTurn(s,'wait').cores.length,2);assert.equal(playerTurn({...initial(),player:{x:8,y:7},guardian:{x:1,y:1}},'right').status,'playing');});
test('unlocked exit wins and terminal state cannot change',()=>{const s=playerTurn({...initial(),player:{x:8,y:7},guardian:{x:1,y:1},cores:[]},'right');assert.equal(s.status,'won');assert.equal(guardianTurn(s,'left'),s);assert.equal(playerTurn(s,'left'),s);});
test('collision loses from either actor',()=>{assert.equal(playerTurn({...initial(),guardian:{x:2,y:1}},'right').status,'lost');assert.equal(guardianTurn({...initial(),guardian:{x:2,y:1}},'left').status,'lost');});
test('demo guardian follows a legal shortest path',()=>{const s=initial(),a=demoAction(s);assert.ok(legal(s.guardian).includes(a));assert.equal(distance(move(s.guardian,a),s.player),distance(s.guardian,s.player)-1);});
test('malformed positions rejected',()=>{assert.equal(validateState(null),false);assert.equal(validateState({...initial(),player:{x:0,y:0}}),false);assert.equal(validateState(initial()),true);});
test('a complete winning route exists against demo guardian',()=>{
  const queue=[{s:initial(),path:[]}],seen=new Set();let won=false;
  for(let i=0;i<queue.length && i<100000;i++) {
    const {s,path}=queue[i];if(s.status==='won'){won=true;break;}if(s.status!=='playing')continue;
    const key=JSON.stringify([s.player,s.guardian,s.cores,s.turns%2]);if(seen.has(key))continue;seen.add(key);
    for(const a of legal(s.player)){let next=playerTurn(s,a);if(next.status==='playing' && next.turns%2===0)next=guardianTurn(next,demoAction(next));queue.push({s:next,path:[...path,a]});}
  }
  assert.ok(won,'Dungeon should be escapable');
});
