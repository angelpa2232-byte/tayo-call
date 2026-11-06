import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MARINE_ANIMALS,marineIn,marineNarration,requestedMarine} from './marine-data.mjs';
import {marineSvg} from './marine-art.mjs';
import {MarineLibrary} from './marine.mjs';

test('20 distinct marine animals have matching drawings, habitats and three short explanations',()=>{
 assert.equal(MARINE_ANIMALS.length,20);assert.equal(new Set(MARINE_ANIMALS.map(a=>a.id)).size,20);
 for(const a of MARINE_ANIMALS){
  assert.equal(a.facts.length,3);
  for(let step=0;step<3;step++){assert.ok(a.facts[step].length<125);assert.ok(marineNarration(a.id,step).includes(a.facts[step]));}
  const svg=marineSvg(a.id,{animate:true});assert.ok(svg.includes(`data-habitat="${a.habitat}"`));assert.match(svg,/marine-animated/);assert.doesNotMatch(svg,/undefined|NaN|\$\{/);
  assert.ok(!svg.includes('url(#marine-'));
 }
 assert.equal(marineIn('fish').some(a=>a.id==='dolphin'),false);assert.equal(marineIn('fish').some(a=>a.id==='orca'),false);
 assert.equal((marineSvg('octopus').match(/class="marine-arm"/g)||[]).length,8);
 assert.equal(marineSvg('missing'),'');
});
test('spoken names prefer specific animals and accept child pronunciations without treating ordinary 게 syllables as a crab',()=>{
 for(const [text,expected] of [['돌고래 보고 싶어','dolphin'],['고래 설명해줘','whale'],['범고래요','orca'],['돌고레','dolphin'],['무너','octopus'],['니모','clownfish'],['도리 보여줘','blue-tang'],['거북이','turtle'],['팽귄','penguin'],['해달','otter'],['게','crab'],['꽃게','crab'],['게를 보여줘','crab'],['불가살이','starfish'],['돌고래 말고 고래','whale'],['상어 말고 문어','octopus']])assert.equal(requestedMarine(text),expected,text);
 for(const text of ['저게 뭐야','이게 좋아','크게 보여줘','다시 말해줘','상어 말고','돌고래는 싫어'])assert.equal(requestedMarine(text),null,text);
 assert.equal(requestedMarine('바다구북 설명해 줘.'),'turtle');
});
test('marine selection, paging and return work by click; voice starts only after narration when enabled and stale speech cannot open a mic',()=>{
 const panel={hidden:true},content={innerHTML:''},spoken=[];let permission=false,enters=0,leaves=0,voice;
 class Voice{constructor(o){this.o=o;this.started=0;voice=this;}stop(){this.phase='idle';}start(){if(this.o.allowed()){this.started++;this.phase='listening';}}}
 const library=new MarineLibrary({document:{hidden:false,getElementById:id=>id==='marine-library-panel'?panel:content},onEnter:()=>enters++,onLeave:()=>leaves++,onSpeak:(text,actor,done)=>spoken.push({text,done}),canListen:()=>permission,VoiceSearch:Voice});
 const click=(action,value)=>panel.onclick({target:{closest:()=>({disabled:false,dataset:{marineAction:action,value}})}});
 library.open();spoken.at(-1).done();assert.equal(voice.started,0);
 for(const a of MARINE_ANIMALS){click('show',a.id);for(let n=0;n<3;n++){click('fact',n);assert.equal(spoken.at(-1).text,marineNarration(a.id,n));assert.ok(content.innerHTML.includes(a.facts[n]));}}
 permission=true;library.show('dolphin');assert.equal(voice.started,0);const stale=spoken.at(-1).done;
 library.show('octopus');stale();assert.equal(voice.started,0);spoken.at(-1).done();assert.equal(voice.started,1);
 voice.o.onText('바다거북 보여줘');assert.equal(library.animalId,'turtle');spoken.at(-1).done();
 voice.o.onText('다음 설명');assert.equal(library.step,1);voice.o.onText('이게 뭐야');assert.equal(library.animalId,'turtle');
 permission=false;library.hear('상어');assert.equal(library.animalId,'turtle');
 const late=spoken.at(-1).done;library.close();late();assert.equal(library.opened,false);assert.equal(panel.hidden,true);assert.equal(enters,1);assert.equal(leaves,1);
 library.hear('고래');assert.equal(library.animalId,null);
});
