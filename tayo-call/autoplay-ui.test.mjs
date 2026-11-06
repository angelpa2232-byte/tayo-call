import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {autoplayTurn} from './autoplay.mjs';
test('recognition defaults off: no microphone, 5 seconds after speech, continuous plays, live parent toggle',async()=>{
 const elements=new Map(),timers=new Map(),spoken=[],requests=[];let next=1,microphones=0,recordings=0,stopped=0,saved;
 const el=()=>{const classes=new Set();return {value:'',textContent:'',style:{},classList:{add(...ns){ns.forEach(n=>classes.add(n));},remove(...ns){ns.forEach(n=>classes.delete(n));},toggle(n,on){if(on===undefined)on=!classes.has(n);on?classes.add(n):classes.delete(n);},contains:n=>classes.has(n)},focus(){},append(){},querySelector(){return {textContent:''};}};};
 const document={hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id);},createElement:el,addEventListener(n,fn){fn();}};
 const track={enabled:true,stop(){stopped++;}},media={getTracks:()=>[track],getAudioTracks:()=>[track]};
 const context={document,localStorage:{getItem:()=>JSON.stringify({engine:'windows',aiStories:false}),setItem(k,v){saved=JSON.parse(v);}},window:{MediaRecorder:true,addEventListener(){},speechSynthesis:{getVoices:()=>[{name:'ko',lang:'ko-KR',localService:true}],cancel(){},speak(u){spoken.push(u);}}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},TayoCharacter:class{stopTalking(){}destroy(){}},navigator:{mediaDevices:{getUserMedia:async constraints=>{if(constraints.audio){microphones++;return media;}throw Error('camera not present');}}},AudioContext:class{resume(){return Promise.resolve();}createAnalyser(){return {fftSize:512};}createMediaStreamSource(){return {connect(){}};}close(){return Promise.resolve();}},MediaRecorder:class{constructor(){recordings++;this.state='inactive';}start(){this.state='recording';}stop(){this.state='inactive';this.onstop?.();}},setTimeout(fn,ms){const id=next++;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},setInterval(){return next++;},clearInterval(){},cancelAnimationFrame(){},AbortController,fetch:async(path,options)=>{
  if(path==='/api/status')return {json:async()=>({provider:'ollama',models:['qwen3:4b-instruct-2507-q4_K_M'],stt:true})};
  const data=JSON.parse(options.body);
  if(path==='/api/settings')return {ok:true,json:async()=>({provider:'ollama'})};
  assert.equal(path,'/api/chat');assert.equal(data.kind,'auto');assert.equal(data.autoplay,true);assert.equal(data.aiStories,false);assert.ok(data.history.every(x=>x.role==='assistant'));requests.push(data);
  const result=await autoplayTurn(data);return {ok:true,json:async()=>result};
 }};
 vm.runInNewContext(await readFile(new URL('app.js',import.meta.url),'utf8'),context);
 const flush=()=>new Promise(r=>setImmediate(r));const hasWait=()=>[...timers.values()].some(t=>t.ms===5000);
 const wait=()=>{const entry=[...timers].find(([,t])=>t.ms===5000);assert.ok(entry);timers.delete(entry[0]);entry[1].fn();};
 assert.equal(elements.get('speech-recognition').value,'off');
 await elements.get('btn-accept-call').onclick();await flush();assert.equal(microphones,0);assert.equal(recordings,0);assert.equal(hasWait(),false);
 assert.ok(!spoken[0].text.includes('누구랑 얘기'));
 spoken.at(-1).onend();assert.equal(hasWait(),true);
 for(let n=0;n<6;n++){wait();await flush();assert.equal(requests.at(-1).story?.step??0,n%4);assert.equal(hasWait(),false);spoken.at(-1).onend();assert.equal(hasWait(),true);}
 assert.equal(microphones,0);assert.equal(recordings,0);
 elements.get('btn-parent-settings').onclick();assert.equal(hasWait(),false);elements.get('btn-close-settings').onclick();assert.equal(hasWait(),true);
 elements.get('speech-recognition').value='on';await elements.get('btn-save-settings').onclick();assert.equal(saved.speechRecognition,true);assert.equal(microphones,1);assert.ok(recordings>0);assert.equal(hasWait(),false);
 elements.get('speech-recognition').value='off';await elements.get('btn-save-settings').onclick();assert.equal(saved.speechRecognition,false);assert.ok(stopped>0);assert.equal(hasWait(),true);
 elements.get('btn-end-call').onclick();assert.equal(hasWait(),false);
});
