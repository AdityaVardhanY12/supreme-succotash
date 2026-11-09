import {MAP,legal,move,validateState} from './public/game.js';
export const ENDPOINT='https://api.typesafe.ai/v1/systemone';
export function requestFor(state) {
  if(!validateState(state)) throw new Error('Invalid game state');
  const actions=legal(state.guardian);
  return {model:'jev-latest', state:{map:MAP,player:state.player,guardian:state.guardian,cores:state.cores,candidates:Object.fromEntries(actions.map(a=>[a,move(state.guardian,a)]))},
    questions:Object.fromEntries(actions.map(a=>[a,{type:'noul', instructions:`Is moving ${a} the best next move for the guardian to catch the player? Walls (#) cannot be crossed. Favor a shortest traversable path to the player; avoid waiting unless needed.`}]))};
}
export async function decide(state,key,fetcher=fetch) {
  const body=requestFor(state);
  let response;
  try {
    response=await fetcher(ENDPOINT,{method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  } catch { throw new Error('JEV request timed out or could not connect. Retry this turn.'); }
  if(!response.ok) throw new Error(response.status===401 || response.status===403 ? 'JEV rejected the API key.' : response.status===429 ? 'JEV rate limit reached. Wait before retrying.' : 'JEV service unavailable. Retry this turn.');
  let data; try {data=await response.json();} catch {throw new Error('Invalid JEV response.');}
  const scores=Object.keys(body.questions).map(action=>({action,score:data.answers?.[action]?.noul}));
  if(scores.some(x=>typeof x.score!=='number' || !Number.isFinite(x.score) || x.score<0 || x.score>1 || data.answers[x.action].type!=='noul')) throw new Error('Invalid JEV response.');
  scores.sort((a,b)=>b.score-a.score);
  return {action:scores[0].action,scores,model:typeof data.model==='string'?data.model:'jev-latest'};
}
