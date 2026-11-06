import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('singing pauses microphone and prompts, resumes conversation and stops on hangup',async()=>{
  const elements=new Map(),timers=new Map(),spoken=[];let next=1,callback,plays=0,stops=0,chats=0;
  const el=()=>({value:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},focus(){},append(){},querySelector(){return {textContent:''};}});
  const document={hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id);},addEventListener(name,fn){fn();},createElement:el};
  const audioTrack={enabled:true,stop(){}};const media={getAudioTracks:()=>[audioTrack],getTracks:()=>[audioTrack]};
  const context={document,localStorage:{getItem:()=>JSON.stringify({speechRecognition:true,engine:'windows'})},window:{location:{search:''},MediaRecorder:true,addEventListener(){},SongPlayer:class{play(id,fn){plays++;assert.equal(id,'tayo');callback=fn;}stop(){stops++;}},speechSynthesis:{getVoices:()=>[{name:'ko',lang:'ko-KR',localService:true}],cancel(){},speak(u){spoken.push(u.text);queueMicrotask(()=>u.onend());}}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},navigator:{mediaDevices:{getUserMedia:async()=>media}},TayoCharacter:class{stopTalking(){}destroy(){}},AudioContext:class{resume(){return Promise.resolve();}close(){return Promise.resolve();}createAnalyser(){return {fftSize:512};}createMediaStreamSource(){return {connect(){}};}},MediaRecorder:class{constructor(){this.state='inactive';}start(){this.state='recording';}stop(){this.state='inactive';this.onstop?.();}},URLSearchParams,AbortController,cancelAnimationFrame(){},setTimeout(fn,ms){const id=next++;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},setInterval(){return next++;},clearInterval(){},fetch:async path=>{
    if(path==='/api/status')return {json:async()=>({provider:'ollama',models:['qwen3:4b-instruct-2507-q4_K_M'],stt:true})};
    chats++;return {ok:true,json:async()=>({reply:'같이 노래를 들어 보자!',music:'tayo'})};
  }};
  vm.runInNewContext(await readFile(new URL('app.js',import.meta.url),'utf8'),context);
  const flush=()=>new Promise(r=>setImmediate(r));
  await elements.get('btn-accept-call').onclick();await flush();
  await elements.get('btn-song').onclick();await flush();
  assert.equal(plays,1);assert.equal(audioTrack.enabled,false);
  assert.equal([...timers.values()].some(t=>[3000,9000,12000,16000].includes(t.ms)),false);
  elements.get('btn-tayo-talk').onclick();await flush();assert.equal(chats,1);
  callback('ended');await flush();assert.match(spoken.at(-1),/노래 끝/);assert.ok([...timers.values()].some(t=>t.ms===9000));
  await elements.get('btn-song').onclick();await flush();assert.equal(plays,2);
  elements.get('btn-end-call').onclick();assert.equal(stops,1);const count=spoken.length;callback('ended');await flush();assert.equal(spoken.length,count);
});
