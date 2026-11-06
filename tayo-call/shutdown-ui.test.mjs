import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=await readFile(new URL('index.html',import.meta.url),'utf8');const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));const elements=new Map();
let stopped=false,closed=false,exits=0;
const el=()=>({value:'',style:{},classList:{add(){},remove(){},toggle(){}},focus(){},append(){},querySelector(){return {textContent:''};}});
const document={createElement:el,getElementById(id){assert.ok(ids.has(id));if(!elements.has(id))elements.set(id,el());return elements.get(id);},addEventListener(name,fn){fn();}};
const context={document,localStorage:{getItem(){return null;}},window:{close(){closed=true;},addEventListener(){},speechSynthesis:{getVoices(){return [];},cancel(){}}},setTimeout(fn){return setImmediate(fn);},clearTimeout,clearInterval,cancelAnimationFrame(){},AbortSignal,fetch:async(path,options)=>{
 if(path==='/api/shutdown'){assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{});stopped=true;exits++;return {ok:true,json:async()=>({shuttingDown:true})};}
 if(stopped)throw new Error('connection refused');return {json:async()=>({provider:'ollama',models:[],stt:false})};
}};
vm.runInNewContext(await readFile(new URL('app.js',import.meta.url),'utf8'),context);
await new Promise(resolve=>setImmediate(resolve));await elements.get('btn-exit-entry').onclick();
assert.equal(exits,1);assert.equal(closed,true);assert.equal(elements.get('btn-accept-call').disabled,true);assert.ok(elements.get('entry-status').textContent.includes('서버를 종료'));
console.log('Complete exit stops the UI and requests server shutdown: PASS');
