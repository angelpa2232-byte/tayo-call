import {MARINE_ANIMALS,MARINE_GROUPS,MARINE_REFERENCES,marineById,marineIn,marineNarration,requestedMarine} from './marine-data.mjs';
import {marineSvg} from './marine-art.mjs';
import {MarineVoiceSearch} from './marine-voice.mjs';
export class MarineLibrary{
 constructor({document:doc=globalThis.document,onEnter=()=>{},onLeave=()=>{},onSpeak=(text,actor,done)=>done?.(),onQuiet=()=>{},canListen=()=>false,post,VoiceSearch=MarineVoiceSearch}={}){
  this.doc=doc;this.panel=doc.getElementById('marine-library-panel');this.content=doc.getElementById('marine-library-content');this.onEnter=onEnter;this.onLeave=onLeave;this.onSpeak=onSpeak;this.onQuiet=onQuiet;this.canListen=canListen;this.opened=false;this.group='all';this.animalId=null;this.step=0;this.epoch=0;this.voiceMessage='';
  this.voice=new VoiceSearch({allowed:()=>this.opened&&canListen()&&!doc.hidden,post,onText:text=>this.hear(text),onStatus:(phase,text)=>this.updateVoice(phase,text)});
  this.panel.onclick=event=>{const button=event.target.closest('button[data-marine-action]');if(!button||button.disabled)return;const {marineAction:action,value}=button.dataset;
   if(action==='group'){if(!MARINE_GROUPS[value])return;this.group=value;this.menu();}
   else if(action==='show')this.show(value);else if(action==='fact')this.show(this.animalId,Number(value));
   else if(action==='repeat'&&this.animalId)this.speak(marineNarration(this.animalId,this.step));
   else if(action==='motion'){this.animate=true;this.render();this.speak('주인공의 몸이 어떻게 움직이는지 살펴봐!');}
   else if(action==='next'||action==='previous')this.adjacent(action==='next'?1:-1);
   else if(action==='menu')this.menu();else if(action==='close')this.close();
   else if(action==='voice'){if(['listening','preparing','processing'].includes(this.voice.phase)){this.epoch++;this.voice.stop();this.updateVoice('idle','이름 듣기를 멈췄어요. 그림을 눌러도 돼요.');}else this.listen();}
  };
  this.panel.onkeydown=event=>{if(event.key==='Escape'&&this.opened){event.preventDefault();this.close();}};
 }
 updateVoice(phase,text){this.voicePhase=phase;this.voiceMessage=text;const status=this.content.querySelector?.('.marine-voice-status');if(status)status.textContent=text;const button=this.content.querySelector?.('[data-marine-action="voice"]');if(button){button.disabled=!this.canListen();button.textContent=['listening','preparing','processing'].includes(phase)?'◼ 이름 듣기 멈추기':'🎙️ 이름 말하기';}}
 voiceBar(){return `<div class="marine-voice-bar"><p class="marine-voice-status" role="status" aria-live="polite"></p><button data-marine-action="voice" ${this.canListen()?'':'disabled'}>🎙️ 이름 말하기</button></div>`;}
 refreshVoice(){this.updateVoice('idle',this.canListen()?'설명이 끝나면 동물 이름을 말해 봐요.':'이름으로 찾기: 부모님 설정에서 음성인식을 켜 주세요.');}
 speak(text){
  this.voice.stop();const epoch=++this.epoch;this.updateVoice('speaking',this.canListen()?'설명을 듣고 있어요. 끝나면 동물 이름을 말해 주세요.':'그림을 눌러 고를 수 있어요. 음성인식은 꺼져 있어요.');
  this.onSpeak(text,'tayo',()=>{if(this.opened&&epoch===this.epoch&&this.canListen()&&!this.doc.hidden)this.listen(false);});
 }
 listen(interrupt=true){if(!this.opened)return;if(interrupt){this.epoch++;this.onQuiet();}return this.voice.start();}
 open(id){if(!this.opened){this.opened=true;this.onEnter();}this.panel.hidden=false;if(marineById(id))this.show(id);else this.menu();}
 menu(){
  this.voice.stop();this.epoch++;this.animalId=null;this.animate=false;
  const animals=marineIn(this.group);
  this.content.innerHTML=`<header class="vehicle-heading"><div><p>그림과 목소리로 만나는 바다 친구 20종</p><h2>해양동물 알아보기</h2></div><button data-marine-action="close">✕ 돌아가기</button></header><nav class="marine-groups" aria-label="해양동물 종류">${Object.entries(MARINE_GROUPS).map(([id,label])=>`<button data-marine-action="group" data-value="${id}" aria-pressed="${this.group===id}">${label}</button>`).join('')}</nav>${this.voiceBar()}<p class="vehicle-menu-hint">궁금한 동물 그림을 눌러 봐! · ${animals.length}종</p><div class="vehicle-grid">${animals.map(a=>`<button class="vehicle-card marine-card" data-marine-action="show" data-value="${a.id}">${marineSvg(a.id)}<strong>${a.name}</strong><span>어떤 바다 친구인지 들어보기 →</span></button>`).join('')}</div><details class="marine-sources"><summary>부모님용 설명 참고 자료</summary>${MARINE_REFERENCES.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a>`).join('')}</details>`;
  this.panel.scrollTop=0;this.refreshVoice();this.speak('어떤 바다 친구가 궁금해? 그림을 누르거나 이름을 말해 봐!');
 }
 show(id,step=0){const animal=marineById(id);if(!animal)return;this.voice.stop();this.epoch++;this.animalId=id;this.step=Math.max(0,Math.min(2,Math.floor(Number(step)||0)));this.animate=true;this.render();this.speak(marineNarration(id,this.step));this.panel.scrollTop=0;}
 adjacent(direction){if(!this.animalId)return;const shown=marineIn(this.group),list=shown.some(a=>a.id===this.animalId)?shown:MARINE_ANIMALS;const index=list.findIndex(a=>a.id===this.animalId);this.show(list[(index+direction+list.length)%list.length].id);}
 hear(text){
  if(!this.opened||!this.canListen())return;
  const found=requestedMarine(text);if(found){this.show(found);return;}
  const command=String(text||'').replace(/\s/g,'');
  if(/그만|닫아|돌아가/.test(command)){this.close();return;}
  if(/다른동물|목록|처음으로/.test(command)){this.menu();return;}
  if(this.animalId&&/다시|한번더/.test(command)){this.speak(marineNarration(this.animalId,this.step));return;}
  if(this.animalId&&/다음설명|더알려|다음이야기/.test(command)){this.show(this.animalId,Math.min(2,this.step+1));return;}
  if(this.animalId&&/다음동물/.test(command)){this.adjacent(1);return;}
  this.updateVoice('idle','동물 이름을 찾지 못했어요. 그림을 고르거나 마이크 버튼을 눌러 다시 말해 주세요.');
 }
 render(){
  const a=marineById(this.animalId);if(!a)return;const scroll=this.panel.scrollTop;
  this.content.innerHTML=`<header class="vehicle-heading"><div><p>🐬 ${MARINE_GROUPS[a.group]}</p><h2>${a.name}</h2></div><div class="vehicle-header-actions"><button data-marine-action="menu">다른 동물</button><button data-marine-action="close">✕ 돌아가기</button></div></header>${this.voiceBar()}<div class="vehicle-detail-grid"><div class="vehicle-picture marine-picture">${marineSvg(a.id,{animate:this.animate})}<div class="vehicle-observe">🔎 ${a.look}</div></div><section class="vehicle-explanation" aria-label="동물 설명"><p class="vehicle-page-number">${this.step+1} / 3</p><h3>${['어떤 바다 친구일까?','몸과 움직임을 살펴봐!','이런 점도 있네!'][this.step]}</h3><p class="vehicle-fact" role="status" aria-live="polite">${a.facts[this.step]}</p><div class="vehicle-fact-tabs" aria-label="설명 고르기">${a.facts.map((_,i)=>`<button data-marine-action="fact" data-value="${i}" aria-pressed="${this.step===i}">${i+1}. ${['소개','알아보기','더 알기'][i]}</button>`).join('')}</div><div class="vehicle-main-actions"><button data-marine-action="repeat">🔊 다시 듣기</button><button class="vehicle-motion-button" data-marine-action="motion">▶ 움직여 보기</button>${this.step<2?`<button class="vehicle-next-fact" data-marine-action="fact" data-value="${this.step+1}">다음 설명 →</button>`:'<button class="vehicle-next-fact" data-marine-action="next">다음 동물 →</button>'}</div></section></div><nav class="vehicle-browse" aria-label="다른 바다 친구 보기"><button data-marine-action="previous">← 이전 동물</button><button data-marine-action="menu">▦ 그림 목록</button><button data-marine-action="next">다음 동물 →</button></nav>`;
  this.panel.scrollTop=scroll;this.refreshVoice();
 }
 close(notify=true){this.epoch++;this.voice.stop();this.opened=false;this.animalId=null;this.panel.hidden=true;this.content.innerHTML='';if(notify)this.onLeave();}
}
if(typeof window!=='undefined')window.MarineLibrary=MarineLibrary;
