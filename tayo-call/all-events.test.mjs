import test from 'node:test';
import assert from 'node:assert/strict';
import {PLAY_EVENTS} from './play-events.mjs';
import {actionProps} from './action-scenes.mjs';
import {sceneSvg,sceneView} from './scene-visuals.mjs';
import {initialStory,prepareStory,advanceStory,sceneNarration} from './story.mjs';
test('every character has five complete staged plays with dedicated visuals and narration',()=>{
 assert.equal(Object.values(PLAY_EVENTS).flat().length,30);
 for(const [actor,events] of Object.entries(PLAY_EVENTS)){
  assert.equal(events.length,5);assert.equal(new Set(events.map(e=>e.visual)).size,5);
  for(const event of events){
   assert.equal(event.narration.length,4);assert.equal(event.captions.length,4);const pictures=[];
   for(let step=0;step<4;step++){
    const state={actor,mode:'event',event:event.id,scene:event.visual,step,round:0};
    const view=sceneView(state);assert.equal(view.scene,event.visual);assert.equal(view.mission,true);assert.equal(view.autoplay,step<3);assert.equal(view.actor,actor);
    assert.ok(actionProps(view),event.id+' has a dedicated illustration');pictures.push(sceneSvg(view));
    assert.ok(sceneNarration(state)?.length>10);assert.ok(!/같이 쉴까|천천히 굴러볼까/.test(sceneNarration(state)));
    const next=advanceStory(state,'scene');assert.equal(next.mode,step<3?'event':'chat');
   }
   assert.equal(new Set(pictures).size,4,event.id+' changes at every stage');
  }
 }
});
test('new situations can start by speech, including replay after completion',()=>{
 for(const [actor,events] of Object.entries(PLAY_EVENTS)){
  const event=events[4];const state=prepareStory({...initialStory(actor),lastEvent:event.id},actor,event.title+' 보여줘');
  assert.equal(state.mode,'event',actor);assert.equal(state.event,event.id,actor);
 }
 assert.equal(prepareStory(initialStory('lani'),'lani','꽃밭 소풍 가자').event,'lani-2');
});
