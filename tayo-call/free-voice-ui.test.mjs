import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));const elements=new Map();
let resolveAudio,created=0,calls=0;
const el=()=>({value:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},focus(){},append(){},querySelector(){return {textContent:''};}});
const document={hidden:false,createElement:el,getElementById(id){assert.ok(ids.has(id));if(!elements.has(id))elements.set(id,el());return elements.get(id);},addEventListener(name,fn){fn();}};
const context={document,localStorage:{getItem(){return JSON.stringify({speechRecognition:true,engine:'supertonic'});},setItem(){}},window:{addEventListener(){},speechSynthesis:{getVoices(){return [];},cancel(){}}},navigator:{mediaDevices:{getUserMedia(){return Promise.reject(new Error('camera unavailable'));}}},TayoCharacter:class{stopTalking(){}destroy(){}},setInterval(){return 1;},clearInterval(){},setTimeout(){return 1;},clearTimeout(){},cancelAnimationFrame(){},AbortController,Audio:class{constructor(){created++;}},fetch:async(path,options)=>{
 if(path==='/api/status')return {json:async()=>({models:['qwen3:4b-instruct-2507-q4_K_M'],stt:false,provider:'openai',apiConfigured:true,apiModel:'gpt-5.4-mini'})};
 calls++;assert.equal(path,'/api/tts');assert.equal(JSON.parse(options.body).engine,'supertonic');assert.equal(JSON.parse(options.body).actor,'tayo');
 return {ok:true,blob:()=>new Promise(resolve=>resolveAudio=resolve)};
}};
vm.runInNewContext(await readFile(new URL('./app.js',import.meta.url),'utf8'),context);
await elements.get('btn-accept-call').onclick();await new Promise(resolve=>setImmediate(resolve));
assert.equal(calls,1);elements.get('btn-end-call').onclick();resolveAudio({});await new Promise(resolve=>setImmediate(resolve));
assert.equal(created,0);console.log('Free voice remains selected with OpenAI conversation and late audio never plays after hangup: PASS');
