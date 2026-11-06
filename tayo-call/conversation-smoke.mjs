import {buildMessages} from './conversation.mjs';
let history=[{role:'assistant',content:'어떤 공룡을 좋아해?'}];
for(const text of ['티라노','뭘 먹어?','타요 친구는 누구야?','로기는 무슨 색이야?']) {
 const r=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:process.env.TAYO_TEST_MODEL||'qwen3:4b-instruct-2507-q4_K_M',stream:false,think:false,messages:buildMessages(text,history),options:{num_ctx:2048,num_predict:160,num_thread:2,temperature:0.35}})});
 const reply=(await r.json()).message?.content;
 console.log(JSON.stringify({text,reply}));history.push({role:'user',content:text},{role:'assistant',content:reply});
}


