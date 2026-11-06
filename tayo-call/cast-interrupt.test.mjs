import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {CHARACTERS,getCharacter,requestedCharacter,characterGreeting} from './characters.mjs';
const source=await readFile(new URL('app.js',import.meta.url),'utf8');
function fixture(engine,withGames=false,withVehicles=false,withMarine=false){
 const elements=new Map(),selectors=new Map(),timers=new Map(),spoken=[],pictures=[],tts=[],audios=[];let next=1,resolveChat,chatSignal;
 const el=()=>({value:'',textContent:'',dataset:{},children:[],style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},append(child){this.children.push(child);},setAttribute(){},focus(){},querySelector(){return {textContent:''};}});
 const document={hidden:false,createElement:el,getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id);},querySelector(s){if(!selectors.has(s))selectors.set(s,el());return selectors.get(s);},querySelectorAll:()=>[],addEventListener(n,fn){fn();}};
 const context={document,localStorage:{getItem:()=>JSON.stringify({engine,aiStories:false})},window:{location:{search:''},addEventListener(){},CharacterCatalog:{CHARACTERS,getCharacter,requestedCharacter,characterGreeting},speechSynthesis:{getVoices:()=>[{name:'ko',lang:'ko-KR',localService:true}],cancel(){},speak(u){spoken.push(u);}}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},navigator:{mediaDevices:{getUserMedia:async()=>{throw Error('no camera');}}},TayoCharacter:class{setCharacter(id){pictures.push(id);}stopTalking(){}destroy(){}},setTimeout(fn,ms){const id=next++;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},setInterval:()=>next++,clearInterval(){},cancelAnimationFrame(){},requestAnimationFrame:()=>1,URLSearchParams,AbortController,URL:{createObjectURL:()=>'',revokeObjectURL(){}},Audio:class{constructor(){this.pauses=0;audios.push(this);}pause(){this.pauses++;}play(){return Promise.resolve();}},AudioContext:class{resume(){return Promise.resolve();}createAnalyser(){return {fftSize:256,connect(){},getByteTimeDomainData(b){b.fill(128);}};}createMediaElementSource(){return {connect(){}};}close(){return Promise.resolve();}},fetch:async(path,options)=>{
  if(path==='/api/status')return {json:async()=>({provider:'ollama',models:[],stt:false})};
  if(path==='/api/tts'){const item={data:JSON.parse(options.body),signal:options.signal};tts.push(item);return {ok:true,blob:()=>new Promise(r=>item.resolve=r)};}
  assert.equal(path,'/api/chat');chatSignal=options.signal;return new Promise(r=>resolveChat=r);
 }};
 let game,library,marine;
 if(withGames)context.window.MiniGames=class{constructor(options){this.options=options;game=this;}open(){this.opened=true;this.options.onEnter();}close(notify=true){this.opened=false;if(notify)this.options.onLeave();}};
 if(withVehicles)context.window.VehicleLibrary=class{constructor(options){this.options=options;library=this;}open(){this.opened=true;this.options.onEnter();}close(notify=true){this.opened=false;if(notify)this.options.onLeave();}};
 if(withMarine)context.window.MarineLibrary=class{constructor(options){this.options=options;marine=this;}open(){this.opened=true;this.options.onEnter();}close(notify=true){this.opened=false;if(notify)this.options.onLeave();}};
 vm.runInNewContext(source,context);
 return {elements,timers,spoken,pictures,tts,audios,get game(){return game;},get library(){return library;},get marine(){return marine;},choose:id=>elements.get('cast-picker').children.find(b=>b.dataset.cast===id).onclick(),resolveChat:()=>resolveChat({ok:true,json:async()=>({actor:'tayo',reply:'이전 타요 응답',story:{actor:'tayo',mode:'chat',scene:'daily',step:0}})}),chatAborted:()=>chatSignal.aborted};
}
const flush=()=>new Promise(r=>setImmediate(r));
test('marine narration completes before name listening and cancelled speech never starts a microphone after return',async()=>{
 const f=fixture('windows',true,true,true);await f.elements.get('btn-accept-call').onclick();f.choose('frank');
 f.elements.get('btn-marine').onclick();assert.equal(f.marine.opened,true);assert.equal(f.marine.options.canListen(),false);
 let completed=0;f.marine.options.onSpeak('돌고래는 포유류야!','tayo',()=>completed++);
 assert.equal(completed,0);f.spoken.at(-1).onend();assert.equal(completed,1);assert.ok(![...f.timers.values()].some(t=>t.ms===5000));
 f.marine.options.onSpeak('문어는 팔이 여덟 개야!','tayo',()=>completed++);const late=f.spoken.at(-1).onend;
 f.elements.get('btn-vehicles').onclick();assert.equal(f.marine.opened,false);late();assert.equal(completed,1);
 f.library.close();assert.equal(f.pictures.at(-1),'frank');
 f.elements.get('btn-marine').onclick();f.elements.get('btn-end-call').onclick();assert.equal(f.marine.opened,false);
 const entry=fixture('windows',true,true,true);entry.elements.get('btn-marine-entry').onclick();entry.marine.options.onSpeak('상어는 물고기야!','tayo',()=>completed++);assert.equal(completed,1);entry.spoken.at(-1).onend();assert.equal(completed,2);entry.marine.close();
});
test('vehicle explanations interrupt old responses and preserve the original character across game and library transitions',async()=>{
 const f=fixture('windows',true,true);await f.elements.get('btn-accept-call').onclick();f.choose('rogi');f.spoken.at(-1).onend();
 const [key,timer]=[...f.timers].find(([,t])=>t.ms===5000);f.timers.delete(key);timer.fn();await flush();
 f.elements.get('btn-vehicles').onclick();assert.equal(f.library.opened,true);assert.equal(f.chatAborted(),true);
 f.library.options.onSpeak('덤프트럭은 흙을 나르는 차야!','tayo');f.spoken.at(-1).onend();
 assert.ok(![...f.timers.values()].some(t=>t.ms===5000));f.resolveChat();await flush();assert.ok(!f.spoken.some(u=>u.text==='이전 타요 응답'));
 f.elements.get('btn-mini-games').onclick();assert.equal(f.library.opened,false);f.game.options.onSpeak('물을 뿌려 보자!','frank');
 f.game.close();assert.equal(f.pictures.at(-1),'rogi');
 f.elements.get('btn-vehicles').onclick();f.elements.get('btn-end-call').onclick();assert.equal(f.library.opened,false);assert.equal(f.game.opened,false);
 const entry=fixture('windows',true,true);entry.elements.get('btn-vehicles-entry').onclick();entry.library.options.onSpeak('비행기는 하늘을 날아!','tayo');assert.equal(entry.spoken.at(-1).text,'비행기는 하늘을 날아!');entry.library.close();
});
test('mini-games cancel pending conversation, suppress automatic turns and restore the original character on return',async()=>{
 const f=fixture('windows',true);await f.elements.get('btn-accept-call').onclick();
 f.choose('rogi');f.spoken.at(-1).onend();
 const [key,timer]=[...f.timers].find(([,t])=>t.ms===5000);f.timers.delete(key);timer.fn();await flush();
 f.elements.get('btn-mini-games').onclick();assert.equal(f.chatAborted(),true);
 f.game.options.onSpeak('빨간 표적을 눌러 줘!','frank');assert.equal(f.pictures.at(-1),'frank');
 f.spoken.at(-1).onend();assert.ok(![...f.timers.values()].some(t=>t.ms===5000));
 f.resolveChat();await flush();assert.ok(!f.spoken.some(u=>u.text==='이전 타요 응답'));
 f.game.close();assert.equal(f.pictures.at(-1),'rogi');assert.ok([...f.timers.values()].some(t=>t.ms===5000));
 f.elements.get('btn-end-call').onclick();assert.equal(f.game.opened,false);
 const entry=fixture('windows',true);entry.elements.get('btn-mini-games-entry').onclick();assert.equal(entry.game.opened,true);
 entry.game.options.onSpeak('친구를 눌러 줘!','tayo');assert.equal(entry.spoken.at(-1).text,'친구를 눌러 줘!');
 entry.game.close();assert.ok(![...entry.timers.values()].some(t=>t.ms===5000));
});
test('cast buttons interrupt speech and pending story requests in no-recognition mode',async()=>{
 const f=fixture('windows');await f.elements.get('btn-accept-call').onclick();const old=f.spoken.at(-1);
 f.choose('frank');assert.equal(f.pictures.at(-1),'frank');assert.match(f.spoken.at(-1).text,/프랭크/);
 f.choose('rogi');assert.equal(f.pictures.at(-1),'rogi');old.onend();assert.equal(f.timers.size,0);
 f.spoken.at(-1).onend();const [key,timer]=[...f.timers].find(([,t])=>t.ms===5000);f.timers.delete(key);timer.fn();await flush();
 f.choose('lani');assert.equal(f.chatAborted(),true);assert.equal(f.pictures.at(-1),'lani');
 f.resolveChat();await flush();assert.equal(f.pictures.at(-1),'lani');assert.ok(!f.spoken.some(u=>u.text==='이전 타요 응답'));assert.match(f.spoken.at(-1).text,/라니/);
 f.elements.get('btn-end-call').onclick();
});
test('a cancelled voice response and old ended callback cannot play over or stop the new character',async()=>{
 const f=fixture('openai');await f.elements.get('btn-accept-call').onclick();await flush();
 f.choose('frank');await flush();assert.equal(f.tts[0].signal.aborted,true);assert.equal(f.tts[1].data.actor,'frank');
 f.tts[0].resolve({});await flush();assert.equal(f.audios.length,0);
 f.tts[1].resolve({});await flush();const old=f.audios.at(-1),ended=old.onended;
 f.choose('rogi');await flush();assert.ok(old.pauses>0);assert.equal(f.tts.at(-1).data.actor,'rogi');
 f.tts.at(-1).resolve({});await flush();const current=f.audios.at(-1);ended();assert.equal(current.pauses,0);assert.equal(f.pictures.at(-1),'rogi');
 f.elements.get('btn-end-call').onclick();
});
