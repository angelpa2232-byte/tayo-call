import {writeFile} from 'node:fs/promises';
import {buildMessages} from './conversation.mjs';
const model=process.env.TAYO_TEST_MODEL||'qwen3.5:9b';
const observations=[];
for(const inputs of [['티라노','뭘 먹어?','타요 친구는 누구야?','로기는 무슨 색이야?'],['사과가 좋아','빨간 사과','바나나도 좋아','응','공룡 이야기 해줘']]){
 let history=inputs[0]==='티라노'?[{role:'assistant',content:'어떤 공룡을 좋아해?'}]:[];
 for(const text of inputs){const start=Date.now();const r=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,think:false,messages:buildMessages(text,history),options:{num_ctx:4096,num_predict:200,num_thread:4,temperature:0.65}}),signal:AbortSignal.timeout(180000)});
 if(!r.ok)throw new Error(await r.text());const data=await r.json();const reply=data.message.content;
 const observation={model,text,reply,seconds:(Date.now()-start)/1000};observations.push(observation);await writeFile(new URL('runtime/quality-'+model.replace(/[^a-z0-9.-]/gi,'_')+'.json',import.meta.url),JSON.stringify(observations,null,2));console.log(JSON.stringify(observation));history.push({role:'user',content:text},{role:'assistant',content:reply});}
}

