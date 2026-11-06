import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {CHARACTERS,getCharacter,requestedCharacter,characterGreeting} from './characters.mjs';
import {sceneView,sceneSvg} from './scene-visuals.mjs';
import {initialStory} from './story.mjs';
const html=await readFile(new URL('index.html',import.meta.url),'utf8'),ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
const elements=new Map(),selectors=new Map(),pictures=[],spoken=[],requests=[];
const el=()=>({value:'',textContent:'',dataset:{},style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},focus(){},append(){},setAttribute(){},querySelector(){return {textContent:''};}});
const document={hidden:false,createElement:el,querySelector(selector){if(!selectors.has(selector))selectors.set(selector,el());return selectors.get(selector);},querySelectorAll(){return [];},getElementById(id){assert.ok(ids.has(id),id);if(!elements.has(id))elements.set(id,el());return elements.get(id);},addEventListener(name,fn){fn();}};
const context={document,localStorage:{getItem(){return JSON.stringify({speechRecognition:true,engine:'windows'});}},window:{location:{search:''},CharacterCatalog:{CHARACTERS,getCharacter,requestedCharacter},SceneVisuals:{sceneView,sceneSvg},addEventListener(){},speechSynthesis:{getVoices(){return [{name:'Korean',lang:'ko-KR',localService:true}];},cancel(){},speak(utterance){spoken.push(utterance);queueMicrotask(()=>utterance.onend());}}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},navigator:{mediaDevices:{getUserMedia(){return Promise.reject(new Error('no camera'));}}},TayoCharacter:class{constructor(){this.stage=el();}setCharacter(id){pictures.push(id);}stopTalking(){}destroy(){}},URLSearchParams,setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},cancelAnimationFrame(){},AbortController,fetch:async(path,options)=>{
 if(path==='/api/status')return {json:async()=>({provider:'ollama',models:['qwen3:4b-instruct-2507-q4_K_M'],stt:false})};
 assert.equal(path,'/api/chat');const data=JSON.parse(options.body);requests.push(data);
 assert.equal(pictures.at(-1),data.actor);
 if(data.text==='나들이 가자'){const state={...initialStory('tayo'),mode:'event',event:'tayo-0',scene:'passengers',step:2};return {ok:true,json:async()=>({actor:'tayo',reply:'로기가 뒤에서 따라오고 있어!',story:state,visual:state})};}
 assert.deepEqual(data.history,[]);
 const state=initialStory(data.actor);return {ok:true,json:async()=>({actor:data.actor,reply:characterGreeting(data.actor),story:state,visual:state,switched:true})};
}};
vm.runInNewContext(await readFile(new URL('app.js',import.meta.url),'utf8'),context);
await elements.get('btn-accept-call').onclick();await new Promise(r=>setImmediate(r));
document.getElementById('text-input').value='나들이 가자';elements.get('text-form').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));
assert.ok(spoken.at(-1).text.includes('로기가 뒤에서'));assert.equal(pictures.at(-1),'tayo');
for(const [text,actor] of [['로기랑 얘기하고 싶어','rogi'],['프랭크랑 얘기하고 싶어','frank'],['로기랑 좀 얘기하고 싶어','rogi'],['로키랑 얘기하고 싶어','rogi'],['로기를 불러줘','rogi'],['프랭크 말고 라니랑 애기할래','lani']]){
 document.getElementById('text-input').value=text;elements.get('text-form').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));
 assert.equal(pictures.at(-1),actor);assert.equal(requests.at(-1).actor,actor);assert.ok(spoken.at(-1).text.includes(getCharacter(actor).name));assert.ok(selectors.get('.status-name').textContent.includes(getCharacter(actor).name));assert.equal(elements.get('scene-caption').textContent,'친구와 도란도란 이야기');
}
console.log('Spoken character selection changes image, role, voice style and clears previous role before request: PASS');
