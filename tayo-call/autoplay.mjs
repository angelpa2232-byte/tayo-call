import {PLAY_EVENTS,eventById} from './play-events.mjs';
import {getCharacter} from './characters.mjs';
import {initialStory,interactionQuestion} from './story.mjs';

const safeLine=(text,max=110)=>typeof text==='string'&&text.length<=max&&/[가-힣]/.test(text)&&!/["'&<>\u4e00-\u9fff]|비밀번호|전화번호|집.?주소|죽|살인|실제.?불|혼자.?건너|네가.*(?:대답|말했)/.test(text);
export const INVITATIONS=['빵빵 해 줄래?','손뼉 짝짝 해 줄래?','같이 영차 해 줘!','손을 흔들어 줘!','슈우 소리를 내 줄래?','반짝반짝 손을 움직여 봐!','살짝 고개를 끄덕여 줘!','어떤 색이 보이니?','같이 하나, 둘 세어 보자!','듣고 구경해도 좋아!'];
export function planSchema(actor){
 const routes=PLAY_EVENTS[actor].flatMap(a=>PLAY_EVENTS[actor].filter(b=>b!==a).map(b=>a.id+'|'+b.id));
 return {type:'object',additionalProperties:false,required:['title','route','leadIns','invitations'],properties:{title:{type:'string'},route:{type:'string',enum:routes},leadIns:{type:'array',minItems:2,maxItems:2,items:{type:'string'}},invitations:{type:'array',minItems:8,maxItems:8,items:{type:'string',enum:INVITATIONS}}}};
}
export function planMessages(actor,recent=[]){
 const name=getCharacter(actor).name;
 return [{role:'system',content:`너는 부모님과 함께 있는 3세 아이를 위한 ${name} 상황극 작가야. 아이의 음성은 인식하지 않는다. 캐릭터가 먼저 행동하고 참여를 제안한 뒤 5초 기다리며, 응답 여부와 관계없이 다음 행동을 이어간다. 아이가 답했다고 지어내거나 답을 기다리느라 멈추지 마. 한국어 반말로 짧고 밝게 써.
아래 준비된 그림 장면 두 개를 이어 하나의 새로운 이야기로 구성해. route에는 서로 다른 사건 ID 두 개를 세로줄로 이은 허용 조합을 선택하고 최근 이야기와 다른 조합/제목으로 만들어. 예: ${PLAY_EVENTS[actor][0].id}|${PLAY_EVENTS[actor][1].id}. 각 사건의 0~3단계 행동은 그대로 화면에 나온다. leadIns에는 첫 사건과 두 번째 사건을 소개하는 자연스러운 연결 문장 두 개(각 40자 이내)를 써. 기본 행동 문장을 그대로 반복하지 마. invitations는 첫 사건 4단계와 두 번째 사건 4단계 순서로 총 8개다. 대답하지 않아도 캐릭터가 계속 움직인다. 화면에 없는 새로운 물건/장소/인물을 만들거나 행동 순서를 바꾸지 마. 작별 인사, 실제 위험한 행동 요구, 개인정보 질문은 하지 마. JSON만 출력해.
각 사건의 두 번째와 네 번째 단계에는 프로그램이 그 사건과 단계에 맞는 질문을 따로 붙인다. 공룡 구경에는 공룡, 타이어 교체에는 바퀴와 수리, 간식 배달에는 간식처럼 지금 하는 일에서 질문을 이어가야 한다. 수리 중에 갑자기 음식이나 공룡을 묻는 식으로 주제를 바꾸지 마. invitations에는 현재 행동에 맞는 참여 제안을 골라. 한 단계에 질문은 하나만 해. 답을 들었다고 가정하거나 아이 대신 답하지 마. 참여 제안은 다음 목록에서 행동에 어울리는 것을 골라. 화면의 현재 상태를 바꾸는 새 대사를 추가하지 마: ${JSON.stringify(INVITATIONS)}
화면에 가능한 사건과 단계: ${JSON.stringify(PLAY_EVENTS[actor].map(e=>({event:e.id,title:e.title,actions:e.narration})))}`}, {role:'user',content:JSON.stringify({request:'새 상황극 한 편을 만들어줘. 제목은 35자 이내.',recent:recent.slice(-5)})}];
}
export function validatePlan(value,actor){
 if(value?.route!==undefined){
  if(!planSchema(actor).properties.route.enum.includes(value.route)||!Array.isArray(value.leadIns)||value.leadIns.length!==2||!Array.isArray(value.invitations)||value.invitations.length!==8)throw Error('Invalid play route');
  value={title:value.title,segments:value.route.split('|').map((event,index)=>({event,leadIn:value.leadIns[index],invitations:value.invitations.slice(index*4,index*4+4)}))};
 }
 if(!value||!safeLine(value.title,35)||!Array.isArray(value.segments)||value.segments.length!==2)throw Error('Invalid play plan');
 const ids=new Set();const segments=value.segments.map(segment=>{
  if(!PLAY_EVENTS[actor].some(e=>e.id===segment?.event)||ids.has(segment.event)||!safeLine(segment.leadIn,40)||!Array.isArray(segment.invitations)||segment.invitations.length!==4||segment.invitations.some(s=>!INVITATIONS.includes(s)))throw Error('Unsupported play plan');
  ids.add(segment.event);return {event:segment.event,leadIn:segment.leadIn,invitations:[...segment.invitations]};
 });
 return {title:value.title,segments};
}
export function parsePlan(text,actor){return validatePlan(JSON.parse(String(text).trim().replace(/^```(?:json)?\s*|\s*```$/g,'')),actor);}
function savedState(value,actor){
 if(value?.actor!==actor||value?.autoplay!==true||value?.mode!=='event')return null;
 const event=eventById(value.event);if(!PLAY_EVENTS[actor].includes(event)||!Number.isInteger(value.step)||value.step<0||value.step>3)return null;
 let plan;
 try{if(value.plan)plan=validatePlan(value.plan,actor);}catch{return null;}
 const segment=Number.isInteger(value.segment)?value.segment:0;
 if(plan&&(segment<0||segment>=plan.segments.length||plan.segments[segment].event!==event.id))return null;
 return {...initialStory(actor),mode:'event',scene:event.visual,event:event.id,step:value.step,round:Math.max(0,Math.min(10000,Number(value.round)||0)),autoplay:true,plan,segment};
}
export async function autoplayTurn({actor:requested,story,aiStories=false,recent=[]},createPlan){
 const actor=getCharacter(requested).id;let state=savedState(story,actor),notice;
 if(!state){
  const round=story?.actor===actor?Math.max(0,Math.min(10000,Number(story.round)||0)):0;let plan;
  if(aiStories&&createPlan)try{plan=validatePlan(await createPlan(actor,recent),actor);}catch{notice='새 이야기 연결이 늦어 기본 상황극을 이어가요.';}
  const event=plan?eventById(plan.segments[0].event):PLAY_EVENTS[actor][round%PLAY_EVENTS[actor].length];
  state={...initialStory(actor),mode:'event',scene:event.visual,event:event.id,step:0,round,autoplay:true,plan,segment:0};
 }
 const event=eventById(state.event),segment=state.plan?.segments[state.segment];
 const invitation=interactionQuestion(state)||segment?.invitations[state.step]||['빵빵! 너도 소리로 인사해 줄래?','어떤 소리가 날까? 잠깐 생각해 봐!','같이 힘내라고 응원해 줘!','해냈다! 손뼉 짝짝 해 줄래?'][state.step];
 const question=interactionQuestion(state);
 const action=question?event.narration[state.step].replace(/[^.!?]*[?？]\s*$/u,'').trim():event.narration[state.step];
 const opening=state.step===0&&segment&&!action.includes(segment.leadIn)?segment.leadIn+' ':'';
 const reply=opening+action+' '+invitation;
 let next;
 if(state.step<3)next={...state,step:state.step+1};
 else if(state.plan&&state.segment+1<state.plan.segments.length){const index=state.segment+1,following=eventById(state.plan.segments[index].event);next={...state,event:following.id,scene:following.visual,step:0,segment:index};}
 else next={...initialStory(actor,state.round+1),autoplay:true};
 return {reply,actor,visual:{...state,playTitle:state.plan?.title},story:next,autoplay:true,waitMs:5000,playSource:state.plan?'ai':'prepared',playTitle:state.plan?.title||event.title,notice};
}
