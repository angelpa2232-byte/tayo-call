import {PLAY_EVENTS,eventById,eventQuestionOptions} from './play-events.mjs';
import {getCharacter} from './characters.mjs';
// The question is chosen from this event and stage, never a global topic list.
export function interactionQuestion(state){
 if(state?.mode!=='event')return '';
 const options=eventQuestionOptions(state);
 const round=Math.max(0,Math.floor(Number(state.round)||0));
 return options.length?options[round%options.length]:'';
}
const scenes=[
 {id:'passengers',title:'타요의 승객 나들이',steps:['타요가 정류장에서 공원에 가는 장난감 승객을 기다린다. 같이 승객에게 인사할지 물어봐.','승객이 탔다. 공원 또는 놀이터 중 어디로 갈지 골라보게 해. 아이의 선택을 기억해서 이어가.','타요가 고른 목적지로 천천히 달린다. 창밖의 나무나 꽃 중 무엇을 찾을지 물어봐.','목적지에 도착해 승객이 내렸다. 함께 기뻐하고 새로운 승객을 태우러 갈지 물어봐.']},
 {id:'traffic',title:'패트의 교통 순찰',steps:['패트가 장난감 마을 순찰을 시작한다. 함께 신호등을 찾아볼지 물어봐.','빨간불이라 패트가 멈췄다. 장난감 보행자가 횡단보도를 건너는 것을 기다린다. 멈춤 소리나 손짓을 흉내 내볼지 물어봐.','보행자가 모두 건넜고 자동차 신호가 초록불이다. 패트가 천천히 출발한다. 초록색 물건을 찾아볼지 물어봐. 실제 길을 혼자 건너게 하지 마.','순찰을 마치고 안전하게 도착했다. 함께 기뻐하고 다음 순찰에서 신호등 또는 횡단보도 중 무엇을 살펴볼지 물어봐.']},
 {id:'rescue',title:'프랭크와 불끄기 상상 놀이',steps:['소방서에서 프랭크가 출동 준비를 한다. 장난감 훈련장에 작은 불 모형이 켜졌다는 상상 놀이를 소개하고 같이 출발할지 물어봐. 실제 위험이나 다친 사람은 없다.','프랭크가 훈련장에 도착했다. 작은 불 모형은 아직 켜져 있다. 물을 뿌릴 준비가 됐는지 물어봐. 아직 불을 껐다고 말하지 마.','프랭크가 물을 슈우 뿌리고 있다. 아이는 물 소리를 함께 내는 역할이다. 실제 불이나 호스에 손대게 하지 마.','작은 불 모형이 꺼졌다! 함께 기뻐하고 소방서에 돌아가거나 다른 친구를 만나러 갈지 물어봐.']},
 {id:'repair',title:'로기의 작은 고장',steps:['상상 놀이로 로기가 차고지에서 멈췄다고 소개하고 같이 도와줄지 물어봐. 무섭거나 급한 상황이 아니다.','아이의 답을 받아 로기를 안전한 차고지에 세웠다고 말해. 빵빵 소리와 덜덜 소리 중 어떤 소리를 낼지 하나 골라보게 해.','로기는 아직 고치는 중이라 움직이지 않는다. 다 고쳤다거나 달린다고 말하지 마. 정비는 어른 정비사가 한다고 말해. 우리는 로기를 응원하는 역할이다. 로기에게 힘내라고 함께 말해볼지 물어봐.','정비사가 고쳤고 로기가 다시 움직인다고 짧게 기뻐해. 로기와 공원 또는 놀이터 중 어디로 갈지 물어봐.']},
 {id:'delivery',title:'라니의 선물 배달',steps:['라니가 가니에게 작은 선물 꾸러미를 배달하는 상상 상황을 만들고 같이 출발할지 물어봐.','선물 꾸러미에 꽃 또는 그림 중 무엇을 넣을지 물어봐. 아이가 다른 것을 말하면 받아줘.','길을 따라 천천히 가며 빨간 신호에서 멈춘다고 말해. 초록 신호가 되면 출발할지 물어봐.','가니가 선물을 받아 기뻐한다고 말해. 다음에 로기 또는 가니 중 누구를 만나러 갈지 물어봐.']},
 {id:'outing',title:'공룡 공원 나들이',steps:['실제 공룡을 만나는 게 아니라 공룡 모형이 있는 공원으로 나들이하는 상상 놀이를 제안해.','티라노 모형 또는 목이 긴 공룡 모형 중 무엇을 먼저 볼지 물어봐.','아이가 고른 공룡의 쉬운 특징 하나를 말해. 공룡 발자국 모양을 같이 찾아볼지 물어봐.','공원에서 구경을 마쳤다고 말해. 친구들과 다음 나들이를 준비할지 쉬운 질문을 해.']},
 {id:'wash',title:'가니 세차 놀이',steps:['가니 몸에 작은 먼지가 묻어 세차장에 가는 상상 상황을 만들어. 같이 반짝반짝 씻을지 물어봐.','물방울 소리 또는 거품 소리 중 어떤 소리를 낼지 물어봐. 실제 세제나 기계를 만지게 하지 마.','거품을 씻고 가니가 반짝인다고 말해. 바퀴를 닦는 흉내나 빵빵 소리 중 하나를 함께 해보자고 물어봐.','깨끗해진 가니가 친구들을 만나러 간다고 말해. 다음에는 누구를 만나러 갈지 물어봐.']}
];
export function normalizeStory(value={}) {
 return {scene:scenes.some(x=>x.id===value?.scene)?value.scene:'repair',step:Number.isInteger(value?.step)?Math.max(0,Math.min(3,value.step)):0,round:Number.isInteger(value?.round)?Math.max(0,Math.min(100,value.round)):0};
}
export function advanceStory(value,kind='child') {
 if(value?.mode){const state={...value};if(kind==='idle')return state;if(state.mode==='chat'){if(state.turns<2)return {...state,turns:state.turns+1};const events=PLAY_EVENTS[state.actor];let event=eventById(state.pending)||events[state.round%events.length];if(event.id===state.lastEvent)event=events[(events.indexOf(event)+1)%events.length];return {...state,mode:'event',scene:event.visual,event:event.id,step:0,turns:0,pending:undefined};}if(state.step<3)return {...state,step:state.step+1};return {...initialStory(state.actor,state.round+1),lastEvent:state.event,lead:state.lead||0};}
 const state=normalizeStory(value);
 if(kind==='idle')return state;
 if(state.step<3)return {...state,step:state.step+1};
 return {scene:state.scene,step:0,round:Math.min(100,state.round+1)};
}
export function storyDirection(value,kind='child') {
 if(value?.mode){const event=eventById(value.event);return playDirection(value,event,kind);}
 const state=normalizeStory(value),scene=scenes.find(x=>x.id===state.scene);
 return `현재 상상 이야기: ${scene.title}. 장면 ${state.step+1}/4.\n${scene.steps[state.step]}\n${kind==='idle'?'아이가 잠깐 조용한 상태다. 아이가 답했다고 꾸미지 말고, 이 장면을 더 쉽게 설명하거나 두 가지 선택을 제시해 한 번만 말을 걸어. 재촉하지 마.':'아이의 마지막 말을 먼저 이해하고 반응한 뒤 이 장면을 이어가. 아이가 다른 주제를 말하면 먼저 답하고 그 관심을 놀이에 자연스럽게 반영해.'}\n3세에게 말하는 짧은 2~3문장. 끝에는 응/아니 또는 한 단어로 답할 수 있는 질문이나 놀이 제안을 하나만 해. 아이가 끝내겠다고 말하지 않았다면 통화를 마무리하거나 작별하지 마. 아이가 거절하면 강요하지 말고 다른 쉬운 놀이를 제안해. 무서운 사고, 실제 출동 요구, 아이가 실제 차량을 만지는 행동은 금지.`;
}



