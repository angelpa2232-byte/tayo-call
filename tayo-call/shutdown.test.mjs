import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
process.env.PORT='18100';
const {makeServer}=await import('./server.mjs');
test('complete exit rejects foreign requests, aborts active work and closes the listener after cleanup',async()=>{
 let entered;const started=new Promise(resolve=>entered=resolve);let aborted=false,cleaned=false;
 const store={read:async()=>({provider:'ollama',key:''}),write:async()=>{}};
 const server=makeServer(async(url,options)=>new Promise((resolve,reject)=>{entered();options.signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'));},{once:true});}),undefined,undefined,store,{stopRuntime:async()=>{assert.equal(aborted,true);await new Promise(r=>setTimeout(r,20));cleaned=true;}});
 await new Promise(resolve=>server.listen(18100,'127.0.0.1',resolve));const closed=once(server,'close');
 const base='http://127.0.0.1:18100',post=(path,data,origin=base)=>fetch(base+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
 try{
  assert.equal((await fetch(base+'/api/shutdown')).status,404);
  assert.equal((await post('/api/shutdown',{},'https://other.example')).status,403);
  const inFlight=post('/api/chat',{text:'왜 하늘은 파래?'}).then(r=>r.status).catch(()=>0);await started;
  const response=await post('/api/shutdown',{});assert.equal(response.status,200);assert.equal((await response.json()).shuttingDown,true);
  await closed;await inFlight;assert.equal(cleaned,true);assert.equal(aborted,true);assert.equal(server.listening,false);
  await assert.rejects(fetch(base+'/api/status',{signal:AbortSignal.timeout(1000)}));
 }finally{if(server.listening){server.closeAllConnections();server.close();}}
});
test('voice worker exits immediately on complete shutdown',async()=>{
 const {createVoiceWorker}=await import('./tts-worker.mjs');const fixture=new URL('runtime/voice-exit-test-'+process.pid+'.mjs',import.meta.url);
 await writeFile(fixture,"import readline from 'node:readline';for await(const line of readline.createInterface({input:process.stdin})){const data=JSON.parse(line);console.log(JSON.stringify({id:data.id,audio:Buffer.from(String(process.pid)).toString('base64')}));}");
 const worker=createVoiceWorker(process.execPath,fileURLToPath(fixture),fileURLToPath(new URL('.',import.meta.url)));
 try{const audio=await worker.speak({text:'test'},AbortSignal.timeout(3000));const pid=Number(audio.toString());await worker.stop();assert.throws(()=>process.kill(pid,0));}finally{await worker.stop();await unlink(fixture);}
});
