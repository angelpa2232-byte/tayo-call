import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.PORT='18089';
const {makeServer}=await import('./server.mjs');
const {apiModel}=await import('./openai-provider.mjs');
test('API setup protects secrets, verifies credentials and preserves character stories',async()=>{
 let stored={provider:'ollama',key:''},responses=0,deny=false;
 const store={read:async()=>({...stored}),write:async value=>{stored={...value};}};
 const key='sk-'+ 'testcredential'.repeat(3);
 const server=makeServer(async(url,options={})=>{
  if(url.includes('11434'))return Response.json({models:[]});
  assert.ok(url.startsWith('https://api.openai.com/v1/'));
  if(deny)return Response.json({error:{message:'secret upstream detail '+key}},{status:401});
  assert.equal(options.headers.Authorization,'Bearer '+key);
  if(url.includes('/models/'))return Response.json({id:apiModel});
  responses++;const body=JSON.parse(options.body);
  assert.equal(body.store,false);assert.equal(body.reasoning.effort,'none');assert.equal(body.model,apiModel);
  assert.ok(body.input[0].content.includes('프랭크'));assert.equal(body.input.at(-1).content,'고양이는 뭐야?');
  return Response.json({output:[{type:'message',content:[{type:'output_text',text:'야옹! 고양이 인형이 있네. 같이 도와줄까?'}]}]});
 },undefined,undefined,store);
 await new Promise(resolve=>server.listen(18089,'127.0.0.1',resolve));
 const base='http://127.0.0.1:18089';
 const post=(path,data,origin=base)=>fetch(base+path,{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
 try{
  assert.equal((await post('/api/settings',{provider:'openai',key},'https://evil.example')).status,403);
  assert.equal((await post('/api/settings',{provider:'openai',key:'bad'})).status,400);
  const saved=await post('/api/settings',{provider:'openai',key});assert.equal(saved.status,200);assert.ok(!(await saved.text()).includes(key));
  const status=await (await fetch(base+'/api/status')).json();assert.equal(status.provider,'openai');assert.equal(status.apiConfigured,true);assert.ok(!JSON.stringify(status).includes(key));
  const reply=await post('/api/chat',{text:'고양이는 뭐야?',actor:'frank',story:{actor:'frank',mode:'event',scene:'cat',event:'frank-1',step:1,round:0}});
  assert.equal(reply.status,200);const result=await reply.json();assert.equal(result.actor,'frank');assert.equal(result.story.step,2);assert.equal(result.visual.scene,'cat');assert.equal(responses,1);
  assert.equal((await fetch(base+'/runtime/openai-settings.json')).status,404);
  deny=true;const failed=await post('/api/settings',{provider:'openai',key});assert.equal(failed.status,503);const error=await failed.text();assert.ok(error.includes('API 키'));assert.ok(!error.includes(key));
  assert.equal((await post('/api/settings',{provider:'ollama'})).status,200);assert.equal(stored.provider,'ollama');assert.equal(stored.key,key);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('API mode releases loaded local models without generating text',async()=>{
 const {unloadLocalModels}=await import('./server.mjs');const calls=[];
 const result=await unloadLocalModels(async(url,options)=>{if(url.endsWith('/api/ps'))return Response.json({models:[{name:'qwen3:4b-instruct-2507-q4_K_M'}]});calls.push(JSON.parse(options.body));return Response.json({done:true});});
 assert.equal(result,true);assert.deepEqual(calls,[{model:'qwen3:4b-instruct-2507-q4_K_M',keep_alive:0}]);
});

test('six OpenAI voices carry distinct styles, WAV output and cancellation signal',async()=>{
 const {openaiSpeech,ConnectionError}=await import('./openai-provider.mjs');const {CHARACTERS}=await import('./characters.mjs');const voices=new Set();const signal=AbortSignal.timeout(5000);
 for(const actor of Object.keys(CHARACTERS)){
  const wav=Buffer.alloc(44);wav.write('RIFF');wav.write('WAVE',8);
  const audio=await openaiSpeech({actor,text:'안녕! 같이 놀까?'},'test-key',signal,async(url,options)=>{
   assert.equal(url,'https://api.openai.com/v1/audio/speech');assert.equal(options.signal,signal);
   const body=JSON.parse(options.body);voices.add(body.voice);assert.equal(body.voice,CHARACTERS[actor].apiVoice);assert.ok(body.instructions.includes(CHARACTERS[actor].voiceStyle));assert.equal(body.response_format,'wav');assert.equal(body.speed,1.22);assert.match(body.instructions,/신나고 장난기/);assert.equal(body.input,'안녕! 같이 놀까?');return new Response(wav);
  });assert.equal(audio.toString('ascii',0,4),'RIFF');
 }
 assert.equal(voices.size,6);
 await assert.rejects(openaiSpeech({actor:'tayo',text:'안녕'},'test-key',signal,async()=>new Response('',{status:401})),ConnectionError);
});
