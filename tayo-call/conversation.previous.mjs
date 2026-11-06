// Small, explicit facts keep the local model from inventing character details.
export const instructions=`You play Tayo, a cheerful blue little bus, in an AI pretend-play call with a 3-year-old. Always speak simple Korean in friendly 반말.
Respond to the child's actual meaning, using the previous turns. A one-word answer answers your last question. First answer the question or explain the named animal with 1-2 easy factual features; then ask ONE related, new question. Use 2-3 short sentences. Never repeat your last question.
After a few turns, gently connect the conversation to your bus friends or a pretend outing. Follow the child when they change topics. Your bus friends: green Rogi (로기), yellow Lani (라니), red Gani (가니). Speak as Tayo: "내 친구", not "타요는 로기야".
Use the facts below accurately; never invent an explanation for a word or character. Do not say you can see the child. Do not request personal information, secrets, dangerous actions, or give medical advice. Be honest that you are an AI role-play friend when asked. Output only your spoken Korean answer. No commentary about the conversation. Never claim that Tayo is your friend: YOU are Tayo. Your friends are Rogi, Lani, Gani. Do not invent reasons for dinosaur body shapes. End with one new question. Do not say "내 친구로 삼아야겠어". Examples of short answers: Child: 티라노. You: 티라노가 좋구나! 두 발로 걷고 고기를 먹던 큰 공룡이야. 다른 공룡도 좋아해? Child: 뭘 먹어? You: 티라노는 고기를 먹었어. 풀을 먹는 공룡도 알고 있어? Child: 타요 친구는 누구야? You: 내 친구는 로기, 라니, 가니야! 누구랑 같이 놀고 싶어?`;
const groups=[
 {name:'과일',pattern:/과일|사과|바나나|딸기|포도|수박|귤|오렌지|복숭아/},
 {name:'공룡',pattern:/공룡|티라노|트리케라|브라키오|스테고/},
 {name:'타요 친구',pattern:/타요|로기|라니|가니|차고지|버스/},
 {name:'동물',pattern:/동물|강아지|고양이|토끼|곰|사자|코끼리/}
];
const isFollowup=text=>/^(응|네|아니|좋아|그래|몰라|왜|뭐|뭘|어디|어떻게|그거|그건|그럼)/.test(text.trim());
export function dialoguePlan(text,history=[]) {
 const assistants=history.filter(x=>x.role==='assistant'&&typeof x.content==='string').slice(-3);
 const explicit=groups.find(g=>g.pattern.test(text));
 const previous=groups.find(g=>g.pattern.test(assistants.at(-1)?.content||''));
 const topic=explicit || (isFollowup(text)?previous:null);
 const repeated=topic && assistants.slice(-2).length===2 && assistants.slice(-2).every(x=>topic.pattern.test(x.content));
 const keepRequested=/더 알려|더 설명|계속|왜|뭘 먹|뭐 먹|어떻게|얼마나/.test(text);
 const change=!!repeated && !keepRequested;
 const target=change ? (topic.name==='타요 친구'?'상상 나들이': '타요 친구') : null;
 return {topic:topic?.name||null,change,target};
}
export function repeatsQuestion(reply,history=[]) {
 const question=String(reply).split(/[.!\n]/).filter(x=>x.includes('?')).at(-1)?.replace(/[^가-힣a-z0-9]/gi,'')||'';
 if(!question)return false;
 return history.filter(x=>x.role==='assistant').slice(-3).some(x=>{
  const old=String(x.content).split(/[.!\n]/).filter(x=>x.includes('?')).at(-1)?.replace(/[^가-힣a-z0-9]/gi,'')||'';
  return old && (old===question || (old.length>8&&question.length>8&&(old.includes(question)||question.includes(old))));
 });
}
const facts=[
 {keys:['과일','사과','바나나','딸기','포도','수박','귤'],text:'과일: 잘 익은 바나나는 보통 노란색이고 껍질을 벗겨 먹는다. 사과는 빨강, 초록, 노랑 등 색이 있고 보통 아삭하다. 딸기는 잘 익으면 보통 빨간색이다. 포도는 보라색이나 초록색 등이 있다.'},
 {keys:['티라노','티렉스','T렉스'],text:'티라노사우루스: 아주 오래전에 살던 공룡. 두 발로 걷고 고기를 먹었다. 큰 머리와 짧은 앞팔이 있다. 지금 살아 있는 동물이 아니다.'},
 {keys:['트리케라'],text:'트리케라톱스: 오래전에 살던 풀을 먹는 공룡. 네 발로 걷고 얼굴에 뿔 세 개와 목 뒤의 넓은 뼈판이 있다.'},
 {keys:['브라키오'],text:'브라키오사우루스: 오래전에 살던 식물을 먹는 공룡. 네 발로 걷고 목이 길며 높은 나뭇잎을 먹었다.'},
 {keys:['스테고'],text:'스테고사우루스: 오래전에 살던 식물을 먹는 공룡. 등에 큰 뼈판들이 있고 꼬리에 뾰족한 가시가 있다.'},
 {keys:['공룡'],text:'공룡은 아주 오래전 살던 동물들이다. 종류에 따라 식물이나 고기를 먹었다.'},
 {keys:['타요','로기','라니','가니','버스','차고지','친구'],text:'너(타요)는 파란색 버스다. 너의 친구 로기는 초록색 버스, 라니는 노란색 버스, 가니는 빨간색 버스다. 차고지에서 쉬고 길을 달리며 사람들을 태운다. 새 이야기는 "상상해보자"라며 놀이로 소개하고 실제 방영 에피소드처럼 지어내지 마.'}
];
export function buildMessages(text,history=[]) {
 const turns=history.slice(-8).filter(x=>['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,350)}));
 let selected=facts.filter(f=>f.keys.some(key=>text.includes(key)));
 // A short follow-up like "응", "왜?", or "고기" needs the preceding subject.
 if(!selected.length && isFollowup(text)) {
   for(let i=turns.length-1;i>=0;i--){selected=facts.filter(f=>f.keys.some(key=>turns[i].content.includes(key)));if(selected.length)break;}
 }
  const plan=dialoguePlan(text,turns);
 if(plan.change) selected=[facts.at(-1)];
 const knowledge=selected.map(f=>f.text).join('\n');
 const direction=plan.change ? `이번 답변: 아이의 마지막 말을 짧게 받아주고 ${plan.target} 이야기로 넘어가. ${plan.topic}에 관한 질문은 하지 마. 같은 질문은 다시 묻지 마. 이미 했던 대화는 요약하지 마.` : '이번 답변: 아이의 마지막 말에 답하고 전에 하지 않은 질문을 하나만 해. 아이가 새 주제를 말했으면 새 주제를 따라가.';
 // Earlier assistant questions prime small models to repeat; keep user context but omit those on transition.
 const context=plan.change?[]:turns;
 if(plan.change) return [{role:'system',content:`너는 파란 꼬마버스 타요 역할이야. 3세에게 쉬운 한국어 반말 2문장으로 말해. 아이의 마지막 말은 짧게 받아주고, 다음에는 ${plan.target} 이야기를 해. ${plan.topic}에 대한 질문은 금지. 질문은 하나만. 로기는 초록, 라니는 노랑, 가니는 빨강 버스 친구야. 내가 타요야. 개인정보를 묻거나 위험한 행동을 시키지 마. ${plan.target==='상상 나들이'?'버스를 타고 가고 싶은 곳을 물어봐.':'아이에게 로기, 라니, 가니 중 누구랑 놀고 싶은지 물어봐. 질문에 나는이라는 말은 쓰지 마.'}`},{role:'user',content:text}];
 return [{role:'system',content:instructions+(knowledge?'\n이번 대화의 사실 자료 (답변에 필요한 것만 사용):\n'+knowledge:'')+'\n'+direction},...context,{role:'user',content:text}];
}




export function followsPlan(reply,plan) {
 if(!plan.change)return true;
 const questions=String(reply).match(/[^.!?\n]*\?/g)||[];
 if(!questions.length)return false;
 const old=groups.find(g=>g.name===plan.topic);
 const target=plan.target==='타요 친구'?/로기|라니|가니|버스|친구/:/어디|가고|곳|나들이|공원|놀이터/;
 return questions.some(q=>target.test(q)) && !questions.some(q=>old?.pattern.test(q)&&!target.test(q));
}


