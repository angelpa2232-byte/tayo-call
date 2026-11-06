import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GAMES,newRound,choose,demoChoice,instruction,gameArt,MiniGames} from './mini-games.mjs';

test('counting boards distinct passengers once and stops exactly at 1, 2, 3',()=>{
 for(let round=0;round<3;round++){
  let state=newRound('count',round);assert.equal(state.target,round+1);
  for(let n=0;n<=round;n++){
   const old=state;state=choose(state,n).state;assert.equal(state.selected.length,n+1);
   assert.equal(state.done,n===round);assert.equal(choose(state,n).state,state);
   assert.notEqual(old,state);
  }
  assert.equal(choose(state,2).state,state);assert.match(gameArt(state),/mini-drive/);
 }
});
test('wrong colors and gifts encourage retry without changing progress; matches animate the result',()=>{
 for(const id of ['colors','gifts'])for(let round=0;round<3;round++){
  const state=newRound(id,round),wrong=state.options.find(x=>x!==state.target);
  const retry=choose(state,wrong);assert.equal(retry.state,state);assert.ok(retry.feedback);assert.equal(state.done,false);
  const answer=choose(state,state.target);assert.equal(answer.state.done,true);assert.equal(answer.state.assisted,false);
  assert.match(gameArt(answer.state),id==='colors'?/mini-water/:/mini-parcel/);
  assert.equal(choose(answer.state,state.target).changed,false);
 }
});
test('game menu, repeat, three rounds, hints and demonstrations work without microphone or an AI request',()=>{
 const content={innerHTML:''},panel={hidden:true};const doc={getElementById:id=>id==='mini-game-panel'?panel:content};
 let enters=0,leaves=0;const spoken=[];const game=new MiniGames({document:doc,onEnter:()=>enters++,onLeave:()=>leaves++,onSpeak:(...args)=>spoken.push(args)});
 const click=(action,value)=>panel.onclick({target:{closest:()=>({dataset:{gameAction:action,value},disabled:false})}});
 game.open();assert.equal(panel.hidden,false);assert.equal(enters,1);assert.match(content.innerHTML,/타요의 승객/);
 for(const id of Object.keys(GAMES)){
  click('select',id);assert.match(content.innerHTML,/1 \/ 3번째/);
  for(let round=0;round<3;round++){
   const before=game.state;click('hint');assert.equal(game.state,before);assert.match(content.innerHTML,/mini-hint/);
   click('repeat');assert.equal(spoken.at(-1)[0],instruction(before));
   while(!game.state.done){click('demo');assert.equal(game.state.assisted,true);}
   if(round<2)click('next');
  }
  assert.match(content.innerHTML,/세 가지 미션 끝/);click('again');assert.equal(game.state.round,0);
  click('menu');assert.equal(game.state,null);
 }
 game.open('colors');game.close();assert.equal(enters,1);assert.equal(leaves,1);assert.equal(panel.hidden,true);assert.equal(game.state,null);game.hint();assert.equal(content.innerHTML,'');
});
