// Ten small games. State changes only in response to discrete user actions.
export const EXTRA_GAMES={
 balloon:{title:'라니의 풍선 팡팡',actor:'lani',skill:'한 번씩 연타',description:'누를 때마다 풍선이 커져요',scene:'balloon',mode:'repeat',icon:'🎈'},
 bubbles:{title:'로기의 비눗방울 톡톡',actor:'rogi',skill:'눈과 손 맞추기',description:'방울을 하나씩 눌러 터뜨려요',scene:'wash',mode:'collect',icon:'🫧'},
 wash:{title:'가니의 반짝 세차',actor:'gani',skill:'관찰 · 깨끗이 닦기',description:'먼지를 눌러 버스를 닦아요',scene:'wash',mode:'collect',icon:'🧽'},
 tire:{title:'로기의 타이어 펌프',actor:'rogi',skill:'한 번씩 연타',description:'펌프로 납작한 타이어를 채워요',scene:'repair',mode:'repeat',icon:'🛞'},
 flower:{title:'라니의 꽃 키우기',actor:'lani',skill:'변화 관찰',description:'물을 줄 때마다 꽃이 자라요',scene:'picnic',mode:'repeat',icon:'🌻'},
 bridge:{title:'타요의 다리 만들기',actor:'tayo',skill:'부분과 전체',description:'판자를 하나씩 놓아 길을 이어요',scene:'detour',mode:'repeat',icon:'🌉'},
 stars:{title:'가니의 별 모으기',actor:'gani',skill:'하나씩 모으기',description:'반짝이는 별을 바구니에 담아요',scene:'night',mode:'collect',icon:'⭐'},
 fruit:{title:'가니의 과일 바구니',actor:'gani',skill:'같은 것끼리 분류',description:'사과와 바나나를 나눠 담아요',scene:'delivery',mode:'sort',icon:'🍎'},
 shapes:{title:'패트의 모양 차고지',actor:'pat',skill:'동그라미 · 세모 · 네모',description:'그림자와 같은 모양을 찾아요',scene:'equipment',mode:'match',icon:'🔵'},
 train:{title:'타요의 칙칙 기차',actor:'tayo',skill:'한 번씩 움직이기',description:'누를 때마다 기차가 역으로 가요',scene:'passengers',mode:'repeat',icon:'🚂'}
};
const repeatLabels={balloon:'바람 넣기',tire:'펌프 누르기',flower:'물 주기',bridge:'판자 놓기',train:'칙칙! 출발'};
const shapeNames={circle:'동그라미',triangle:'세모',square:'네모'};
const fruitNames={apple:'사과',banana:'바나나'};
export const isExtra=id=>Object.hasOwn(EXTRA_GAMES,id);
export const isRepeat=id=>EXTRA_GAMES[id]?.mode==='repeat';
export function extraRound(id,round){
 const kind=EXTRA_GAMES[id].mode,goal=id==='balloon'?6+round*2:id==='tire'?5+round:id==='fruit'?3+round:kind==='collect'?4+round:kind==='match'?1:4+round;
 const target=kind==='match'?['circle','triangle','square'][round]:kind==='sort'?['apple','banana'][round%2]:kind==='repeat'?'press':null;
 const options=kind==='repeat'?['press']:kind==='sort'?['apple','banana']:kind==='match'?['circle','triangle','square']:Array.from({length:goal},(_,i)=>'spot-'+i);
 return {id,round,target,goal,progress:0,options,selected:[],done:false,assisted:false};
}
export function extraInstruction(s){
 const text={balloon:'스페이스바를 톡톡 눌러 풍선을 크게 만들어 보자!',bubbles:'반짝이는 비눗방울을 하나씩 톡 눌러 줘!',wash:'먼지가 묻었네! 얼룩을 하나씩 눌러 닦아 줘.',tire:'타이어가 납작하네! 스페이스바를 톡톡 눌러 바람을 넣자!',flower:'스페이스바를 톡톡 눌러 꽃에 물을 줘!',bridge:'판자를 하나씩 놓아 다리를 만들자! 스페이스바를 톡톡!',stars:'반짝이는 별을 하나씩 눌러 바구니에 담자!',fruit:`${fruitNames[s.target]}가 왔네! 같은 과일 바구니를 눌러 줘.`,shapes:`${shapeNames[s.target]} 그림자네! 같은 모양을 찾아 줘.`,train:'칙칙! 스페이스바를 톡톡 누르면 기차가 앞으로 간다!'};
 return text[s.id];
}
export function extraChoose(s,value,assisted=false){
 if(s.done||!s.options.includes(value))return {state:s,changed:false};
 const mode=EXTRA_GAMES[s.id].mode;
 if(mode==='collect'&&s.selected.includes(value))return {state:s,changed:false};
 if(['sort','match'].includes(mode)&&value!==s.target)return {state:s,changed:false,feedback:mode==='sort'?'이 과일은 다른 바구니네. 같은 그림을 찾아보자!':'그림자랑 조금 다르네. 같은 모양을 찾아보자!'};
 const progress=s.progress+1,done=progress===s.goal;
 const next={...s,progress,done,assisted:s.assisted||assisted,selected:mode==='collect'?[...s.selected,value]:s.selected};
 if(mode==='sort'&&!done)next.target=['apple','banana'][(s.round+progress)%2];
 const endings={balloon:'팡! 풍선이 꽃가루처럼 흩어졌어!',bubbles:'톡톡! 비눗방울을 모두 찾았네!',wash:'반짝반짝! 가니가 깨끗해졌어!',tire:'빵빵해졌어! 이제 바퀴가 잘 굴러간다!',flower:'꽃이 활짝 피었어! 나비도 놀러 왔네!',bridge:'다리가 이어졌어! 타요가 건너간다!',stars:'별이 바구니에 가득! 밤하늘도 반짝반짝!',fruit:'과일을 같은 것끼리 모두 담았어!',shapes:'쏙! 그림자랑 같은 모양이네!',train:'칙칙폭폭! 기차가 역에 도착했어!'};
 return {state:next,changed:true,feedback:done?endings[s.id]:mode==='sort'?`쏙! 이번에는 ${fruitNames[next.target]}를 담아보자!`:s.id==='balloon'?'풍선이 조금 더 커졌네!':s.id==='flower'?'쑥쑥! 꽃이 자라고 있어!':s.id==='bridge'?'판자 하나 쏙! 길이 이어진다!':s.id==='train'?'칙칙! 기차가 앞으로 갔어!':s.id==='tire'?'슉! 타이어가 빵빵해지고 있어!':s.id==='wash'?'쓱싹! 먼지가 사라졌네!':'하나씩 쏙!'};
}
export const extraDemo=s=>EXTRA_GAMES[s.id].mode==='collect'?s.options.find(v=>!s.selected.includes(v)):s.target;
export function extraHint(s){return isRepeat(s.id)?'스페이스바를 한번 누르고 떼어 봐! 아래 큰 버튼을 눌러도 돼.':s.id==='fruit'?'지금 나온 과일이랑 같은 바구니가 반짝이네!':s.id==='shapes'?'그림자랑 같은 모양이 반짝이네!':s.id==='wash'?'먼지 묻은 곳이 반짝이네! 한번 눌러 닦아 줘.':'반짝이는 그림을 한번 톡 눌러 줘!';}
// SVG shapes are shared by the stage and touch targets, so the hint and answer match.
const star='<path d="M0-45L13-16 45-14 22 8 28 39 0 24-28 39-22 8-45-14-13-16Z" fill="#ffe083" stroke="#dcac49" stroke-width="3"/><path d="M-9-18L0-37 6-20" fill="#fff5c6"/>';
const bubble='<defs><radialGradient id="bubble-glass" cx=".35" cy=".25" r=".8"><stop stop-color="#fff" stop-opacity=".85"/><stop offset=".45" stop-color="#bfeef5" stop-opacity=".2"/><stop offset="1" stop-color="#d1b5ef" stop-opacity=".8"/></radialGradient></defs><circle r="43" fill="url(#bubble-glass)" stroke="#f6ffff" stroke-width="3"/><path d="M-30-12Q-22-34-5-32" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M24 22L30 11" stroke="#a1e6ef" stroke-width="4" stroke-linecap="round"/>';
const dirt='<path d="M-37-9Q-53-28-23-32Q-10-54 8-34Q40-46 39-16Q62 0 36 22Q26 48 3 32Q-28 48-34 23Q-60 9-37-9Z" fill="#a88c72"/><circle cx="-16" cy="-13" r="6" fill="#ceb196"/><circle cx="22" cy="9" r="8" fill="#806f5d"/><circle cx="-8" cy="22" r="4" fill="#d1b59b"/>';
export function extraIcon(id){
 if(id==='star')return star;if(id==='bubble')return bubble;if(id==='dirt')return dirt;
 if(id==='apple')return '<path d="M-3-25Q-40-47-42-8Q-44 23-20 39Q-6 47 0 37Q14 48 29 33Q54 9 39-23Q22-40 4-25Z" fill="#ed7771" stroke="#bf5756" stroke-width="3"/><path d="M0-25Q-3-44 7-51" stroke="#8e7152" stroke-width="6" fill="none"/><path d="M3-38Q11-62 35-48Q33-30 3-38" fill="#85b67f"/><path d="M-27-17Q-34-6-27 4" stroke="#ffc3ad" stroke-width="7" fill="none" stroke-linecap="round"/>';
 if(id==='banana')return '<path d="M-38-26Q-8 19 42-27Q43 11 9 36Q-26 53-47 14Q-52-5-38-26Z" fill="#f8d46b" stroke="#c7a24d" stroke-width="3"/><path d="M-34-17Q-6 34 34-11" stroke="#fff2ab" stroke-width="5" fill="none"/><path d="M39-32L46-26M-42-29L-36-25" stroke="#876e48" stroke-width="8"/>';
 if(id==='circle')return '<circle r="43" fill="#86bedc" stroke="#528eae" stroke-width="4"/>';
 if(id==='triangle')return '<path d="M0-48L49 38H-49Z" fill="#f0be75" stroke="#c39450" stroke-width="4" stroke-linejoin="round"/>';
 if(id==='square')return '<rect x="-40" y="-40" width="80" height="80" rx="10" fill="#b7a3db" stroke="#8a73b5" stroke-width="4"/>';
 return '';
}
const badge=(art,label)=>`<svg viewBox="0 0 140 130" role="img" aria-label="${label}"><g transform="translate(70 63)">${art}</g></svg>`;
export function extraControls(s,hinted=false){
 const mode=EXTRA_GAMES[s.id].mode,goal=extraDemo(s);
 const button=(value,label,art,cls='',style='',disabled=false)=>`<button class="mini-extra-choice ${cls} ${hinted&&value===goal?'mini-hint':''}" data-game-action="pick" data-value="${value}" aria-label="${label}" style="${style}" ${s.done||disabled?'disabled':''}>${art?badge(art,label):''}<span>${label}</span></button>`;
 if(mode==='repeat')return {overlay:'',choices:button('press',repeatLabels[s.id],'','mini-pump')+(!s.done?'<p class="mini-key-hint">스페이스바도 돼요 · 누르고 떼기를 반복해요</p>':''),progress:`${s.progress} / ${s.goal}`};
 if(mode==='collect'){
  const overlay=s.options.map((value,i)=>{if(s.selected.includes(value))return '';let x,y;
   if(s.id==='wash'){x=42+i%3*7;y=44+Math.floor(i/3)*19;}else{x=44+i%3*19;y=26+Math.floor(i/3)*27;}
   return button(value,s.id==='wash'?`먼지 ${i+1} 닦기`:s.id==='stars'?`별 ${i+1} 담기`:`비눗방울 ${i+1} 터뜨리기`,extraIcon(s.id==='wash'?'dirt':s.id==='stars'?'star':'bubble'),'mini-object',`left:${x}%;top:${y}%`);
  }).join('');
  return {overlay:`<div class="mini-object-layer">${overlay}</div>`,choices:'',progress:`${s.progress} / ${s.goal}`};
 }
 return {overlay:'',choices:s.options.map(id=>button(id,mode==='sort'?fruitNames[id]+' 바구니':shapeNames[id],extraIcon(id),mode==='sort'?'mini-fruit-basket':'')).join(''),progress:`${s.progress} / ${s.goal}`};
}
const truck=id=>`<image href="assets/characters/${id}.png" x="25" y="170" width="170" height="170"/>`;
const plants='<path d="M30 327Q23 294 13 299L25 329Q44 290 49 304L38 331M733 326Q719 296 712 306L727 330Q752 296 754 314L742 331" fill="#699f7a"/>';
export function extraArt(s){
 const ratio=s.progress/s.goal,actor=EXTRA_GAMES[s.id].actor;
 let art='';
 if(s.id==='balloon'){
  const r=30+ratio*87;
  art=s.done?`<g class="mini-confetti">${Array.from({length:16},(_,i)=>`<path transform="translate(${355+i%6*50} ${85+Math.floor(i/6)*60}) rotate(${i*37})" d="M-7-7H7V7H-7Z" fill="${['#eaa2b8','#f3d27b','#88c8d0'][i%3]}"/>`).join('')}</g><text x="500" y="230" text-anchor="middle" font-size="52" fill="#c27896">팡!</text>`:`<g><path d="M500 ${178+r}Q470 310 515 335" stroke="#b5a3a7" stroke-width="3" fill="none"/><ellipse class="mini-inflate" cx="500" cy="180" rx="${r*.8}" ry="${r}" fill="url(#extra-balloon)" stroke="#c47f9e" stroke-width="3"/><path d="M500 ${180+r-2}L490 ${190+r}H510Z" fill="#d592af"/><ellipse cx="${500-r*.32}" cy="${180-r*.35}" rx="${r*.12}" ry="${r*.2}" fill="#fff" opacity=".65"/></g>`;
  art+='<rect x="255" y="282" width="43" height="56" rx="9" fill="#efc66c"/><path d="M277 281V250M257 250H298" stroke="#557f8b" stroke-width="8" stroke-linecap="round"/><path d="M299 315Q410 345 491 282" fill="none" stroke="#8e9ca0" stroke-width="5"/>';
 }else if(s.id==='wash'){
  art=`<image href="assets/characters/gani.png" x="185" y="35" width="440" height="340"/>${s.done?'<g class="mini-sparkles" fill="#fff5ab"><path d="M240 80L249 101 270 110 249 119 240 140 231 119 210 110 231 101Z"/><path d="M620 180L626 196 642 202 626 208 620 224 614 208 598 202 614 196Z"/></g>':''}`;
 }else if(s.id==='bubbles')art='<path d="M250 250Q220 190 263 175Q300 163 309 200Q314 233 280 250Z" fill="none" stroke="#e9ba7a" stroke-width="12"/><path d="M255 244L233 319" stroke="#d5a86a" stroke-width="13" stroke-linecap="round"/>'+(s.done?'<text x="510" y="200" text-anchor="middle" font-size="34" fill="#427c8c">방울이 모두 톡톡!</text>':'');
 else if(s.id==='tire'){
  const ry=30+ratio*55;
  art=`<ellipse cx="515" cy="322" rx="95" ry="13" fill="#33525c22"/><ellipse class="mini-inflate" cx="515" cy="${325-ry}" rx="85" ry="${ry}" fill="#354e60" stroke="#233847" stroke-width="10"/><ellipse cx="515" cy="${325-ry}" rx="48" ry="${ry*.55}" fill="#b8d3da"/><ellipse cx="515" cy="${325-ry}" rx="17" ry="${ry*.2}" fill="#698b9a"/><path d="M319 314Q379 350 430 ${325-ry}" stroke="#b3a48d" stroke-width="6" fill="none"/><rect x="285" y="258" width="40" height="70" rx="8" fill="#e8b66d"/><path d="M305 258V225M278 225H332M270 330H340" stroke="#587f8c" stroke-width="9" stroke-linecap="round"/>${s.done?'<path class="mini-sparkles" d="M650 135L658 157 680 165 658 173 650 195 642 173 620 165 642 157Z" fill="#ffe8a0"/>':''}`;
 }else if(s.id==='flower'){
  const h=20+ratio*135;
  art=`<path d="M420 290H590L570 365H440Z" fill="#d89a76" stroke="#ae795d" stroke-width="4"/><path d="M505 295V${285-h}" stroke="#70a076" stroke-width="11"/><path d="M505 ${285-h*.4}Q438 ${250-h*.4} 454 ${285-h*.4}Q478 ${310-h*.4} 505 ${285-h*.4}M507 ${280-h*.7}Q568 ${245-h*.7} 554 ${280-h*.7}Q532 ${308-h*.7} 507 ${280-h*.7}" fill="#8fbd7e"/><g transform="translate(505 ${280-h}) scale(${s.done?1:.35+ratio*.55})">${Array.from({length:8},(_,i)=>`<ellipse transform="rotate(${i*45})" cy="-37" rx="22" ry="36" fill="#f2c870" stroke="#d8ad56" stroke-width="2"/>`).join('')}<circle r="27" fill="#997952"/><circle cx="-8" cy="-5" r="3" fill="#fff1cb"/><circle cx="8" cy="-5" r="3" fill="#fff1cb"/><path d="M-8 8Q0 17 9 8" stroke="#fff1cb" stroke-width="3" fill="none"/></g>${s.progress&&!s.done?'<g class="mini-water" stroke="#7cc9e2" stroke-width="6"><path d="M365 120L375 142M385 140L395 162M405 160L415 182"/></g>':''}${s.done?'<g class="mini-flutter" transform="translate(650 110)"><ellipse cx="-14" rx="19" ry="24" fill="#d4b3e5"/><ellipse cx="14" rx="19" ry="24" fill="#f3d087"/><path d="M0-20V20" stroke="#7e6d87" stroke-width="5"/></g>':''}`;
 }else if(s.id==='bridge'){
  art='<path d="M235 280Q450 190 740 290V390H235Z" fill="#a4d9e3"/><path d="M240 318Q480 265 760 328M240 350Q480 300 760 360" fill="none" stroke="#ddf4ed" stroke-width="5"/><path d="M265 240V315M715 240V315" stroke="#a88c68" stroke-width="14"/>';
  art+=Array.from({length:s.progress},(_,i)=>`<g transform="translate(${280+i*430/s.goal} 265)"><path d="M0 0H${430/s.goal-3}V40H0Z" fill="#dab786" stroke="#b3946e" stroke-width="3"/><path d="M8 13H${430/s.goal-12}" stroke="#efcfa4" stroke-width="4"/></g>`).join('');
  if(s.done)art+='<g class="mini-cross-bridge"><image href="assets/characters/tayo.png" x="270" y="130" width="180" height="180"/></g>';
 }else if(s.id==='stars'){
  art='<path d="M630 45A62 62 0 1 0 708 115A57 57 0 0 1 630 45" fill="#fff0b0"/><path d="M220 269H370L350 350H240Z" fill="#c9a17d" stroke="#957d68" stroke-width="4"/><path d="M229 290H361M235 316H356M263 270V345M293 270V347M323 270V346" stroke="#e9cba0" stroke-width="5"/>';
  art+=Array.from({length:s.progress},(_,i)=>`<g transform="translate(${252+i%3*39} ${282+Math.floor(i/3)*35}) scale(.35)">${star}</g>`).join('');
 }else if(s.id==='fruit'){
  const sorted=['apple','banana'].map((id,i)=>`<g transform="translate(${425+i*180} 220)"><path d="M-68 0H68L53 63H-53Z" fill="#d9b68b" stroke="#a58a65" stroke-width="4"/><g transform="translate(0 -20) scale(.8)">${extraIcon(id)}</g></g>`).join('');
  art=`<path d="M360 285H685L710 313H340Z" fill="#dab68d"/><path d="M377 314V365M669 314V365" stroke="#a78d71" stroke-width="13"/>${s.done?sorted+'<text x="520" y="95" text-anchor="middle" fill="#438578" font-size="29">같은 과일끼리 쏙쏙!</text>':`<g class="mini-new-fruit" transform="translate(520 195) scale(1.6)">${extraIcon(s.target)}</g>`}`;
 }else if(s.id==='shapes'){
  const shape=s.done?extraIcon(s.target):extraIcon(s.target).replace(/fill="[^"]+"/g,'fill="#7a8a8b"').replace(/stroke="[^"]+"/g,'stroke="#647778"');
  art=`<rect x="350" y="100" width="330" height="225" rx="28" fill="#e9d7b4" stroke="#c8af8b" stroke-width="7"/><path d="M355 300H675" stroke="#c8af8b" stroke-width="7"/><g class="${s.done?'mini-shape-fit':'mini-shape-shadow'}" transform="translate(515 207) scale(1.6)">${shape}</g>`;
 }else if(s.id==='train'){
  const x=210+ratio*380;
  art=`<path d="M205 321H735M205 341H735" stroke="#74818a" stroke-width="6"/>${Array.from({length:14},(_,i)=>`<path d="M${217+i*38} 315V348" stroke="#a68f75" stroke-width="8"/>`).join('')}<g transform="translate(635 105)"><rect width="125" height="180" rx="8" fill="#e8c995"/><path d="M-12 0L62-40 137 0Z" fill="#c48c7c"/><rect x="30" y="105" width="65" height="75" rx="26" fill="#7999a3"/><rect x="37" y="25" width="55" height="48" rx="8" fill="#b8dce1"/></g><g class="mini-train" transform="translate(${x} 263)"><rect x="-65" y="-55" width="120" height="88" rx="13" fill="#5ca5c3"/><rect x="12" y="-91" width="57" height="90" rx="8" fill="#e9bb6c"/><rect x="25" y="-78" width="30" height="30" rx="5" fill="#e4f2ec"/><path d="M-58-55V-88H-34V-55" fill="#6d8993"/><path d="M4-94H80" stroke="#a87958" stroke-width="9" stroke-linecap="round"/><circle cx="-35" cy="32" r="24" fill="#435c70"/><circle cx="35" cy="32" r="24" fill="#435c70"/><circle cx="-35" cy="32" r="11" fill="#dce5dd"/><circle cx="35" cy="32" r="11" fill="#dce5dd"/><path d="M-35 32H35" stroke="#c4b28b" stroke-width="6"/><circle cx="-45" cy="-110" r="14" fill="#ffffffa6"/><circle cx="-68" cy="-140" r="21" fill="#ffffff8a"/></g>`;
 }
 const night=s.id==='stars';
 return `<svg viewBox="0 0 800 390" role="img" aria-label="${EXTRA_GAMES[s.id].title}"><defs><linearGradient id="extra-sky" x2="0" y2="1"><stop stop-color="${night?'#324975':'#a3d9ed'}"/><stop offset="1" stop-color="${night?'#6889a6':'#eff7e6'}"/></linearGradient><radialGradient id="extra-balloon" cx=".3" cy=".2" r=".9"><stop stop-color="#f8cad6"/><stop offset=".6" stop-color="#eba5bd"/><stop offset="1" stop-color="#c985a6"/></radialGradient></defs><rect width="800" height="390" fill="url(#extra-sky)"/><path d="M0 230Q150 160 330 240T800 220V390H0" fill="${night?'#516f76':'#accd98'}"/><path d="M0 330H800V390H0" fill="${night?'#465f72':'#d6cfb6'}"/>${plants}${s.id!=='wash'?truck(actor):''}${art}</svg>`;
}
