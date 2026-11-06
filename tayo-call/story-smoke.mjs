import {buildMessages} from './conversation.mjs';
import {advanceStory} from './story.mjs';
let story={scene:'repair',step:1,round:0};let history=[{role:'assistant',content:'로기가 차고지에서 멈췄대! 같이 도와주는 놀이를 해볼까?'}];
for(const [kind,text] of [['child','응'],['child','빵빵'],['idle','[조용함]'],['child','힘내 로기']]){
 const r=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'qwen3.5:9b',think:false,stream:false,messages:buildMessages(text,history,story,kind),options:{num_ctx:4096,num_predict:200,num_thread:4,temperature:0.65}}),signal:AbortSignal.timeout(180000)});
 if(!r.ok)throw new Error(await r.text());const reply=(await r.json()).message.content;
 console.log(JSON.stringify({kind,text,story,reply}));history.push(...(kind==='child'?[{role:'user',content:text}]:[]),{role:'assistant',content:reply});story=advanceStory(story,kind);
}
