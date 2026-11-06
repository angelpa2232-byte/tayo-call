import test from 'node:test';
import assert from 'node:assert/strict';
import {initialStory,prepareStory,advanceStory,sceneNarration} from './story.mjs';
import {sceneView,sceneSvg} from './scene-visuals.mjs';
import {buildMessages} from './conversation.mjs';
test('explicit dispatch begins immediately; every scene depicts the action being spoken',()=>{
 let state=prepareStory(initialStory('frank'),'frank','출동해서 불 꺼줘');
 assert.equal(state.mode,'event');assert.equal(state.step,0);assert.match(sceneNarration(state),/출동/);
 const views=[];
 for(let i=0;i<4;i++){const view=sceneView(state);views.push(sceneSvg(view));assert.equal(view.step,i);assert.equal(view.mission,true);assert.equal(view.autoplay,i<3);assert.ok(!/같이 할까|쉴까|굴러볼까/.test(sceneNarration(state)));state=advanceStory(state,'scene');}
 assert.ok(views[0].includes('mission-drive'));assert.ok(!views[0].includes('scene-flame'));assert.ok(views[1].includes('scene-flame'));assert.ok(!views[1].includes('scene-water'));assert.ok(views[2].includes('scene-water'));assert.ok(views[3].includes('scene-cleanup'));assert.ok(!views[3].includes('scene-flame'));assert.equal(state.mode,'chat');
});
test('accident scene shows stopped cars, cones, towing and clear road',()=>{
 let state=prepareStory(initialStory('pat'),'pat','사고 수습해줘');assert.equal(state.scene,'accident');
 const views=[];for(let i=0;i<4;i++){views.push(sceneSvg(sceneView(state)));state=advanceStory(state,'scene');}
 assert.ok(views[0].includes('scene-stopped-cars'));assert.ok(views[1].includes('#f69642'));assert.ok(views[2].includes('scene-tow'));assert.ok(views[3].includes('scene-road-clear'));assert.ok(!views[3].includes('scene-stopped-cars'));
});
test('automatic scene signals are program signals and refusals still stop play',()=>{
 const state=prepareStory(initialStory('frank'),'frank','불 꺼줘');const messages=buildMessages('next',[],state,'scene','frank');
 assert.ok(messages.at(-1).content.includes('아이가 대답한 것이 아님'));assert.equal(prepareStory(state,'frank','그만할래').mode,'chat');assert.deepEqual(advanceStory(state,'idle'),state);
});
