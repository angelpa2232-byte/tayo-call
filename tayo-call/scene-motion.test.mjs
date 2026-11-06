import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PLAY_EVENTS} from './play-events.mjs';
import {sceneSvg,sceneView} from './scene-visuals.mjs';
import {prepareStory,initialStory,sceneNarration} from './story.mjs';
import {sceneBackdrop} from './scene-backdrops.mjs';
test('background architecture never duplicates foreground signs or building labels',()=>{
 const daily=sceneSvg(sceneView({mode:'chat',scene:'daily',step:0}));
 assert.equal((daily.match(/차고지 쉼터/g)||[]).length,1);
 for(const events of Object.values(PLAY_EVENTS))for(const event of events)for(let step=0;step<4;step++)assert.ok(!sceneBackdrop({scene:event.visual,step}).includes('<text'));
});
test('all 120 stages contain an appropriate setting and animated action',()=>{
 let count=0;
 for(const [actor,events] of Object.entries(PLAY_EVENTS))for(const event of events)for(let step=0;step<4;step++){
  const svg=sceneSvg(sceneView({actor,mode:'event',event:event.id,scene:event.visual,step}));
  assert.match(svg,/data-backdrop=/,event.id+' setting');
  assert.match(svg,/data-motion=|mission-drive|scene-water|scene-flame|scene-tow|scene-extinguishing/,event.id+' stage '+step+' action');
  assert.ok(!svg.includes('undefined')&&!svg.includes('NaN'),event.id);count++;
 }
 assert.equal(count,120);
});
test('tire story removes a wheel, installs a replacement and drives away in matching order',()=>{
 const start=prepareStory(initialStory('rogi'),'rogi','타이어 고쳐줘');assert.equal(start.event,'rogi-0');
 const frames=[0,1,2,3].map(step=>sceneSvg(sceneView({...start,step})));
 assert.match(frames[0],/repair-wobble/);assert.match(frames[0],/data-backdrop="town"/);
 assert.match(frames[1],/jack-lift/);assert.match(frames[1],/wheel-detach/);assert.match(frames[1],/loosen-bolts/);assert.match(frames[1],/data-backdrop="garage"/);
 assert.ok(!frames[1].includes('wheel-install'));assert.match(sceneNarration({...start,step:1}),/헌 타이어/);
 assert.match(frames[2],/wheel-install/);assert.match(frames[2],/tighten-bolts/);assert.match(sceneNarration({...start,step:2}),/새 타이어/);
 assert.match(frames[3],/repaired-bus-departs/);assert.match(frames[3],/wheel-roll/);assert.ok(!frames[3].includes('jack-lift'));
});
test('key actions move the objects named in narration, not just decorative scenery',()=>{
 const frame=(id,step)=>{const event=Object.values(PLAY_EVENTS).flat().find(e=>e.id===id);return sceneSvg(sceneView({actor:id.split('-')[0],mode:'event',event:id,scene:event.visual,step}));};
 for(const [id,step,action] of [['tayo-0',1,'passengers-board'],['tayo-0',3,'passengers-exit'],['rogi-2',2,'return-ball-to-owner'],['rogi-4',2,'climb-out-on-board'],['lani-0',1,'fill-gift-parcel'],['lani-0',3,'hand-parcel-to-friend'],['lani-4',2,'lower-balloon-with-grabber'],['gani-0',2,'rinse-bubbles-away'],['gani-4',2,'sort-paper-into-bin'],['frank-1',2,'bring-cat-down-ladder'],['frank-4',2,'move-branch-off-road'],['pat-2',2,'tow-stopped-bus'],['pat-4',2,'adult-and-child-cross']])assert.ok(frame(id,step).includes(action),id+' '+action);
});
test('motion styles freeze for audio preparation and settings, and honor reduced motion',async()=>{
 const css=await readFile(new URL('scene-motion.css',import.meta.url),'utf8');
 assert.match(css,/\.scene-waiting \*, \.scene-suspended \*\{animation-play-state:paused/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
