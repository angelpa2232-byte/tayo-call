import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.PORT='18088';
const {makeServer,cleanReply}=await import('./server.mjs');
test('local Ollama: bounded history, no cloud, validation and voice routing',async()=>{
 let calls=0,transcriptionContext;
 const server=makeServer(async(url,options)=>{
   assert.ok(url.startsWith('http://127.0.0.1:11434/'));
   if(url.endsWith('/api/tags'))return Response.json({models:[{name:'qwen3:4b-instruct-2507-q4_K_M'}]});
   calls++;const data=JSON.parse(options.body);
   assert.equal(data.model,'qwen3:4b-instruct-2507-q4_K_M');assert.equal(data.think,false);assert.equal(data.options.num_ctx,4096);
   assert.ok(data.messages.length<=14);assert.equal(data.messages[0].role,'system');
   return Response.json({message:{content:'<think>hidden reasoning</think>안녕! 좋아하는 동물이 뭐야?'}});
 },async(audio,signal,context)=>{assert.equal(audio,'YWJj');transcriptionContext=context;return {text:'안녕 타요'};},async data=>{assert.equal(data.voice,'M3');return Buffer.from('RIFFmock-WAVE');},{read:async()=>({provider:'ollama',key:''}),write:async()=>{}});
 await new Promise(resolve=>server.listen(18088,'127.0.0.1',resolve));
 const base='http://127.0.0.1:18088';
 const post=(path,data,origin=base)=>fetch(base+path,{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
 try{
   assert.equal((await post('/api/chat',{text:'안녕'},'https://evil.example')).status,403);
   assert.equal((await post('/api/chat',{text:''})).status,400);
   assert.equal((await post('/api/transcribe',{audio:'!!'})).status,400);
   const chat=await post('/api/chat',{text:'안녕',history:Array(20).fill({role:'user',content:'반가워'})});
   const changed=await post('/api/chat',{text:'프랭크랑 얘기하고 싶어',actor:'tayo',story:{actor:'tayo',mode:'event',scene:'passengers',event:'tayo-0',step:2},history:[{role:'assistant',content:'나는 타요야'}]});
   const selected=await changed.json();assert.equal(selected.actor,'frank');assert.equal(selected.switched,true);assert.equal(selected.visual.scene,'daily');assert.equal(selected.story.actor,'frank');assert.ok(selected.reply.includes('나 프랭크야'));assert.equal(calls,1);
   for(const text of ['로기랑 얘기하고 싶어','로기랑도 얘기하고 싶어','로기를 좀 불러줘','로키랑 얘기할래','로기요']){
     const switched=await (await post('/api/chat',{text,actor:'tayo',story:{actor:'tayo',mode:'event',scene:'passengers',event:'tayo-0',step:2},history:[{role:'assistant',content:'로기가 뒤에서 따라오고 있어!'}]})).json();
     assert.equal(switched.actor,'rogi',text);assert.equal(switched.switched,true,text);assert.equal(switched.visual.scene,'daily');assert.equal(switched.story.mode,'chat');assert.equal(switched.story.event,undefined);assert.ok(switched.reply.includes('초록 버스 로기야'));assert.equal(calls,1);
   }
   assert.equal(chat.status,200);assert.equal((await chat.json()).reply,'안녕! 좋아하는 동물이 뭐야?');assert.equal(calls,1);
   const voice=await post('/api/transcribe',{audio:'YWJj'});assert.deepEqual(await voice.json(),{text:'안녕 타요'});
   assert.equal(transcriptionContext,'conversation');await post('/api/transcribe',{audio:'YWJj',context:'marine'});assert.equal(transcriptionContext,'marine');
   const tts=await post('/api/tts',{text:'같이 도와줄까?',voice:'M3'});assert.equal(tts.status,200);assert.ok(tts.headers.get('content-type').startsWith('audio/wav'));assert.equal(await tts.text(),'RIFFmock-WAVE');
   assert.equal((await fetch(base+'/server.mjs')).status,404);
   const status=await (await fetch(base+'/api/status')).json();assert.equal(status.configured,true);
   assert.equal((await fetch(base+'/')).status,200);
   assert.equal((await fetch(base+'/mini-games.mjs')).status,200);
   assert.equal((await fetch(base+'/mini-games-extra.mjs')).status,200);
   assert.equal((await fetch(base+'/mini-game-input.mjs')).status,200);
   for(const asset of ['vehicles.mjs','vehicles-data.mjs','vehicles-art.mjs','vehicles.css'])assert.equal((await fetch(base+'/'+asset)).status,200,asset);
   for(const asset of ['marine.mjs','marine-data.mjs','marine-art.mjs','marine-voice.mjs','marine.css'])assert.equal((await fetch(base+'/'+asset)).status,200,asset);
   const gameStyle=await fetch(base+'/mini-games.css');assert.equal(gameStyle.status,200);assert.ok(gameStyle.headers.get('content-type').startsWith('text/css'));
   assert.ok(cleanReply('English only').includes('부모님'));
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('full recent conversation stays available on topic change and follow-ups',async()=>{
 const {buildMessages}=await import('./conversation.mjs');
 const history=[{role:'assistant',content:'어떤 공룡을 좋아해?'},{role:'user',content:'티라노'},{role:'assistant',content:'티라노는 고기를 먹던 공룡이야.'}];
 const follow=buildMessages('뭘 먹어?',history);
 assert.ok(follow[0].content.includes('짧은 앞팔'));assert.equal(follow.at(-1).content,'뭘 먹어?');
 const changed=buildMessages('타요 친구는 누구야?',history);
 assert.equal(changed.length,5);assert.equal(changed[2].content,'티라노');assert.ok(changed[0].content.includes('가니는 빨간'));
 const fruit=[{role:'user',content:'사과 좋아'},{role:'assistant',content:'빨간 사과가 좋구나.'},{role:'user',content:'바나나도 좋아'},{role:'assistant',content:'바나나는 노랗지.'}];
 const messages=buildMessages('응',fruit);assert.equal(messages.length,6);assert.ok(!messages[0].content.includes('과일에 대한 질문은 금지'));
});

test('story advances on child turns, repeats character missions and keeps silent children on current scene',async()=>{
 const {normalizeStory,advanceStory,storyDirection}=await import('./story.mjs');
 assert.deepEqual(normalizeStory({scene:'unsafe',step:900}),{scene:'repair',step:3,round:0});
 const state={scene:'repair',step:1,round:0};
 assert.deepEqual(advanceStory(state,'idle'),state);
 assert.equal(advanceStory(state).step,2);
 assert.deepEqual(advanceStory({scene:'repair',step:3,round:0}),{scene:'repair',step:0,round:1});
 assert.ok(storyDirection({scene:'repair',step:2}).includes('정비는 어른'));
 const {buildMessages}=await import('./conversation.mjs');
 const idle=buildMessages('quiet',[],state,'idle');
 assert.ok(idle[0].content.includes('아이가 답했다고 꾸미지 말고'));
 assert.ok(idle.at(-1).content.includes('아이의 발언이 아님'));
});

