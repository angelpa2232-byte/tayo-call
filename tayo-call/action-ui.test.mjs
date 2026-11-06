import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {advanceStory} from './story.mjs';
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
const elements=new Map(),timeouts=new Map(),requests=[];let nextId=1;
const el=()=>({value:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},focus(){},append(){},querySelector(){return {textContent:''};}});
const document={hidden:false,createElement:el,getElementById(id){assert.ok(ids.has(id));if(!elements.has(id))elements.set(id,el());return elements.get(id);},addEventListener(name,fn){fn();}};
const context={document,localStorage:{getItem(){return JSON.stringify({speechRecognition:true,engine:"windows"});}},window:{addEventListener(){},speechSynthesis:{getVoices(){return [];},cancel(){}}},navigator:{mediaDevices:{getUserMedia(){return Promise.reject(new Error('no camera'));}}},TayoCharacter:class{stopTalking(){}destroy(){}},setInterval(){return 99;},clearInterval(){},setTimeout(fn,ms){const id=nextId++;timeouts.set(id,{fn,ms});return id;},clearTimeout(id){timeouts.delete(id);},cancelAnimationFrame(){},AbortController,fetch:async(path,options)=>{
 if(path==='/api/status')return {json:async()=>({configured:true,models:['qwen3:4b-instruct-2507-q4_K_M'],stt:false})};
 const request=JSON.parse(options.body);requests.push(request);const state=request.kind==='scene'?request.story:{actor:'frank',mode:'event',scene:'rescue',event:'frank-0',step:0,round:0,turns:0};return {ok:true,json:async()=>({reply:'프랭크 출동! 삐뽀삐뽀!',visual:state,story:advanceStory(state,'scene')})};
}};
vm.runInNewContext(await readFile(new URL('./app.js',import.meta.url),'utf8'),context);
await elements.get('btn-accept-call').onclick();
const run=ms=>{const entry=[...timeouts].find(([,t])=>t.ms===ms);assert.ok(entry,`Timer ${ms} exists`);timeouts.delete(entry[0]);entry[1].fn();};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
run(2500);document.getElementById('text-input').value='출동해';elements.get('text-form').onsubmit({preventDefault(){}});await flush();
assert.equal(requests.length,1);assert.equal(requests[0].kind,'child');
for(let step=1;step<=3;step++){
 run(2500);run(3000);await flush();
 assert.equal(requests.at(-1).kind,'scene');assert.equal(requests.at(-1).story.step,step);
 assert.ok(!elements.get('last-utterance').textContent.includes('진행 신호'));
}
run(2500);assert.equal([...timeouts.values()].some(t=>t.ms===3000),false);
document.getElementById('text-input').value='출동해';elements.get('text-form').onsubmit({preventDefault(){}});await flush();run(2500);
assert.equal([...timeouts.values()].some(t=>t.ms===3000),true);
elements.get('btn-parent-settings').onclick();assert.equal([...timeouts.values()].some(t=>t.ms===3000),false);
elements.get('btn-close-settings').onclick();assert.equal([...timeouts.values()].some(t=>t.ms===3000),true);
elements.get('btn-end-call').onclick();assert.equal([...timeouts.values()].some(t=>t.ms===3000),false);
console.log('Action scenes advance after speech, preserve child speech, pause in settings and cancel on hangup: PASS');
