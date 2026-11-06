import {sceneBackdrop,illustratedBuilding,dinosaurArt} from './scene-backdrops.mjs';
import {actionProps} from './action-scenes.mjs';
import {eventById} from './play-events.mjs';
export function sceneView(story={}) {
 const event=eventById(story.event);
 if(story.mode==='chat'||story.scene==='daily')return {scene:'daily',step:0,title:'친구와 도란도란 이야기',choices:[],complete:false};
 if(event){const step=Number.isInteger(story.step)?Math.max(0,Math.min(3,story.step)):0;const actor=event.id.split('-')[0];const cues=event.visual==='rescue'?['슈우우!','프랭크 힘내!']:event.visual==='accident'||event.visual==='mud'||event.visual==='branches'?['영차!','힘내!']:event.visual==='wash'?['보글보글!','반짝반짝!']:['빵빵!','힘내!'];return {scene:event.visual,step,title:(story.playTitle||event.title)+' · '+event.captions[step],event:event.id,actor,variant:event.variant,mission:true,autoplay:step<3,complete:step===3,flames:event.visual==='rescue'&&(step===1||step===2),water:['rescue','wash','training'].includes(event.visual)&&step===2,choices:cues.map(x=>[x,x])};}

 const scene=['rescue','repair','delivery','outing','wash','traffic','passengers','accident','cat'].includes(story.scene)?story.scene:'repair';
 const step=Number.isInteger(story.step)?Math.max(0,Math.min(3,story.step)):0;
 const names={accident:['패트 출동!','고깔을 세워요','견인차가 옮겨요','도로 수습 완료'],cat:['프랭크 구조 출동','사다리를 펼쳐요','고양이를 내려줘요','구조 완료'],passengers:['타요의 정류장','승객을 태워요','공원으로 달려요','공원에 도착했어요'],rescue:['삐뽀! 프랭크 출동','현장 도착 · 호스를 펼쳐요','슈우! 불을 끄고 있어요','불끄기와 현장 정리 완료'],repair:['차고지에서 로기를 만나요','어떤 소리가 날까요?','정비사를 응원해요','로기가 다시 움직여요'],delivery:['선물 배달 출발','선물을 골라요','신호를 기다려요','선물이 도착했어요'],outing:['공룡 공원으로 출발','어떤 공룡을 볼까요?','공룡 발자국 찾기','즐거운 나들이'],wash:['세차장 도착','보글보글 거품','물로 씻어요','반짝반짝 깨끗해요'],traffic:['패트와 순찰 출발','빨간 신호에서 멈춰요','초록 신호에 출발','안전하게 도착했어요']};
 return {scene,step,title:names[scene][step],flames:scene==='rescue'&&(step===1||step===2),water:(scene==='rescue'||scene==='wash')&&step===2,complete:step===3,choices:({rescue:step<2?[['삐뽀삐뽀!','삐뽀삐뽀!'],['출동!','프랭크 출동!']]:[['슈우우!','슈우우!'],['힘내!','프랭크 힘내!']],accident:[['영차!','영차!'],['패트 힘내!','패트 힘내!']],repair:[['힘내!','로기야 힘내!'],['놀이터','놀이터로 가자.']],delivery:[['꽃','꽃을 선물하자.'],['그림','그림을 선물하자.']],wash:[['보글보글','보글보글 거품!'],['반짝반짝','반짝반짝 씻자.']],traffic:step===1?[['멈춰요','빨간불이니까 멈춰요.'],['기다려요','친구가 건널 때까지 기다려요.']]:[['같이 순찰','같이 순찰하자.'],['초록불','초록불을 찾아보자.']],passengers:step===0?[['안녕!','승객에게 인사하자.'],['같이 타요','같이 타요!']]:[['공원','공원으로 가자.'],['놀이터','놀이터로 가자.']]}[scene]||[['같이 해요','응! 같이 하자.']])};
}
const building=(label,color='#eaa49b')=>illustratedBuilding(label,color);
export function sceneSvg(view) {
 const {scene,step}=view;
 let props='';const action=actionProps(view);
 if(action!==null){props=action;}else if(['daily','ball','rain','hide','picnic','lost','night','cat','equipment','training','parade'].includes(scene)){
 const labels={daily:'차고지 쉼터',ball:'친구의 공',rain:'비 오는 정류장',hide:'숨바꼭질',picnic:'공원 소풍',lost:'친구를 도와요',night:'별빛 차고지',cat:'고양이 인형 훈련',equipment:'소방서 장비',training:'물 표적 훈련',parade:'친구들의 행렬'};
 props=building(labels[scene],'#8fb7ce');
 if(scene==='ball')props+='<circle cx="785" cy="435" r="38" fill="#ffcd69" stroke="#e4876a" stroke-width="5"/>';
 if(scene==='rain')props+=step===3?'<path d="M680 190Q790 20 930 190" stroke="#ffb1a8" stroke-width="22" fill="none"/><path d="M690 200Q790 45 920 200" stroke="#f9df88" stroke-width="20" fill="none"/>':'<g class="scene-water" stroke="#61b7eb" stroke-width="7"><path d="M700 100L690 130M760 120L750 150M830 90L820 120M910 120L900 150"/></g>';
 if(scene==='night')props+='<g fill="#ffe79c"><path d="M765 100L777 126 805 130 784 150 790 180 765 165 740 180 746 150 725 130 753 126Z"/><circle cx="910" cy="110" r="35"/></g>';
 if(scene==='picnic')props+='<path d="M700 430H920L945 475H680Z" fill="#f2a2b4"/><g fill="#fce287"><circle cx="720" cy="390" r="18"/><circle cx="885" cy="400" r="18"/></g>';
 if(scene==='cat')props+='<path d="M735 420V240M775 420V240M735 270H775M735 310H775M735 350H775M735 390H775" stroke="#e4b571" stroke-width="9"/><path d="M820 270L810 235 837 250 862 235 872 270Z" fill="#ffcc9e"/><circle cx="832" cy="263" r="3"/><circle cx="857" cy="263" r="3"/>';
 if(scene==='training')props+='<circle cx="805" cy="320" r="55" fill="#ed7b75"/><circle cx="805" cy="320" r="30" fill="#fff0b1"/>';
 if(scene==='equipment')props+='<path d="M720 340Q750 270 790 340Z" fill="#ffd464"/><path d="M840 350Q910 290 880 410" stroke="#df6657" stroke-width="18" fill="none"/>';
 if(['hide','lost'].includes(scene))props+='<rect x="750" y="360" width="110" height="85" fill="#ddae7b"/><text x="790" y="335" font-size="55">'+(step===3?'✨':'?')+'</text>';
 if(scene==='parade')props+='<image href="assets/characters/rogi.png" x="690" y="340" width="115" height="115"/><image href="assets/characters/lani.png" x="815" y="340" width="115" height="115"/>';
 }else if(scene==='rescue'){
  props=building(step===0?'소방서':'상상 훈련장');
  if(view.flames)props+='<g class="scene-flame" transform="translate(750 277)"><path d="M0 95Q-40 55 10 0Q12 40 35 20Q80 72 40 95Z" fill="#ffae36"/><path d="M10 95Q-2 67 27 45Q25 72 40 83L35 95" fill="#ffe77b"/></g>';
  if(view.water)props+='<g class="scene-water"><path d="M430 388Q550 220 786 312" stroke="#e4faff" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M430 388Q550 220 786 312" stroke="#60cdfa" stroke-width="12" stroke-dasharray="20 13" fill="none" stroke-linecap="round"/><circle cx="792" cy="323" r="12" fill="#b4ecff"/><circle cx="820" cy="299" r="9" fill="#b4ecff"/></g>';
  if(view.complete)props+='<g transform="translate(745 255)"><circle r="45" fill="#d2f4db"/><path d="M-20 0L-5 17 25-22" fill="none" stroke="#3faa70" stroke-width="9" stroke-linecap="round"/></g>';
 }else if(scene==='repair'){
  props=building('차고지','#6da8d3')+'<image href="assets/characters/rogi.png" x="700" y="295" width="200" height="200"/>';
  if(step<3)props+='<text x="865" y="280" font-size="54" fill="#f9b640">🔧</text>';else props+='<text x="835" y="280" font-size="50">✨</text>';
 }else if(scene==='delivery'){props=building('가니의 차고지','#f3ac73')+'<g transform="translate(730 330)"><rect width="105" height="83" rx="8" fill="#b496e5"/><path d="M52 0V83M0 22H105" stroke="#ffe69c" stroke-width="12"/></g>';}
 else if(scene==='outing'){props=dinosaurArt(625,260,.9)+'<text x="800" y="470" text-anchor="middle" font-size="22" fill="#315d4a">공룡 모형 공원</text>';}
 else if(scene==='wash'){props=building('세차장','#75c6e7');if(step===1||step===2)props+='<g class="scene-bubbles" fill="#e2faffbb" stroke="#fff" stroke-width="3"><circle cx="470" cy="305" r="35"/><circle cx="540" cy="370" r="27"/><circle cx="415" cy="410" r="24"/><circle cx="525" cy="260" r="19"/></g>';if(step===3)props+='<text x="720" y="305" font-size="60">✨</text>';}
 else if(scene==='passengers'){props=step<2?building('버스 정류장','#6da8d3'):building('공원 놀이터','#91bf72');props+='<g transform="translate(755 380)"><circle cy="-35" r="18" fill="#ffcf9a"/><path d="M0-15V40M-20 5H20M0 40L-20 70M0 40L20 70" stroke="#bd77cf" stroke-width="12" stroke-linecap="round"/><circle cx="-6" cy="-38" r="2"/><circle cx="6" cy="-38" r="2"/></g>';if(step>=2)props+='<path d="M865 330L930 430H865V330" fill="#ffcd69" stroke="#d18f4d" stroke-width="8"/>'; }
 else props=`<g transform="translate(780 220)"><rect width="90" height="225" rx="25" fill="#44586b"/><circle cx="45" cy="46" r="26" fill="${step===1?'#ee5757':'#663b42'}"/><circle cx="45" cy="112" r="26" fill="#655f3f"/><circle cx="45" cy="180" r="26" fill="${step===2?'#66ca8b':'#365749'}"/><path d="M45 225V295" stroke="#44586b" stroke-width="20"/></g><g fill="#fff"><rect x="700" y="490" width="30" height="145"/><rect x="750" y="490" width="30" height="145"/><rect x="800" y="490" width="30" height="145"/></g>`;
 return `<svg viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid meet" aria-label="${view.title}" role="img">${sceneBackdrop(view)}${props}</svg>`;
}
if(typeof window!=='undefined')window.SceneVisuals={sceneView,sceneSvg};
