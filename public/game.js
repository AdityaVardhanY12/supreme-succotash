export const MAP = [
  '###########',
  '#.........#',
  '#.###.###.#',
  '#...#.....#',
  '###.#.###.#',
  '#.........#',
  '#.###.#.#.#',
  '#.....#...#',
  '###########'
];
export const DIRECTIONS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0], wait:[0,0] };
export const same = (a,b) => a.x === b.x && a.y === b.y;
export function open(p) { return MAP[p.y]?.[p.x] === '.'; }
export function legal(p) {
  return Object.entries(DIRECTIONS).filter(([,d])=>open({x:p.x+d[0],y:p.y+d[1]})).map(([a])=>a);
}
export function move(p,a) {
  const d=DIRECTIONS[a];
  return d && legal(p).includes(a) ? {x:p.x+d[0],y:p.y+d[1]} : p;
}
export function initial() {
  return {player:{x:1,y:1}, guardian:{x:9,y:7}, cores:[{x:9,y:1},{x:1,y:7},{x:5,y:3}], exit:{x:9,y:7}, turns:0, status:'playing'};
}
export function playerTurn(s,a) {
  if(s.status!=='playing' || !legal(s.player).includes(a)) return s;
  const player=move(s.player,a), cores=s.cores.filter(c=>!same(c,player));
  const status=same(player,s.guardian)?'lost':!cores.length && same(player,s.exit)?'won':'playing';
  return {...s,player,cores,status,turns:s.turns+1};
}
export function guardianTurn(s,a) {
  if(s.status!=='playing') return s;
  const guardian=move(s.guardian,a);
  return {...s,guardian,status:same(guardian,s.player)?'lost':s.status};
}
export function distance(start,target) {
  const queue=[[start,0]], seen=new Set([`${start.x},${start.y}`]);
  for(let i=0;i<queue.length;i++) {
    const [p,n]=queue[i]; if(same(p,target)) return n;
    for(const a of legal(p).filter(a=>a!=='wait')) {
      const next=move(p,a), key=`${next.x},${next.y}`;
      if(!seen.has(key)){seen.add(key);queue.push([next,n+1]);}
    }
  }
  return 999;
}
export function demoAction(s) {
  return legal(s.guardian).filter(a=>a!=='wait').sort((a,b)=>distance(move(s.guardian,a),s.player)-distance(move(s.guardian,b),s.player))[0] || 'wait';
}
export function validateState(s) {
  const pos=p=>p && Number.isInteger(p.x) && Number.isInteger(p.y) && open(p);
  return !!s && pos(s.player) && pos(s.guardian) && Array.isArray(s.cores) && s.cores.length<=3 && s.cores.every(pos);
}
