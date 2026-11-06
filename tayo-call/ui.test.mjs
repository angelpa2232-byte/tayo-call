import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
const elements=new Map();
const element=()=>({value:'',textContent:'',classList:{add(){},remove(){},toggle(){}},focus(){},append(){},querySelector(){return {textContent:''};}});
const document={createElement(){return element();},getElementById(id){assert.ok(ids.has(id),`Missing DOM element: ${id}`);if(!elements.has(id))elements.set(id,element());return elements.get(id);},addEventListener(name,fn){fn();}};
vm.runInNewContext(await readFile(new URL('./app.js',import.meta.url),'utf8'),{document,localStorage:{getItem(){return null;}},window:{addEventListener(){},speechSynthesis:{getVoices(){return [];},cancel(){}}},clearInterval(){},clearTimeout(){},cancelAnimationFrame(){}});
assert.equal(elements.get('child-name').value,'친구');assert.equal(typeof elements.get('text-form').onsubmit,'function');
assert.ok(html.includes('id="openai-key" type="password"'));assert.ok(html.includes('대화를 OpenAI')||html.includes('OpenAI로 보내'));console.log('Local UI initialization and masked API key field: PASS');

elements.get('btn-end-call').onclick();
assert.ok(elements.get('entry-status').textContent.includes('통화가 끝났어요'));
console.log('Hangup without devices: PASS');


assert.equal(elements.get('model-select').value,'qwen3:4b-instruct-2507-q4_K_M');
console.log('Fast 4B model selected: PASS');



elements.get('chat-provider').value='openai';elements.get('chat-provider').onchange();assert.equal(elements.get('model-select').disabled,true);assert.ok(elements.get('model-mode-help').textContent.includes('GPT-5.4 mini'));elements.get('chat-provider').value='ollama';elements.get('chat-provider').onchange();assert.equal(elements.get('model-select').disabled,false);

elements.get('tts-engine').value='supertonic';elements.get('tts-engine').onchange();assert.equal(elements.get('tts-voice').disabled,false);assert.ok(elements.get('voice-mode-help').textContent.includes('무료'));elements.get('tts-engine').value='openai';elements.get('tts-engine').onchange();assert.equal(elements.get('tts-voice').disabled,true);assert.ok(elements.get('voice-mode-help').textContent.includes('유료'));

assert.equal(elements.get('speech-recognition').value,'off');assert.equal(elements.get('ai-stories').value,'on');assert.equal(elements.get('btn-toggle-mic').disabled,true);
