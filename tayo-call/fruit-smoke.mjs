import {buildMessages,dialoguePlan,repeatsQuestion} from './conversation.mjs';
let history=[];
for(const text of ['나는 사과가 좋아','빨간 사과','바나나도 좋아','응','타요 친구랑 놀고 싶어','로기']){
 const plan=dialoguePlan(text,history);
 const r=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:process.env.TAYO_TEST_MODEL||'qwen3:4b-instruct-2507-q4_K_M',think:false,stream:false,messages:buildMessages(text,history),options:{num_ctx:2048,num_predict:160,num_thread:2,temperature:0.35}})});
 const reply=(await r.json()).message.content;console.log(JSON.stringify({text,plan,reply,repeated:repeatsQuestion(reply,history)}));history.push({role:'user',content:text},{role:'assistant',content:reply});
}

