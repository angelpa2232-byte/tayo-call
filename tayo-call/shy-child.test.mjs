import test from 'node:test';
import assert from 'node:assert/strict';
import {initialStory,prepareStory,advanceStory,proactiveNarration,sceneNarration} from './story.mjs';
import {PLAY_EVENTS} from './play-events.mjs';
test('a silent child gets varied everyday conversation and all five plays without invented answers',()=>{
 for(const actor of Object.keys(PLAY_EVENTS)){
  let state=initialStory(actor);const replies=[],events=new Set();
  for(let turn=0;turn<30;turn++){
   state=prepareStory(state,actor,'[프로그램 신호]','idle');
   if(state.mode==='event'){
    events.add(state.event);for(let step=0;step<4;step++){assert.ok(sceneNarration(state));state=advanceStory(state,'scene');}
   }else{const line=proactiveNarration(state,'idle');assert.ok(line);replies.push(line);state=advanceStory(state,'idle');}
  }
  assert.equal(events.size,5);assert.ok(replies.some(x=>x.includes('딸기')));assert.ok(replies.some(x=>x.includes('쉬는 날')));assert.ok(replies.some(x=>x.includes('블록')));assert.ok(replies.some(x=>x.includes('강아지')));
  assert.ok(!replies.some(x=>/네가.*갔|대답해|빨리 말해/.test(x)));assert.equal(state.lead,30);
 }
});
test('a shy child can answer in one word or stop a play and silence never becomes a user utterance',()=>{
 let state=prepareStory(initialStory('tayo'),'tayo','','idle');assert.ok(proactiveNarration(state,'idle').includes('딸기'));
 state=prepareStory(state,'tayo','딸기','child');assert.equal(state.mode,'chat');assert.equal(proactiveNarration(state,'child'),null);
 state=advanceStory(state);assert.equal(state.turns,1);
 state=prepareStory(state,'tayo','','idle');assert.ok(proactiveNarration(state,'idle').includes('듣기만'));
 state=prepareStory(state,'tayo','','idle');assert.equal(state.mode,'event');
 assert.equal(prepareStory(state,'tayo','그만할래','child').mode,'chat');
});
