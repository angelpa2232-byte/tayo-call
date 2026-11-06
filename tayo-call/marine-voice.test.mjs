import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MarineVoiceSearch} from './marine-voice.mjs';
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({deferPermission=false,deferResume=false,deferPost=false}={}){
 const streams=[],contexts=[],recorders=[],timers=new Map(),posts=[],texts=[],statuses=[],permissions=[];let next=0,sound=false,allowed=true;
 const makeStream=()=>{const track={stopped:0,stop(){this.stopped++;}},stream={track,getTracks:()=>[track]};streams.push(stream);return stream;};
 const env={navigator:{mediaDevices:{getUserMedia:async options=>{assert.equal(options.video,false);if(deferPermission)return new Promise(resolve=>permissions.push(()=>resolve(makeStream())));return makeStream();}}},
  AudioContext:class{constructor(){this.closed=0;contexts.push(this);}resume(){if(deferResume)return new Promise(resolve=>this.ready=resolve);return Promise.resolve();}close(){this.closed++;return Promise.resolve();}createAnalyser(){return {fftSize:512,getByteTimeDomainData:bins=>bins.fill(sound?150:128)};}createMediaStreamSource(){return {connect(){}};}},
  MediaRecorder:class{constructor(){this.state='inactive';this.mimeType='audio/webm';recorders.push(this);}start(){this.state='recording';}stop(){if(this.state!=='recording')return;this.state='inactive';this.ondataavailable?.({data:new Blob(['audio'])});this.stopped=Promise.resolve(this.onstop?.());}},
  Blob,FileReader:class{readAsDataURL(){this.result='data:audio/webm;base64,YWJj';this.onload();}},AbortController,
  setInterval:fn=>{timers.set(++next,fn);return next;},clearInterval:id=>timers.delete(id)};
 const voice=new MarineVoiceSearch({env,allowed:()=>allowed,onText:text=>texts.push(text),onStatus:(...args)=>statuses.push(args),post:async(path,data,signal)=>{assert.equal(path,'/api/transcribe');assert.equal(data.context,'marine');const entry={data,signal};posts.push(entry);if(deferPost)return new Promise(resolve=>entry.resolve=resolve);return {text:'돌고래'};}});
 return {voice,streams,contexts,recorders,timers,posts,texts,statuses,permissions,sound:value=>sound=value,allowed:value=>allowed=value,tick:()=>[...timers.values()].forEach(fn=>fn())};
}
test('voice search never requests a microphone while parent recognition is disabled, including a pending permission result',async()=>{
 const f=fixture({deferPermission:true});f.allowed(false);assert.equal(await f.voice.start(),false);assert.equal(f.permissions.length,0);
 f.allowed(true);const pending=f.voice.start();await turn();f.allowed(false);f.permissions.shift()();assert.equal(await pending,false);
 assert.ok(f.streams[0].track.stopped>0);assert.equal(f.contexts.length,0);assert.equal(f.posts.length,0);f.voice.stop();
});
test('silence stops recording and releases microphone and analyser without a transcription request',async t=>{
 let now=10000;t.mock.method(Date,'now',()=>now);const f=fixture();await f.voice.start();now+=13000;f.tick();await turn();
 assert.equal(f.posts.length,0);assert.equal(f.texts.length,0);assert.ok(f.streams[0].track.stopped>0);assert.ok(f.contexts[0].closed>0);assert.equal(f.timers.size,0);f.voice.stop();
});
test('a spoken name is sent to local transcription with marine vocabulary and all recording resources are released',async t=>{
 let now=10000;t.mock.method(Date,'now',()=>now);const f=fixture();await f.voice.start();f.sound(true);f.tick();f.sound(false);now+=1200;f.tick();await turn();
 assert.equal(f.posts.length,1);assert.deepEqual(f.texts,['돌고래']);assert.ok(f.streams[0].track.stopped>0);assert.ok(f.contexts[0].closed>0);assert.equal(f.timers.size,0);f.voice.stop();
});
test('closing the page aborts pending transcription and rejects its late result',async t=>{
 let now=10000;t.mock.method(Date,'now',()=>now);const f=fixture({deferPost:true});await f.voice.start();f.sound(true);f.tick();f.sound(false);now+=1200;f.tick();await turn();
 assert.equal(f.posts.length,1);f.voice.stop();assert.equal(f.posts[0].signal.aborted,true);f.posts[0].resolve({text:'상어'});await turn();assert.equal(f.texts.length,0);
});
test('an older AudioContext resume cannot close a newer recording session',async()=>{
 const f=fixture({deferResume:true});const first=f.voice.start();await turn();const second=f.voice.start();await turn();
 assert.equal(f.contexts.length,2);f.contexts[0].ready();assert.equal(await first,false);assert.equal(f.streams[1].track.stopped,0);assert.equal(f.contexts[1].closed,0);
 f.contexts[1].ready();assert.equal(await second,true);assert.equal(f.recorders.at(-1).state,'recording');f.voice.stop();assert.ok(f.streams[1].track.stopped>0);
});
