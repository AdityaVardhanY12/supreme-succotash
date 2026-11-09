import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {decide} from './jev.mjs';
import {validateState} from './public/game.js';
const files={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/game.js':['game.js','text/javascript'],'/style.css':['style.css','text/css']};
export function createServer(decider=decide) {
  let active=0;
  return http.createServer(async(req,res)=>{
    const send=(status,data,type='application/json')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; connect-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});res.end(type==='application/json'?JSON.stringify(data):data);};
    // Exact local Host/Origin validation blocks cross-site use and DNS rebinding.
    const expected=`127.0.0.1:${res.socket.localPort}`;
    if(req.headers.host!==expected || (req.headers.origin && req.headers.origin!==`http://${expected}`)) return send(403,{error:'Use the local 127.0.0.1 address printed at startup.'});
    if(req.method==='POST' && req.url==='/api/decide') {
      if(!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'JSON required.'});
      if(active>=4) return send(429,{error:'Too many pending turns.'});
      const key=req.headers.authorization?.match(/^Bearer ([\x21-\x7e]{1,512})$/)?.[1];
      if(!key) return send(401,{error:'Enter your TypeSafe API key.'});
      active++;
      try {
        let bytes=0, chunks=[];
        for await(const chunk of req){bytes+=chunk.length;if(bytes>8192){send(413,{error:'Request too large.'});return;}chunks.push(chunk);}
        let state; try {state=JSON.parse(Buffer.concat(chunks).toString());} catch {return send(400,{error:'Invalid JSON.'});}
        if(!validateState(state)) return send(400,{error:'Invalid game state.'});
        try {return send(200,await decider(state,key));} catch(e) {return send(502,{error:e.message});}
      } catch {if(!res.headersSent) send(400,{error:'Request interrupted.'});}
      finally {active--;}
    } else if(req.method==='GET' && files[req.url]) {
      const [name,type]=files[req.url];
      try {send(200,await readFile(new URL(`./public/${name}`,import.meta.url)),type);} catch {send(500,{error:'Asset unavailable.'});}
    } else send(404,{error:'Not found.'});
  });
}
if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) {
  const server=createServer(); server.requestTimeout=15000; server.headersTimeout=10000;
  server.listen(3000,'127.0.0.1',()=>console.log('JEV Dungeon Escape: http://127.0.0.1:3000'));
}
