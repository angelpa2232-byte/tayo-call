import assert from 'node:assert/strict';
const {instructions,cleanReply}=await import('./server.mjs');
const started=Date.now();
const res=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'qwen3:0.6b',stream:false,think:false,keep_alive:'1m',messages:[{role:'system',content:instructions},{role:'user',content:'나는 강아지가 좋아!'}],options:{num_ctx:1024,num_predict:100,num_thread:2}}),signal:AbortSignal.timeout(90000)});
assert.equal(res.status,200);const data=await res.json();assert.ok(/[가-힣]/.test(data.message.content));
console.log(JSON.stringify({reply:cleanReply(data.message.content),seconds:(Date.now()-started)/1000}));
