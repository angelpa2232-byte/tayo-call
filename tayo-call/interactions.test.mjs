import {test} from 'node:test';
import assert from 'node:assert/strict';
import {autoplayTurn} from './autoplay.mjs';
import {PLAY_EVENTS,eventQuestionOptions} from './play-events.mjs';
import {interactionQuestion,sceneNarration} from './story.mjs';
process.env.PORT='18102';
const {makeServer}=await import('./server.mjs');

test('every character invites real spoken answers in prepared and AI plays, while silence still advances',async()=>{
 for(const [actor,events] of Object.entries(PLAY_EVENTS)){
  for(const event of events){
   const state={actor,mode:'event',event:event.id,scene:event.visual,step:1,round:0,autoplay:true};
   const question=interactionQuestion(state);
   assert.ok(eventQuestionOptions(state).includes(question));assert.match(question,/\?$/);
   assert.ok(sceneNarration(state).endsWith(question));
   const result=await autoplayTurn({actor,story:state});
   assert.ok(result.reply.endsWith(question));assert.equal(result.story.step,2);assert.equal(result.waitMs,5000);
   assert.ok(!/말했구나|대답했/.test(result.reply));
  }
 }
 const dino={mode:'event',scene:'outing',step:1,round:0};
 assert.equal(interactionQuestion(dino),'어떤 공룡 좋아해?');
 assert.equal(interactionQuestion({...dino,step:3}),'공룡 발자국은 어떤 모양 같아?');
 const plan={title:'친구랑 공룡 구경',segments:PLAY_EVENTS.tayo.slice(0,2).map(e=>({event:e.id,leadIn:'저기 친구들이 기다린다!',invitations:Array(4).fill('손뼉 짝짝 해 줄래?')}))};
 let story;
 for(let n=0;n<8;n++){
  const result=await autoplayTurn({actor:'tayo',story,aiStories:true},async()=>plan);story=result.story;
  if(n%4===1||n%4===3)assert.ok(result.reply.endsWith(interactionQuestion(result.visual)));
 }
});

test('all 30 plays have stage-specific alternatives and never fall back to an unrelated topic',()=>{
 let slots=0;
 for(const events of Object.values(PLAY_EVENTS))for(const event of events){
  for(const step of [1,3]){
   const base={mode:'event',event:event.id,scene:event.visual,step};
   const first=interactionQuestion({...base,round:0}),second=interactionQuestion({...base,round:1});
   assert.ok(first&&second,event.id);assert.notEqual(first,second,event.id);
   assert.equal(interactionQuestion({...base,round:2}),first);slots+=2;
   for(const q of [first,second]){
    assert.equal((q.match(/\?/g)||[]).length,1);
    if(!['picnic','delivery'].includes(event.visual))assert.doesNotMatch(q,/음식|간식|사과|바나나/,event.id);
    if(event.visual!=='outing')assert.doesNotMatch(q,/공룡|티라노/,event.id);
   }
   const line=sceneNarration({...base,round:0});
   assert.equal((line.match(/\?/g)||[]).length,1,event.id);
  }
 }
 assert.equal(slots,120);
 const frame=(id,step)=>interactionQuestion({mode:'event',event:id,step,round:0});
 assert.match(frame('rogi-0',1),/바퀴/);assert.match(frame('rogi-0',3),/바퀴/);
 assert.match(frame('lani-0',1),/선물/);assert.match(frame('gani-1',1),/사과|바나나/);
 assert.match(frame('lani-2',1),/꽃/);assert.match(frame('pat-1',1),/화살표/);
 assert.match(frame('frank-0',1),/호스/);assert.match(frame('frank-1',1),/고양이/);
 assert.match(frame('pat-4',3),/손/);
});

test('one-word dinosaur and food answers reach AI with the preceding question instead of being replaced by narration',async()=>{
 let calls=0;
 const server=makeServer(async(url,options)=>{
  calls++;const {messages}=JSON.parse(options.body),answer=messages.at(-1).content;
  assert.ok(messages.some(t=>t.role==='assistant'&&t.content.includes('좋아해?')));
  assert.ok(messages[0].content.includes('답의 내용에 반응'));
  return Response.json({message:{content:answer==='피자'?'피자 좋아하는구나! 치즈가 쭉 늘어나지!':'티라노 좋아하는구나! 커다란 머리랑 짧은 앞팔이 있지!'}});
 },undefined,undefined,{read:async()=>({provider:'ollama',key:''})});
 await new Promise(resolve=>server.listen(18102,'127.0.0.1',resolve));
 try{
  for(const [text,question] of [['티라노','어떤 공룡 좋아해?'],['피자','어떤 음식 좋아해?']]){
   const response=await fetch('http://127.0.0.1:18102/api/chat',{method:'POST',headers:{origin:'http://127.0.0.1:18102','Content-Type':'application/json',Connection:'close'},body:JSON.stringify({actor:'tayo',text,history:[{role:'assistant',content:question}],story:{actor:'tayo',mode:'event',scene:'outing',event:'tayo-1',step:2,round:0}})});
   assert.equal(response.status,200);const result=await response.json();
   assert.ok(result.reply.startsWith(text+' 좋아하는구나!'));assert.equal(result.visual.step,2);assert.equal(result.story.step,3);
  }
  assert.equal(calls,2);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
