import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {sceneView,sceneSvg} from './scene-visuals.mjs';
test('scene motion waits for actual audio playback, pauses in settings and stays stopped after hangup',async()=>{
 const elements=new Map(),selectors=new Map(),audio=[];let resolveVoice;
 const el=()=>{const classes=new Set();return {value:'',textContent:'',style:{},classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},toggle(n,on){if(on===undefined)on=!classes.has(n);on?classes.add(n):classes.delete(n);},contains(n){return classes.has(n);}},focus(){},append(){},querySelector(){return {textContent:''};}};};
 const document={hidden:false,createElement:el,querySelector(s){if(!selectors.has(s))selectors.set(s,el());return selectors.get(s);},getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id);},addEventListener(n,fn){fn();}};
 const context={document,localStorage:{getItem:()=>JSON.stringify({speechRecognition:true,engine:'openai'})},window:{addEventListener(){},SceneVisuals:{sceneView,sceneSvg},speechSynthesis:{getVoices:()=>[],cancel(){}}},navigator:{mediaDevices:{getUserMedia:async()=>{throw Error('no camera');}}},TayoCharacter:class{stopTalking(){}destroy(){}},Audio:class{constructor(){audio.push(this);}play(){return Promise.resolve();}pause(){}},AudioContext:class{resume(){return Promise.resolve();}close(){return Promise.resolve();}createAnalyser(){return {fftSize:256,connect(){},getByteTimeDomainData(b){b.fill(128);}};}createMediaElementSource(){return {connect(){}};}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},cancelAnimationFrame(){},requestAnimationFrame(){return 1;},AbortController,fetch:async path=>{
  if(path==='/api/status')return {json:async()=>({provider:'openai',apiConfigured:true,models:[],stt:false})};
  if(path==='/api/tts')return {ok:true,blob:()=>new Promise(r=>resolveVoice=r)};
  const state={actor:'rogi',mode:'event',event:'rogi-0',scene:'repair',step:1};return {ok:true,json:async()=>({reply:'헌 타이어를 빼고 있어!',visual:state,story:{...state,step:2}})};
 }};
 vm.runInNewContext(await readFile(new URL('app.js',import.meta.url),'utf8'),context);
 const flush=()=>new Promise(r=>setImmediate(r));await elements.get('btn-accept-call').onclick();await flush();resolveVoice({});await flush();audio.at(-1).onended();
 document.getElementById('text-input').value='타이어 고쳐줘';elements.get('text-form').onsubmit({preventDefault(){}});await flush();
 const art=elements.get('scene-art');assert.equal(art.classList.contains('scene-waiting'),true);assert.match(art.innerHTML,/wheel-detach/);
 resolveVoice({});await flush();assert.equal(art.classList.contains('scene-waiting'),false);
 elements.get('btn-parent-settings').onclick();assert.equal(art.classList.contains('scene-suspended'),true);
 elements.get('btn-close-settings').onclick();assert.equal(art.classList.contains('scene-suspended'),false);
 elements.get('btn-end-call').onclick();const count=audio.length;await flush();assert.equal(audio.length,count);assert.equal(art.classList.contains('scene-waiting'),false);
});
