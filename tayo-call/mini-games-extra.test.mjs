import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GAMES,newRound,choose,demoChoice,instruction,gameArt,MiniGames} from './mini-games.mjs';
import {EXTRA_GAMES,isRepeat} from './mini-games-extra.mjs';
import {PressGate} from './mini-game-input.mjs';

test('ten additional games have three playable rounds and only valid actions advance them',()=>{
 assert.equal(Object.keys(EXTRA_GAMES).length,10);assert.equal(Object.keys(GAMES).length,13);
 for(const id of Object.keys(EXTRA_GAMES))for(let round=0;round<3;round++){
  let s=newRound(id,round),moves=0;const first=gameArt(s);
  assert.ok(instruction(s));assert.equal(choose(s,'invalid').state,s);
  while(!s.done){
   const move=demoChoice(s),old=s,result=choose(s,move);
   assert.equal(result.changed,true,id);s=result.state;moves++;
   assert.equal(s.progress,moves);assert.equal(s.assisted,false);assert.notEqual(s,old);
   if(EXTRA_GAMES[id].mode==='collect')assert.equal(choose(s,move).state,s);
   if(EXTRA_GAMES[id].mode==='sort'&&!s.done){const wrong=s.options.find(v=>v!==s.target);assert.equal(choose(s,wrong).state,s);}
   assert.ok(moves<=12,'No unreachable goal');
  }
  assert.equal(moves,s.goal,id);assert.notEqual(gameArt(s),first,id+' visible result');
  assert.equal(choose(s,demoChoice(s)).state,s);
  assert.doesNotMatch(gameArt(s),/undefined|NaN/);
 }
});
test('a physical key can advance only once until released, even if repeat is incorrectly absent',()=>{
 const gate=new PressGate();assert.equal(gate.press('Space'),true);
 for(let i=0;i<100;i++){assert.equal(gate.press('Space',true),false);assert.equal(gate.press('Space',false),false);}
 gate.release('Space');assert.equal(gate.press('Space'),true);
 gate.reset();assert.equal(gate.press('Space',true),false);assert.equal(gate.press('Space'),false);
 gate.release('Space');assert.equal(gate.press('Space'),true);
});
function fixture(){
 const content={innerHTML:''},panel={hidden:true},events=new Map(),blurEvents=new Map(),spoken=[];
 const doc={hidden:false,getElementById:id=>id==='mini-game-panel'?panel:content,addEventListener:(name,fn)=>events.set(name,fn),defaultView:{addEventListener:(name,fn)=>blurEvents.set(name,fn)}};
 const game=new MiniGames({document:doc,onSpeak:(...args)=>spoken.push(args)});
 const key=(name,code='Space',repeat=false,target={closest:()=>null})=>{
  const event={code,repeat,target,prevented:false,preventDefault(){this.prevented=true;},stopPropagation(){}};
  events.get(name)(event);return event;
 };
 const click=(action,value)=>panel.onclick({target:{closest:()=>({dataset:{gameAction:action,value},disabled:false})}});
 return {game,doc,key,click,spoken,blur:()=>blurEvents.get('blur')()};
}
test('holding Space or Enter never auto-inflates; each released press and each screen click advances exactly once',()=>{
 for(const id of Object.keys(EXTRA_GAMES).filter(isRepeat)){
  const f=fixture();f.game.open(id);const initialVoices=f.spoken.length;
  assert.equal(f.key('keydown').prevented,true);assert.equal(f.game.state.progress,1);
  for(let i=0;i<30;i++)f.key('keydown','Space',true);
  f.key('keydown','Space',false);assert.equal(f.game.state.progress,1);
  f.game.hint();assert.equal(f.game.state.progress,1,'Hint never plays on behalf of child');
  assert.equal(f.key('keyup').prevented,true);f.key('keydown');assert.equal(f.game.state.progress,2);f.key('keyup');
  assert.equal(f.spoken.length,initialVoices+1,'Rapid taps do not request a voice for every step; only hint spoke');
  f.click('pick','press');assert.equal(f.game.state.progress,3);
  if(!f.game.state.done){f.key('keydown','Enter');const progress=f.game.state.progress;for(let n=0;n<20;n++)f.key('keydown','Enter',true);assert.equal(f.game.state.progress,progress);f.key('keyup','Enter');}
  while(!f.game.state.done)f.click('pick','press');
  const end=f.game.state.progress;f.key('keydown');assert.equal(f.game.state.progress,end);
  f.click('next');assert.equal(f.game.state.progress,0);f.key('keydown','Space',true);assert.equal(f.game.state.progress,0,'Held key cannot skip into next round');
  f.key('keyup');f.key('keydown');assert.equal(f.game.state.progress,1);f.key('keyup');
  f.game.close();assert.equal(f.key('keydown').prevented,false);
 }
});
test('typing, navigation controls, hidden tabs and menus never pump a balloon',()=>{
 const f=fixture();f.game.open('balloon');
 const input={closest:q=>q.includes('input')?{}:null};assert.equal(f.key('keydown','Space',false,input).prevented,false);
 const backButton={closest:q=>q==='button'?{dataset:{gameAction:'close'}}:null};assert.equal(f.key('keydown','Space',false,backButton).prevented,false);
 f.doc.hidden=true;f.key('keydown');assert.equal(f.game.state.progress,0);f.doc.hidden=false;
 f.key('keydown');assert.equal(f.game.state.progress,1);f.blur();f.key('keydown','Space',true);assert.equal(f.game.state.progress,1);
 f.key('keyup');f.key('keydown');assert.equal(f.game.state.progress,2);f.key('keyup');
 f.game.menu();assert.equal(f.key('keydown').prevented,false);f.click('filter','easy');assert.ok(f.game.content.innerHTML.includes('풍선 팡팡'));assert.ok(!f.game.content.innerHTML.includes('승객 태우기'));
 f.game.close();
});
