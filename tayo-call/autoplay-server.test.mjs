import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.PORT='18101';
const {makeServer}=await import('./server.mjs');
const plan={title:'공원으로 가는 타요',segments:[{event:'tayo-0',leadIn:'친구들이랑 공원에 가자!',invitations:['빵빵 해 줄래?','손을 흔들어 줘!','어떤 색이 보이니?','손뼉 짝짝 해 줄래?']},{event:'tayo-1',leadIn:'공룡 모형도 보러 가자!',invitations:['빵빵 해 줄래?','어떤 색이 보이니?','같이 하나, 둘 세어 보자!','손을 흔들어 줘!']}]};
const wirePlan={title:plan.title,route:plan.segments.map(s=>s.event).join('|'),leadIns:plan.segments.map(s=>s.leadIn),invitations:plan.segments.flatMap(s=>s.invitations)};
test('OpenAI generates a validated structured plan once, subsequent stages need no AI or transcription',async()=>{
 let generated=0,transcribed=0;
 const server=makeServer(async(url,options)=>{
  assert.ok(url.endsWith('/v1/responses'));const body=JSON.parse(options.body);assert.equal(body.text.format.type,'json_schema');assert.equal(body.text.format.strict,true);assert.equal(body.store,false);assert.ok(body.max_output_tokens>240);generated++;
  return Response.json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(wirePlan)}]}]});
 },async()=>{transcribed++;throw Error('No microphone');},undefined,{read:async()=>({provider:'openai',key:'test-key'})});
 await new Promise(r=>server.listen(18101,'127.0.0.1',r));
 try{let story;
  for(let i=0;i<9;i++){
   const response=await fetch('http://127.0.0.1:18101/api/chat',{method:'POST',headers:{origin:'http://127.0.0.1:18101','Content-Type':'application/json',Connection:'close'},body:JSON.stringify({text:'[자동 진행 신호]',kind:'auto',autoplay:true,aiStories:true,actor:'tayo',story})});
   assert.equal(response.status,200);const result=await response.json();story=result.story;assert.equal(result.visual.step,i%4);assert.equal(result.waitMs,5000);assert.equal(result.playSource,'ai');
  }
  assert.equal(generated,2);assert.equal(transcribed,0);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('Ollama uses the same schema and prepared mode avoids model loading completely',async()=>{
 let calls=0;
 const server=makeServer(async(url,options)=>{calls++;assert.ok(url.endsWith('/api/chat'));const body=JSON.parse(options.body);assert.equal(body.format.type,'object');assert.equal(body.think,false);return Response.json({message:{content:JSON.stringify(wirePlan)}});},undefined,undefined,{read:async()=>({provider:'ollama',key:''})});
 await new Promise(r=>server.listen(18101,'127.0.0.1',r));
 const post=aiStories=>fetch('http://127.0.0.1:18101/api/chat',{method:'POST',headers:{origin:'http://127.0.0.1:18101','Content-Type':'application/json',Connection:'close'},body:JSON.stringify({text:'[자동 진행]',autoplay:true,aiStories,actor:'tayo'})}).then(r=>r.json());
 try{assert.equal((await post(false)).playSource,'prepared');assert.equal(calls,0);assert.equal((await post(true)).playSource,'ai');assert.equal(calls,1);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
