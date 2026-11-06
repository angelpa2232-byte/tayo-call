import {test} from 'node:test';
import assert from 'node:assert/strict';
import {autoplayTurn,parsePlan,planSchema} from './autoplay.mjs';
import {PLAY_EVENTS} from './play-events.mjs';
import {sceneSvg,sceneView} from './scene-visuals.mjs';
import {interactionQuestion} from './story.mjs';
const plan=actor=>({title:'친구들과 신나는 하루',segments:PLAY_EVENTS[actor].slice(0,2).map(event=>({event:event.id,leadIn:'어? 이번에는 여기를 가 보자!',invitations:['빵빵 해 줄래?','어떤 색이 보이니?','같이 영차 해 줘!','손뼉 짝짝 해 줄래?']}))});
test('no-input play cycles all five missions per character, preserving visual stages and 5-second pauses',async()=>{
 for(const actor of Object.keys(PLAY_EVENTS)){
  let story;const visited=new Set();
  for(let n=0;n<24;n++){
   const result=await autoplayTurn({actor,story});story=result.story;
   assert.equal(result.waitMs,5000);assert.equal(result.visual.step,n%4);visited.add(result.visual.event);
   assert.match(sceneSvg(sceneView(result.visual)),/data-backdrop=/);assert.equal(result.playSource,'prepared');
   assert.ok(!/대답했|말했구나|대답해 줘/.test(result.reply));
  }
  assert.equal(visited.size,5);
 }
});
test('AI plans persist through all eight stages, then regenerate once for the next story',async()=>{
 let story,calls=0;
 const generate=async actor=>{calls++;return plan(actor);};
 for(let n=0;n<9;n++){
  const result=await autoplayTurn({actor:'rogi',story,aiStories:true},generate);story=result.story;
  assert.equal(result.playSource,'ai');assert.equal(result.visual.event,n%8<4?'rogi-0':'rogi-1');assert.equal(result.visual.step,n%4);
   assert.equal(calls,n<8?1:2);assert.ok(result.reply.includes(interactionQuestion(result.visual)||plan('rogi').segments[n%8<4?0:1].invitations[n%4]));
 }
 assert.equal(planSchema('rogi').properties.route.enum.length,20);
 for(const route of planSchema('rogi').properties.route.enum){const [a,b]=route.split('|');assert.notEqual(a,b);}
 const source=plan('rogi');assert.deepEqual(parsePlan(JSON.stringify({title:source.title,route:'rogi-0|rogi-1',leadIns:source.segments.map(x=>x.leadIn),invitations:source.segments.flatMap(x=>x.invitations)}),'rogi'),source);
});
test('invalid scene plans, markup, foreign actors and provider errors fall back without stopping the game',async()=>{
 for(const mutate of [p=>({...p,title:'안녕" onload="evil'}),p=>({...p,segments:[{...p.segments[0],event:'frank-0'},p.segments[1]]}),p=>({...p,segments:[p.segments[0],p.segments[0]]}),p=>({...p,segments:[{...p.segments[0],invitations:Array(4).fill('다 고쳤다고 해 줘!')},p.segments[1]]})]){
  assert.throws(()=>parsePlan(JSON.stringify(mutate(plan('tayo'))),'tayo'));
 }
 const result=await autoplayTurn({actor:'frank',aiStories:true},async()=>{throw Error('offline');});
 assert.equal(result.playSource,'prepared');assert.ok(result.notice);assert.equal(result.waitMs,5000);
 const switched=await autoplayTurn({actor:'lani',story:result.story,aiStories:false});assert.equal(switched.visual.actor,'lani');assert.equal(switched.visual.step,0);
});
test('AI opening does not repeat a sentence already in the action narration',async()=>{
 const value=plan('rogi');value.segments[0].leadIn=PLAY_EVENTS.rogi[0].narration[0].split('!')[0]+'!';
 const result=await autoplayTurn({actor:'rogi',aiStories:true},async()=>value);
 assert.equal(result.reply.split(value.segments[0].leadIn).length-1,1);
});
