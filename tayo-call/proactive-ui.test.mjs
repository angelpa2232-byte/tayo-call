import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
const elements=new Map(),timeouts=new Map(),requests=[];let nextId=1;
const el=()=>({value:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},focus(){},append(){},querySelector(){return {textContent:''};}});
const document={hidden:false,createElement:el,getElementById(id){assert.ok(ids.has(id));if(!elements.has(id))elements.set(id,el());return elements.get(id);},addEventListener(name,fn){fn();}};
const context={document,localStorage:{getItem(){return JSON.stringify({speechRecognition:true,engine:"windows"});}},window:{addEventListener(){},speechSynthesis:{getVoices(){return [];},cancel(){}}},navigator:{mediaDevices:{getUserMedia(){return Promise.reject(new Error('no camera'));}}},TayoCharacter:class{stopTalking(){}destroy(){}},setInterval(){return 99;},clearInterval(){},setTimeout(fn,ms){const id=nextId++;timeouts.set(id,{fn,ms});return id;},clearTimeout(id){timeouts.delete(id);},cancelAnimationFrame(){},AbortController,fetch:async(path,options)=>{
 if(path==='/api/status')return {json:async()=>({configured:true,models:['qwen3:4b-instruct-2507-q4_K_M'],stt:false})};
 requests.push(JSON.parse(options.body));return {ok:true,json:async()=>({reply:'로기를 함께 응원해볼까?',story:{scene:'repair',step:1,round:0}})};
}};
vm.runInNewContext(await readFile(new URL('./app.js',import.meta.url),'utf8'),context);
await elements.get('btn-accept-call').onclick();
const run=ms=>{const entry=[...timeouts].find(([,t])=>t.ms===ms);assert.ok(entry,`Timer ${ms} exists`);timeouts.delete(entry[0]);entry[1].fn();};
run(2500);run(9000);await new Promise(resolve=>setImmediate(resolve));
assert.equal(requests.length,1);assert.equal(requests[0].kind,'idle');assert.equal(requests[0].story.scene,'daily');
assert.ok(!elements.get('last-utterance').textContent.includes('프로그램'));
elements.get('btn-end-call').onclick();assert.equal([...timeouts.values()].some(x=>x.ms===9000||x.ms===12000||x.ms===16000),false);
console.log('Silent child receives a scene prompt; prompt is not recorded as child speech; hangup cancels prompts: PASS');

