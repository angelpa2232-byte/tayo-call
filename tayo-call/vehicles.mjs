import {VEHICLES,VEHICLE_GROUPS,vehicleById,vehiclesIn,vehicleNarration} from './vehicles-data.mjs';
import {vehicleSvg} from './vehicles-art.mjs';
const kinds=[['all','모두'],['car','자동차'],['work','일하는 차'],['help','도와주는 차'],['rail','기차']];
const headings=['어떤 탈것일까?','자세히 알아보자!','이런 점도 있네!'];
const motionWords={dump:'적재함이 위로 들리는 모습을 봐!',excavator:'긴 팔 끝의 바가지가 움직이는 걸 봐!',bulldozer:'앞의 넓은 날이 흙을 밀어!',crane:'갈고리가 짐을 천천히 들어 올려!',mixer:'커다란 통이 빙글빙글 돌고 있어!',firetruck:'사다리가 길게 올라가는 모습을 봐!',airplane:'활주로를 지나 하늘로 날아가!',helicopter:'회전날개가 빙글빙글 돌아!',balloon:'커다란 열기구가 둥실 떠올라!',submarine:'잠수함이 물속을 천천히 지나가!',sailboat:'돛단배가 바람을 받아 물 위로 나아가!',ship:'여객선이 물결을 따라 움직여!', 'cargo-ship':'짐을 실은 화물선이 항구를 떠나!',train:'기차가 철길을 따라 달려!'};
export class VehicleLibrary{
 constructor({document:doc=globalThis.document,onEnter=()=>{},onLeave=()=>{},onSpeak=()=>{}}={}){
  this.doc=doc;this.panel=doc.getElementById('vehicle-library-panel');this.content=doc.getElementById('vehicle-library-content');this.onEnter=onEnter;this.onLeave=onLeave;this.onSpeak=onSpeak;this.opened=false;this.group='land';this.kind='all';this.vehicleId=null;this.step=0;this.animate=false;this.pose=0;
  this.panel.onclick=event=>{const button=event.target.closest('button[data-vehicle-action]');if(!button||button.disabled)return;const {vehicleAction:action,value}=button.dataset;
   if(action==='group'){if(!VEHICLE_GROUPS[value])return;this.group=value;this.kind='all';this.menu();}
   else if(action==='kind'){if(!kinds.some(([id])=>id===value))return;this.kind=value;this.menu();}
   else if(action==='show')this.show(value);
   else if(action==='fact')this.show(this.vehicleId,Number(value));
   else if(action==='repeat')this.speak(vehicleNarration(this.vehicleId,this.step));
   else if(action==='motion')this.demonstrate();
   else if(action==='previous'||action==='next')this.adjacent(action==='next'?1:-1);
   else if(action==='menu')this.menu();else if(action==='close')this.close();
  };
  this.panel.onkeydown=event=>{if(event.key==='Escape'&&this.opened){event.preventDefault();this.close();}};
 }
 speak(text){this.onSpeak(text,'tayo');}
 open(id){if(!this.opened){this.opened=true;this.onEnter();}this.panel.hidden=false;if(vehicleById(id))this.show(id);else{this.menu();this.speak('어떤 탈것이 궁금해? 큰 그림을 눌러 봐!');}}
 menu(){
  this.vehicleId=null;this.animate=false;this.pose=0;
  const list=vehiclesIn(this.group,this.group==='land'?this.kind:'all');
  this.content.innerHTML=`<header class="vehicle-heading"><div><p>그림으로 만나는 탈것 20가지</p><h2>탈것 알아보기</h2></div><button data-vehicle-action="close">✕ 돌아가기</button></header><nav class="vehicle-groups" aria-label="탈것이 다니는 곳">${Object.entries(VEHICLE_GROUPS).map(([id,g])=>`<button data-vehicle-action="group" data-value="${id}" aria-pressed="${id===this.group}"><span>${g.icon}</span>${g.label}</button>`).join('')}</nav>${this.group==='land'?`<nav class="vehicle-kinds" aria-label="땅 위 탈것 종류">${kinds.map(([id,name])=>`<button data-vehicle-action="kind" data-value="${id}" aria-pressed="${id===this.kind}">${name}</button>`).join('')}</nav>`:''}<p class="vehicle-menu-hint">궁금한 탈것 그림을 골라 봐! · ${list.length}가지</p><div class="vehicle-grid">${list.map(v=>`<button class="vehicle-card" data-vehicle-action="show" data-value="${v.id}">${vehicleSvg(v.id)}<strong>${v.name}</strong>${v.alias?`<small>${v.alias}</small>`:''}<span>어떤 일을 하는지 들어보기 →</span></button>`).join('')}</div>`;
  this.panel.scrollTop=0;
 }
 show(id,step=0){
  const v=vehicleById(id);if(!v)return;
  this.vehicleId=id;this.step=Math.max(0,Math.min(2,Math.floor(Number(step)||0)));this.pose=this.step;this.animate=false;
  if(this.group!==v.group){this.group=v.group;this.kind='all';}
  else if(this.kind!=='all'&&this.kind!==v.kind)this.kind='all';
  this.render();this.speak(vehicleNarration(id,this.step));this.panel.scrollTop=0;
 }
 demonstrate(){if(!this.opened||!vehicleById(this.vehicleId))return;this.pose=(this.pose+1)%3;this.animate=true;this.render();this.speak(motionWords[this.vehicleId]||'바퀴가 빙글빙글! 길을 따라 움직이는 모습을 봐!');}
 adjacent(direction){const current=vehicleById(this.vehicleId);if(!current)return;const list=vehiclesIn(current.group,this.kind);const candidates=list.some(v=>v.id===current.id)?list:vehiclesIn(current.group);const index=candidates.findIndex(v=>v.id===current.id);this.show(candidates[(index+direction+candidates.length)%candidates.length].id);}
 render(){
  const v=vehicleById(this.vehicleId);if(!v)return;
  const scroll=this.panel.scrollTop;
  this.content.innerHTML=`<header class="vehicle-heading"><div><p>${VEHICLE_GROUPS[v.group].icon} ${VEHICLE_GROUPS[v.group].label}${v.alias?' · '+v.alias:''}</p><h2>${v.name}</h2></div><div class="vehicle-header-actions"><button data-vehicle-action="menu">다른 탈것</button><button data-vehicle-action="close">✕ 돌아가기</button></div></header><div class="vehicle-detail-grid"><div class="vehicle-picture">${vehicleSvg(v.id,{step:this.pose,animate:this.animate})}<div class="vehicle-observe">🔎 ${v.look}</div></div><section class="vehicle-explanation" aria-label="탈것 설명"><p class="vehicle-page-number">${this.step+1} / 3</p><h3>${headings[this.step]}</h3><p class="vehicle-fact" role="status" aria-live="polite">${v.facts[this.step]}</p><div class="vehicle-fact-tabs" aria-label="설명 고르기">${headings.map((h,index)=>`<button data-vehicle-action="fact" data-value="${index}" aria-pressed="${this.step===index}">${index+1}. ${['하는 일','알아보기','더 알기'][index]}</button>`).join('')}</div><div class="vehicle-main-actions"><button data-vehicle-action="repeat">🔊 다시 듣기</button><button class="vehicle-motion-button" data-vehicle-action="motion">▶ 움직여 보기</button>${this.step<2?`<button class="vehicle-next-fact" data-vehicle-action="fact" data-value="${this.step+1}">다음 설명 →</button>`:'<button class="vehicle-next-fact" data-vehicle-action="next">다음 탈것 →</button>'}</div></section></div><nav class="vehicle-browse" aria-label="다른 탈것 보기"><button data-vehicle-action="previous">← 이전 탈것</button><button data-vehicle-action="menu">▦ 그림 목록</button><button data-vehicle-action="next">다음 탈것 →</button></nav>`;
  this.panel.scrollTop=scroll;
 }
 close(notify=true){this.opened=false;this.animate=false;this.vehicleId=null;this.panel.hidden=true;this.content.innerHTML='';if(notify)this.onLeave();}
}
if(typeof window!=='undefined')window.VehicleLibrary=VehicleLibrary;
