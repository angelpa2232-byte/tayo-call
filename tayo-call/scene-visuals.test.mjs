import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sceneView,sceneSvg} from './scene-visuals.mjs';
import {advanceStory,storyDirection} from './story.mjs';
test('Frank visual stages match departure, flames, water and extinguished state',()=>{
 const views=[0,1,2,3].map(step=>sceneView({scene:'rescue',step}));
 assert.equal(views[0].flames,false);assert.equal(views[1].flames,true);
 assert.equal(views[2].water,true);assert.equal(views[3].flames,false);assert.equal(views[3].complete,true);
 assert.ok(sceneSvg(views[1]).includes('scene-flame'));assert.ok(sceneSvg(views[2]).includes('scene-water'));
 assert.ok(!sceneSvg(views[3]).includes('scene-flame'));assert.ok(storyDirection({scene:'rescue',step:1}).includes('아직 불을 껐다고 말하지 마'));
 assert.deepEqual(advanceStory({scene:'rescue',step:1,round:0},'idle'),{scene:'rescue',step:1,round:0});
});
test('other scenes contain contextual illustrated props',()=>{
 assert.ok(sceneSvg(sceneView({scene:'repair'})).includes('rogi.png'));
 assert.ok(sceneSvg(sceneView({scene:'outing'})).includes('공룡 모형 공원'));
 assert.ok(sceneSvg(sceneView({scene:'wash',step:1})).includes('scene-bubbles'));
});
