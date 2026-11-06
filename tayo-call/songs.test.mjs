import {test} from 'node:test';
import assert from 'node:assert/strict';
import {musicTurn,requestedSong,SONGS} from './songs.mjs';
import {initialStory} from './story.mjs';
process.env.PORT='18088';
test('song requests, agreement and refusal stay separate from ordinary conversation',()=>{
  for(const text of ['노래 틀어줘','같이 노래 부를까?','타요 노래','노래 듣고 싶어'])assert.equal(requestedSong(text),'tayo');
  assert.equal(requestedSong('폴리 주제곡 틀어줘'),'poli');
  assert.equal(requestedSong('응'),null);assert.equal(requestedSong('응',true),'tayo');
  for(const text of ['노래 싫어','노래 안 들을래','노래 안 듣고 싶어','노래 부르지 마','그만 틀어','티라노가 좋아'])assert.equal(requestedSong(text,true),null);
  const state={...initialStory('frank'),lead:5};
  assert.equal(musicTurn('', 'idle',state).musicOffer,true);
  assert.equal(musicTurn('', 'idle',{...state,mode:'event'}),null);
  assert.equal(musicTurn('응','child',state,true).music,'tayo');
  assert.equal(musicTurn('싫어','child',state,true),null);
});
test('song selection works without an AI request and preserves an interrupted mission',async()=>{
  const {makeServer}=await import('./server.mjs');let calls=0;
  const server=makeServer(async()=>{calls++;throw new Error('AI must not be called');},undefined,undefined,{read:async()=>({provider:'ollama',key:''})});
  await new Promise(r=>server.listen(18088,'127.0.0.1',r));
  const post=data=>fetch('http://127.0.0.1:18088/api/chat',{method:'POST',headers:{origin:'http://127.0.0.1:18088','Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json());
  try{
    const offer=await post({text:'진행 신호',kind:'idle',actor:'frank',story:{...initialStory('frank'),lead:4}});
    assert.equal(offer.musicOffer,true);
    const agreed=await post({text:'응',actor:'frank',story:offer.story});assert.equal(agreed.music,'tayo');assert.equal(agreed.story.musicOffer,false);
    const mission={...initialStory('pat'),mode:'event',event:'pat-2',scene:'accident',step:2};
    const poli=await post({text:'폴리 노래 틀어줘',actor:'pat',story:mission});
    assert.equal(poli.music,'poli');assert.equal(poli.actor,'pat');assert.equal(poli.story.event,mission.event);assert.equal(poli.story.step,2);assert.equal(calls,0);
    for(const path of ['/songs.mjs','/song-player.js'])assert.equal((await fetch('http://127.0.0.1:18088'+path)).status,200);
    assert.equal(SONGS.poli.videoId,'3WmTrdytPso');
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
