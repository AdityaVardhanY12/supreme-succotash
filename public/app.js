import {MAP,initial,same,legal,playerTurn,guardianTurn,demoAction} from './game.js';
const $=id=>document.getElementById(id);
let state=initial(),busy=false,pending=false,controller=null,epoch=0;
function render(message) {
  $('board').replaceChildren(...MAP.flatMap((row,y)=>[...row].map((tile,x)=>{
    const p={x,y}, cell=document.createElement('span');let cls=tile==='#'?'wall':'floor', symbol='';
    if(same(p,state.exit)){cls='exit';symbol='▣';}
    if(state.cores.some(c=>same(c,p))){cls='core';symbol='◆';}
    if(same(p,state.player)){cls='player';symbol='●';}
    if(same(p,state.guardian)){cls='guardian';symbol='▲';}
    cell.className=`cell ${cls}`;cell.textContent=symbol;return cell;
  })));
  $('board').setAttribute('aria-label',`You at column ${state.player.x}, row ${state.player.y}. Guardian at column ${state.guardian.x}, row ${state.guardian.y}. ${state.cores.length} cores remaining.`);
  $('stats').textContent=`${3-state.cores.length}/3 CORES · TURN ${state.turns}`;
  $('modeLabel').textContent=$('mode').value==='demo'?'DEMO GUARDIAN':'LIVE JEV GUARDIAN';
  $('message').textContent=message || (state.status==='won'?'You escaped! The dungeon is behind you.':state.status==='lost'?'Caught by the guardian. Try another route.':'Gather the cores. Stay one step ahead.');
  document.querySelectorAll('[data-action]').forEach(b=>b.disabled=busy || pending || state.status!=='playing' || !legal(state.player).includes(b.dataset.action));
  $('retry').hidden=!pending || busy;
  $('mode').disabled=busy || pending;
}
async function guardian() {
  const run=epoch;pending=true;busy=true;render('The guardian is deciding…');
  try {
    let action;
    if($('mode').value==='demo') {action=demoAction(state);$('telemetry').textContent=`Demo chose ${action}. No API call.`;}
    else {
      const key=$('key').value.trim();if(!key) throw new Error('Enter your TypeSafe key, then retry—or start a new demo.');
      controller=new AbortController();
      const response=await fetch('/api/decide',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify(state),signal:controller.signal});
      const data=await response.json();if(!response.ok) throw new Error(data.error || 'Request failed.');
      if(!legal(state.guardian).includes(data.action)) throw new Error('Guardian returned an illegal move.');
      if(run!==epoch)return;
      action=data.action;$('telemetry').textContent=`${data.model} chose ${action}. Scores: ${data.scores.map(x=>`${x.action} ${(x.score*100).toFixed(0)}%`).join(' · ')}. Scores assess moves; they are not win odds.`;
    }
    if(run!==epoch)return;
    state=guardianTurn(state,action);pending=false;busy=false;render();
  } catch(e) {if(run!==epoch)return;busy=false;render(e.name==='AbortError'?'Request cancelled.':e.message);}
}
async function turn(action) {
  if(busy || pending || state.status!=='playing')return;
  const next=playerTurn(state,action);if(next===state)return;state=next;
  if(state.status==='playing' && state.turns%2===0)await guardian();else render();
}
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>turn(b.dataset.action)));
document.addEventListener('keydown',e=>{
  if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey)return;
  const action={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',' ':'wait'}[e.key];
  if(action){e.preventDefault();if(!e.repeat)turn(action);}
});
$('restart').onclick=()=>{epoch++;controller?.abort();state=initial();busy=false;pending=false;$('telemetry').textContent='New run ready.';render();};
$('retry').onclick=guardian;
$('clear').onclick=()=>{$('key').value='';};
$('mode').onchange=()=>{render();$('telemetry').textContent=$('mode').value==='demo'?'Demo mode makes no API calls.':'One live request per guardian turn. No automatic retries.';};
window.addEventListener('pagehide',()=>{$('key').value='';controller?.abort();});
render();
