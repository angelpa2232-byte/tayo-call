import {EXTRA_GAMES,isExtra,isRepeat,extraRound,extraInstruction,extraChoose,extraDemo,extraArt,extraControls,extraHint} from './mini-games-extra.mjs';
import {PressGate} from './mini-game-input.mjs';
export const GAMES={
 count:{title:'타요의 승객 태우기',actor:'tayo',skill:'하나 · 둘 · 셋',description:'친구를 눌러 버스에 태워요',scene:'passengers'},
 colors:{title:'프랭크의 색깔 물대포',actor:'frank',skill:'빨강 · 파랑 · 노랑',description:'같은 색 표적에 물을 쏴요',scene:'training'},
 gifts:{title:'라니의 선물 짝 찾기',actor:'lani',skill:'같은 그림 찾기',description:'친구가 원하는 선물을 찾아요',scene:'delivery'},
 ...EXTRA_GAMES
};
const colors=[{id:'red',name:'빨간',fill:'#f47569'},{id:'blue',name:'파란',fill:'#539edb'},{id:'yellow',name:'노란',fill:'#f5c856'}];
const presents=[{id:'bear',name:'곰 인형'},{id:'ball',name:'공'},{id:'flower',name:'꽃'}];
const rotate=(items,n)=>items.map((_,i)=>items[(i+n)%items.length]);
export function newRound(id,round=0){
 if(!GAMES[id])throw Error('Unknown game');
 const index=Number.isFinite(round)?Math.max(0,Math.min(2,Math.floor(round))):0;
 if(isExtra(id))return extraRound(id,index);
 return {id,round:index,target:id==='count'?index+1:id==='colors'?colors[index].id:presents[index].id,selected:[],done:false,assisted:false,options:rotate(id==='count'?[0,1,2]:id==='colors'?colors.map(c=>c.id):presents.map(p=>p.id),index)};
}
export function instruction(state){
 if(isExtra(state.id))return extraInstruction(state);
 return state.id==='count'?`친구 ${['한','두','세'][state.target-1]} 명을 태워 보자! 친구를 한 명씩 눌러 줘.`:state.id==='colors'?`${colors.find(c=>c.id===state.target).name} 동그라미에 물을 쏴 보자!`:`친구가 ${presents.find(p=>p.id===state.target).name}을 기다려! 같은 선물을 찾아 줘.`;
}
export function choose(state,value,assisted=false){
 if(isExtra(state.id))return extraChoose(state,value,assisted);
 if(state.done||!state.options.includes(value)||state.selected.includes(value))return {state,changed:false};
 if(state.id!=='count'&&value!==state.target)return {state,changed:false,feedback:state.id==='colors'?'이 색도 예쁘네! 말한 색을 다시 찾아보자.':'다른 선물이네! 위에 있는 그림이랑 같은 걸 찾아보자.'};
 const selected=[...state.selected,value],done=state.id==='count'?selected.length===state.target:true;
 const next={...state,selected,done,assisted:state.assisted||assisted};
 return {state:next,changed:true,feedback:state.id==='count'?`${['하나','둘','셋'][selected.length-1]}!${done?' 친구들이 모두 탔어! 빵빵, 출발!':''}`:state.id==='colors'?'슈우우! 같은 색 표적이 빙글빙글!':'같은 선물이네! 친구에게 전해 줄게!'};
}
export const demoChoice=state=>isExtra(state.id)?extraDemo(state):state.id==='count'?state.options.find(v=>!state.selected.includes(v)):state.target;
const gift=(id)=>id==='bear'?'<g fill="#c99060" stroke="#896346" stroke-width="3"><circle cx="-29" cy="-32" r="16"/><circle cx="29" cy="-32" r="16"/><ellipse cy="31" rx="32" ry="37"/><circle r="39"/><ellipse cx="-32" cy="58" rx="17" ry="12"/><ellipse cx="32" cy="58" rx="17" ry="12"/><ellipse cy="13" rx="19" ry="14" fill="#f3d8af"/><g fill="#44382e" stroke="none"><circle cx="-13" cy="-6" r="4"/><circle cx="13" cy="-6" r="4"/><ellipse cy="8" rx="6" ry="4"/></g></g>':id==='ball'?'<circle r="48" fill="#79bfe5" stroke="#447da3" stroke-width="4"/><path d="M0-48Q-33 0 0 48M-47-4Q0 24 47-4" fill="none" stroke="#fff1a8" stroke-width="11"/>':'<path d="M0 15V65M0 44Q-40 10-34 42Q-14 64 0 48" stroke="#4f9b70" fill="#87c17b" stroke-width="8"/><g fill="#f6a1b5" stroke="#cf7d99" stroke-width="2">'+Array.from({length:6},(_,i)=>`<ellipse transform="rotate(${i*60})" cy="-24" rx="15" ry="23"/>`).join('')+'</g><circle r="17" fill="#ffe398"/>';
const person=(i)=>`<g><ellipse cy="62" rx="30" ry="6" fill="#385d6a20"/><path d="M-17 10L-25 43M17 10L25 43" stroke="${['#f2b963','#9e9cd4','#86be9c'][i]}" stroke-width="14" stroke-linecap="round"/><path d="M-13 32L-15 59M13 32L15 59" stroke="#4b7191" stroke-width="12" stroke-linecap="round"/><rect x="-19" y="7" width="38" height="33" rx="12" fill="${['#f2b963','#9e9cd4','#86be9c'][i]}"/><circle cy="-16" r="26" fill="#ffdbb6"/><path d="M-26-19Q-24-53 2-43Q25-47 27-19L13-28Q-10-22-21-27" fill="#755549"/><circle cx="-9" cy="-15" r="3" fill="#304955"/><circle cx="9" cy="-15" r="3" fill="#304955"/><path d="M-7-3Q0 5 8-3" fill="none" stroke="#bd7868" stroke-width="3" stroke-linecap="round"/></g>`;
const picture=(content,label)=>`<svg viewBox="0 0 180 160" role="img" aria-label="${label}"><g transform="translate(90 72)">${content}</g></svg>`;
export function gameArt(state){
 if(isExtra(state.id))return extraArt(state);
 const actor=GAMES[state.id].actor;
 const seats=state.id==='count'?'<rect x="300" y="183" width="350" height="135" rx="23" fill="#319dd4" stroke="#247fae" stroke-width="4"/>'+[400,475,550].map(x=>`<rect x="${x-28}" y="202" width="57" height="70" rx="9" fill="#ddf4f0"/>`).join('')+'<circle cx="575" cy="322" r="25" fill="#36516a"/><circle cx="575" cy="322" r="12" fill="#bfdae1"/>'+state.selected.map((v,i)=>`<g transform="translate(${400+i*75} 238) scale(.5)">${person(v)}</g>`).join(''):'';
 const trail=state.id==='colors'&&state.done?'<g class="mini-water"><path d="M120 105Q360 25 605 216" stroke="#d8f9ff" stroke-width="27" fill="none"/><path d="M120 105Q360 25 605 216" stroke="#61cdeb" stroke-width="15" stroke-dasharray="20 12" fill="none"/></g>':'';
 const target=state.id==='colors'?`<g class="${state.done?'mini-hit':''}" transform="translate(600 220)"><path d="M0 40V130M-40 130H40" stroke="#a98761" stroke-width="13"/><circle r="66" fill="${colors.find(c=>c.id===state.target).fill}" stroke="#fff7de" stroke-width="9"/><circle r="37" fill="#fff6db"/><circle r="18" fill="${colors.find(c=>c.id===state.target).fill}"/></g>`:'';
 const parcel=state.id==='gifts'?'<g transform="translate(665 255) scale(1.1)">'+person(2)+'</g>'+(state.done?`<g class="mini-parcel" transform="translate(590 270) scale(.7)">${gift(state.target)}</g>`:''):'';
 return `<svg viewBox="0 0 800 390" aria-label="${GAMES[state.id].title}" role="img"><defs><linearGradient id="mini-sky" x2="0" y2="1"><stop stop-color="#a1dcf3"/><stop offset="1" stop-color="#edf9f2"/></linearGradient></defs><rect width="800" height="390" fill="url(#mini-sky)"/><circle cx="710" cy="55" r="30" fill="#fff2b2"/><path d="M0 245Q150 170 320 236T800 220V390H0" fill="#aed49a"/><path d="M0 330H800V390H0" fill="#8aa7b1"/><path d="M0 370H800" stroke="#fff0ba" stroke-dasharray="40 30" stroke-width="6"/><g class="${state.done?'mini-drive':''}"><image href="assets/characters/${actor}.png" x="55" y="75" width="290" height="290"/>${seats}</g>${target}${trail}${parcel}${state.id==='count'?`<text x="550" y="140" text-anchor="middle" fill="#355d6b" font-size="48" font-weight="bold">${state.selected.length} / ${state.target}</text><path d="M390 320H690" stroke="#fff9e5" stroke-width="6" stroke-linecap="round"/>`:''}</svg>`;
}