export function initialStory(actor='tayo',round=0){return {actor:getCharacter(actor).id,mode:'chat',scene:'daily',step:0,round,turns:0,lead:0};}
export function storyForCharacter(value,actorId){const actor=getCharacter(actorId).id;if(value?.actor!==actor||!['chat','event'].includes(value?.mode))return initialStory(actor);const base={...initialStory(actor,Math.max(0,Math.min(100,Number(value.round)||0))),lead:Math.max(0,Math.min(1000,Number.isInteger(value.lead)?value.lead:0))};if(value.mode==='event'){const event=eventById(value.event);if(!PLAY_EVENTS[actor].includes(event))return base;return {...base,mode:'event',scene:event.visual,event:event.id,step:Math.max(0,Math.min(3,Number(value.step)||0))};}return {...base,turns:Math.max(0,Math.min(2,Number(value.turns)||0)),lastEvent:PLAY_EVENTS[actor].some(e=>e.id===value.lastEvent)?value.lastEvent:undefined,pending:PLAY_EVENTS[actor].some(e=>e.id===value.pending)?value.pending:undefined};}
export function prepareStory(value,actorId,text='',kind='child'){let state=storyForCharacter(value,actorId);if(kind==='scene')return state;if(kind==='idle'){
 if(state.mode==='event')return state;
 const lead=(state.lead||0)+1,index=(lead-1)%6;
 if(index===2||index===5){const events=PLAY_EVENTS[state.actor];let event=events[state.round%events.length];if(event.id===state.lastEvent)event=events[(state.round+1)%events.length];return {...state,lead,mode:'event',scene:event.visual,event:event.id,step:0,turns:0,pending:undefined};}
 return {...state,lead};
 }if(/싫|안 할|안할|그만|다른 놀이|다른놀이/.test(text))return initialStory(actorId,state.round+1);if(state.mode==='chat'){const match=PLAY_EVENTS[state.actor].map(event=>({event,score:(text.match(new RegExp(event.keywords))||[''])[0].length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score)[0]?.event;const explicit=/출동|불.?꺼|불.?끄|불났|불이.?났|사고|부딪|구조|수습|견인|가자|하자|시작|해줘|보여|찾자|놀자|탈출|치워|고쳐|갈아|교체|수리/.test(text);if(match&&(match.id!==state.lastEvent||explicit)){if(explicit)return {...state,mode:'event',scene:match.visual,event:match.id,step:0,turns:0,pending:undefined};state={...state,pending:match.id};}}return state;}
function playDirection(state,event,kind){const actor=getCharacter(state.actor).name;return `${actor}와의 현재 흐름: ${state.mode==='chat'?'일상 대화':event.title+'. 장면 '+(state.step+1)+'/4'}.
${state.mode==='chat'?'지금은 사건을 시작하지 말고 아이의 말을 받아 일상 대화를 나눠. 오늘 한 놀이, 좋아하는 것, 친구 이야기 중 앞 대화와 이어지는 이야기를 해. 놀이가 막 끝났다면 방금 해결한 일을 구체적으로 한 번 말하고 아이의 관심을 따라 이야기해. “같이 쉴까”, “천천히 굴러볼까” 같은 내용 없는 마무리는 하지 마. 같은 질문이나 주제를 반복하지 마.':event.steps[state.step]+'. 아이의 마지막 말부터 반응하고 이 장면을 이어가. 캐릭터가 먼저 행동하고 그 결과를 말해. 첫 장면은 “출동!” 같은 구체적 행동으로 시작해. “같이 할까”, “같이 쉴까”, “굴러볼까”처럼 허락만 묻지 마. 화면의 현재 장면에서 실제로 벌어지는 행동만 묘사해. 아직 물이 안 나오면 물을 뿌렸다고 말하지 마. 아이가 고른 색, 목적지, 물건을 기억하고 이후 장면에 반영해. 다른 주제로 말하면 먼저 답하고 장면을 강요하지 마.'}
${kind==='idle'?'아이가 조용하다. 장면을 진행하지 말고 지금 이야기와 관련한 쉬운 선택을 한 번만 제안해. 아이가 대답했다고 꾸미지 마.':''}
${state.mode==='event'?'현재 사건에 맞는 질문 참고: '+JSON.stringify(event.questions)+'. 아이에게 새 질문을 할 때는 이 사건과 현재 보이는 단계에서 자연스럽게 이어가. 다른 사건의 질문을 끼워 넣지 마. 아이의 취향에는 정답과 오답이 없어. 화면에 이미 정해진 물건과 행동을 아이의 답 때문에 바뀌었다고 지어내지 마.':''}
3세에게 짧은 한국어 반말 2~3문장으로 말해. 사건 중에는 행동과 결과를 먼저 말하되, 효과음과 응원만 반복하지 마. 공룡 구경에는 공룡과 발자국, 수리에는 바퀴와 고장 소리, 선물 배달에는 선물과 받는 친구, 간식 배달에는 좋아하는 간식처럼 현재 사건과 단계에 맞는 질문을 섞어. 수리 중 음식 질문처럼 관계없는 주제로 돌리지 마. 아이가 답하면 먼저 그 답에 반응하고 방금 장면과 연결해. 질문을 퀴즈처럼 채점하지 마. 한 번에 질문은 하나만 해. 아이가 티라노나 피자처럼 답하면 그 답을 먼저 받아 쉬운 특징이나 느낌 한 가지를 말하고 놀이로 이어가. 예: “티라노 좋아하는구나! 커다란 머리랑 짧은 앞팔이 있지. 저기 발자국도 보인다!” 아이가 답하지 않아도 캐릭터가 일을 계속한다. 작별하지 마. 모두 장난감 상상 놀이이며 무서운 사고나 실제 위험한 행동은 없다. 정비와 구조는 캐릭터나 어른 역할이 하며 아이는 소리와 응원으로 참여한다.`;}

export function sceneNarration(state){
 const action=state?.mode==='event'?eventById(state.event)?.narration?.[state.step]:null;
 const question=interactionQuestion(state);
 const base=question?action?.replace(/[^.!?]*[?？]\s*$/u,'').trim():action;
 return action?[base,question].filter(Boolean).join(' '):null;
}

export function proactiveNarration(state,kind){
 if(kind!=='idle'||state?.mode!=='chat'||!state.lead)return null;
 const index=(state.lead-1)%6,cycle=Math.floor((state.lead-1)/6)%3;
 const friend=getCharacter(state.actor).id==='rogi'?'타요':'로기';
 const first=[
  '천천히 말해도 돼! 나는 오늘 친구들이랑 소풍 준비를 했어. 너는 딸기랑 국수 중에 뭐가 좋아?',
  '나는 오늘 차고지에서 공이랑 그림책을 찾았어! 너는 공놀이랑 블록 중에 뭐가 좋아?',
  '오늘 고양이 그림을 봤어. 야옹야옹! 너는 고양이랑 강아지 중에 어떤 친구가 좋아?'
 ];
 const own=[
  '지금은 듣기만 해도 괜찮아! 소풍 바구니에 빨간 사과 그림을 담았어. 사과는 아삭아삭 소리가 나지!',
  '나는 친구한테 공을 데굴데굴 굴려 줬어. 친구도 다시 데굴데굴 보내 줬지! 너도 손으로 굴리는 흉내를 내도 돼.',
  '강아지는 꼬리를 흔들며 멍멍 인사한대. 나는 친구한테 빵빵 인사했어! 빵빵!'
 ];
 if(index===0)return first[cycle];
 if(index===1)return own[cycle];
 if(index===3)return `나는 쉬는 날 ${friend}랑 공원에 갔어! 너는 지난번 쉬는 날 가족이랑 뭐 하고 놀았어?`;
 return cycle===0?'공원에서 꽃도 보고 공도 굴렸어! 집에서는 블록으로 차고지를 만들 수도 있지. 나는 파란 차고지 그림을 그려 봤어!':cycle===1?'나는 친구랑 공원에서 나비를 따라 구경했어! 팔랑팔랑, 나비처럼 손을 흔들어 줘도 돼.':'그날 친구랑 놀이터 미끄럼틀을 구경했어! 슝 내려오는 소리가 재미있었지. 슝!';
}
