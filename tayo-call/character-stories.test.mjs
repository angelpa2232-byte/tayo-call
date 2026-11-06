import test from 'node:test';
import assert from 'node:assert/strict';
import {PLAY_EVENTS} from './play-events.mjs';
import {initialStory,prepareStory,advanceStory,storyDirection} from './story.mjs';
import {sceneView,sceneSvg} from './scene-visuals.mjs';
test('30 events across six characters return to daily conversation and vary',()=>{
 assert.equal(Object.values(PLAY_EVENTS).flat().length,30);
 for(const actor of Object.keys(PLAY_EVENTS)){
  let state=initialStory(actor);const seen=new Set();
  for(let round=0;round<5;round++){
   assert.equal(state.mode,'chat');assert.equal(sceneView(state).scene,'daily');
   for(let n=0;n<3;n++)state=advanceStory(state);
   assert.equal(state.mode,'event');seen.add(state.event);
   for(let n=0;n<4;n++){
    assert.ok(storyDirection(state).length>50);
    assert.ok(sceneSvg(sceneView(state)).includes('<svg'));
    assert.deepEqual(advanceStory(state,'idle'),state);
    state=advanceStory(state);
   }
   assert.equal(state.mode,'chat');
  }
  assert.equal(seen.size,5);
 }
});
test('interest selects relevant event; refusal and actor switching reset to conversation',()=>{
 let state=prepareStory(initialStory('tayo'),'tayo','티라노 좋아');
 for(let i=0;i<3;i++)state=advanceStory(state);
 assert.equal(state.scene,'outing');
 assert.equal(prepareStory(state,'tayo','놀이 안할래').mode,'chat');
 assert.equal(prepareStory(state,'pat','패트').actor,'pat');
 assert.equal(prepareStory(state,'tayo','', 'idle').event,state.event);assert.equal(prepareStory(state,'tayo','', 'idle').step,state.step);
});
test('Pat traffic lamps follow the scene',()=>{
 assert.ok(sceneSvg(sceneView({scene:'traffic',step:1})).includes('data-car-signal="red"'));
 assert.ok(sceneSvg(sceneView({scene:'traffic',step:2})).includes('data-car-signal="green"'));
});