export class MiniGames{
 constructor({document:doc=globalThis.document,onEnter=()=>{},onLeave=()=>{},onSpeak=()=>{}}={}){
  this.doc=doc;this.panel=doc.getElementById('mini-game-panel');this.content=doc.getElementById('mini-game-content');this.onEnter=onEnter;this.onLeave=onLeave;this.onSpeak=onSpeak;this.opened=false;this.seed=0;this.keys=new PressGate();
  this.panel.onclick=e=>{const button=e.target.closest('button[data-game-action]');if(!button||button.disabled)return;const {gameAction:action,value}=button.dataset;if(action==='select')this.start(value);else if(action==='pick')this.pick(this.state.id==='count'?Number(value):value);else if(action==='next')this.start(this.state.id,this.state.round+1);else if(action==='again')this.start(this.state.id);else if(action==='menu')this.menu();else if(action==='filter')this.menu(value);else if(action==='close')this.close();else if(action==='hint')this.hint();else if(action==='demo')this.demonstrate();else if(action==='repeat')this.speak(instruction(this.state));};
  this.keyDown=e=>{
   const code=e.code||(e.key===' '?'Space':e.key==='Enter'?'Enter':'');
   if(!['Space','Enter'].includes(code)||!this.opened||this.panel.hidden||this.doc.hidden||!this.state||!isRepeat(this.state.id))return;
   if(e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
   const button=e.target?.closest?.('button');
   if(button&&button.dataset.gameAction!=='pick')return;
   e.preventDefault();e.stopPropagation?.();
   if(this.keys.press(code,e.repeat)&&!this.state.done)this.pick('press');
  };
  this.keyUp=e=>{const code=e.code||(e.key===' '?'Space':e.key==='Enter'?'Enter':'');if(this.keys.release(code)){e.preventDefault();e.stopPropagation?.();}};
  doc.addEventListener?.('keydown',this.keyDown,true);doc.addEventListener?.('keyup',this.keyUp,true);
  doc.defaultView?.addEventListener('blur',()=>this.keys.reset());
  doc.addEventListener?.('visibilitychange',()=>{if(doc.hidden)this.keys.reset();});
 }
 clear(){clearTimeout(this.hintTimer);}
 speak(text){this.onSpeak(text,this.state?GAMES[this.state.id].actor:'tayo');}
 open(id){if(!this.opened){this.opened=true;this.onEnter();}this.panel.hidden=false;if(GAMES[id])this.start(id);else this.menu();}
 menu(filter='all'){
  this.clear();this.state=null;this.filter=filter;
  const entries=Object.entries(GAMES).filter(([id])=>filter==='all'||(filter==='easy'?isRepeat(id):!isRepeat(id)));
  this.content.innerHTML=`<div class="mini-heading"><div><p class="mini-eyebrow">마이크 없이 그림을 눌러요 · 모두 ${Object.keys(GAMES).length}가지</p><h2>어떤 놀이 할까?</h2></div><button data-game-action="close">✕ 돌아가기</button></div><nav class="mini-filters" aria-label="놀이 종류">${[['all','전체 놀이'],['easy','한 버튼 놀이'],['find','그림 누르기·찾기']].map(([id,label])=>`<button data-game-action="filter" data-value="${id}" aria-pressed="${filter===id}">${label}</button>`).join('')}</nav><div class="mini-cards">${entries.map(([id,g])=>`<button class="mini-card" data-game-action="select" data-value="${id}"><div class="mini-card-art"><img src="assets/characters/${g.actor}.png" alt=""><span class="mini-game-icon">${g.icon||({count:'🚌',colors:'💦',gifts:'🎁'})[id]}</span></div><span class="mini-skill">${g.skill}</span><strong>${g.title}</strong><span>${g.description}</span><b>${isRepeat(id)?'스페이스바 · 화면 버튼':'그림 눌러 시작'} →</b></button>`).join('')}</div><p class="mini-footnote">한 판은 작은 미션 세 번이에요. 스페이스바는 누르고 떼어야 한 번씩 움직여요.</p>`;
  this.speak('어떤 놀이 할까? 친구 그림을 눌러 줘!');
 }

 start(id,round=0){if(!this.opened){this.open(id);return;}this.clear();this.hinted=false;this.state=newRound(id,round);this.state.options=rotate(this.state.options,this.seed++%3);this.feedback=instruction(this.state);this.render();this.speak(this.feedback);this.armHint();}
 armHint(){this.clear();if(this.opened&&!this.state.done)this.hintTimer=setTimeout(()=>this.hint(),12000);}
 hint(){if(!this.opened||!this.state||this.state.done)return;this.clear();this.hinted=true;const words=isExtra(this.state.id)?extraHint(this.state):this.state.id==='count'?'반짝이는 친구를 한 번 눌러 봐!':this.state.id==='colors'?'표적이랑 같은 색이 여기 반짝이네!':'위의 그림이랑 같은 선물이 반짝이네!';this.feedback=words;this.render();this.speak(words);}

 demonstrate(){if(!this.state||this.state.done)return;this.pick(demoChoice(this.state),true);}
 pick(value,demo=false){
  if(!this.opened||!this.state)return;
  const result=choose(this.state,value,demo);
  if(!result.changed){if(result.feedback){this.feedback=result.feedback;this.render();this.speak(result.feedback);}return;}
  this.clear();this.state=result.state;this.hinted=false;this.feedback=(demo?'내가 한번 보여 줄게! ':'')+result.feedback;this.render();
  // Repeated taps update the picture immediately without making an API voice
  // request for each tap. Instructions and completion still use the chosen voice.
  if(demo||this.state.done||!isExtra(this.state.id)||['fruit','shapes'].includes(this.state.id))this.speak(this.feedback);
  if(!this.state.done)this.armHint();
 }

 render(){
  const s=this.state,g=GAMES[s.id],done=s.done,goal=demoChoice(s),extra=isExtra(s.id)?extraControls(s,this.hinted):null;
  const wanted=s.id==='gifts'?`<div class="mini-wanted">친구가 기다리는 선물${picture(gift(s.target),presents.find(p=>p.id===s.target).name)}</div>`:'';
  const choices=extra?extra.choices:s.options.map(value=>{const boarded=s.selected.includes(value),hint=this.hinted&&value===goal;const label=s.id==='count'?`친구 ${value+1}${boarded?' 탔어요':' 태우기'}`:s.id==='colors'?`${colors.find(c=>c.id===value).name} 표적`:presents.find(p=>p.id===value).name;const art=s.id==='count'?person(value):s.id==='colors'?`<circle r="52" fill="${colors.find(c=>c.id===value).fill}" stroke="#fff" stroke-width="6"/><circle r="26" fill="#fff5d8"/><circle r="12" fill="${colors.find(c=>c.id===value).fill}"/>`:gift(value);return `<button class="mini-choice ${hint?'mini-hint':''} ${boarded?'mini-boarded':''}" data-game-action="pick" data-value="${value}" aria-label="${label}" ${done||boarded?'disabled':''}>${picture(art,label)}<span>${boarded?'탔어요!':label}</span></button>`;}).join('');
  const scroll=this.panel.scrollTop;
  this.content.innerHTML=`<div class="mini-heading"><div><p class="mini-eyebrow">${s.round+1} / 3번째 미션 · ${g.skill}</p><h2>${g.title}</h2></div><button data-game-action="close">✕ 돌아가기</button></div><p class="mini-instruction">${instruction(s)}</p><div class="mini-stage ${extra?'mini-extra-stage':''}">${gameArt(s)}${wanted}${extra?.overlay||''}</div>${extra?`<div class="mini-progress" aria-label="진행 ${s.progress} / ${s.goal}"><span style="width:${s.progress/s.goal*100}%"></span><b>${extra.progress}</b></div>`:''}<p class="mini-feedback" role="status" aria-live="polite">${this.feedback}</p><div class="mini-choices ${extra?'mini-extra-choices':''}">${choices}</div><div class="mini-actions">${done?`${s.round<2?'<button class="mini-primary" data-game-action="next">다음 놀이 →</button>':'<span class="mini-complete">세 가지 미션 끝! 🌟</span><button class="mini-primary" data-game-action="again">한 번 더</button>'}<button data-game-action="menu">다른 게임</button><button data-game-action="close">놀이 나가기</button>`:'<button data-game-action="repeat">🔊 다시 듣기</button><button data-game-action="hint">어떻게 할까?</button><button data-game-action="demo">친구가 보여주기</button><button data-game-action="menu">다른 게임</button>'}</div>`;
  this.panel.scrollTop=scroll;
  if(isRepeat(s.id)&&!done)this.content.querySelector?.('button[data-game-action="pick"]')?.focus?.({preventScroll:true});
 }

 close(notify=true){this.clear();this.keys.reset();this.opened=false;this.state=null;this.panel.hidden=true;this.content.innerHTML='';if(notify)this.onLeave();}
}
if(typeof window!=='undefined')window.MiniGames=MiniGames;
