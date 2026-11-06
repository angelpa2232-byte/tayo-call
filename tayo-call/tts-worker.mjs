import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
export function createVoiceWorker(python,script,cwd){
 let child=null,sequence=0,idleTimer;const pending=new Map();
 function stop(){clearTimeout(idleTimer);const old=child;child=null;for(const job of pending.values())job.finish(new Error('Voice worker stopped'));pending.clear();clearTimeout(idleTimer);if(!old||old.exitCode!==null)return Promise.resolve();return new Promise(resolve=>{const timeout=setTimeout(resolve,3000);timeout.unref();old.once('close',()=>{clearTimeout(timeout);resolve();});old.kill();});}
 function start(){
  const process=spawn(python,[script,'--worker'],{cwd,windowsHide:true,env:{...globalThis.process.env,HF_HUB_OFFLINE:'1',PYTHONIOENCODING:'utf-8'}});child=process;
  process.stderr.on('data',()=>{});process.stdin.on('error',()=>{});
  createInterface({input:process.stdout}).on('line',line=>{try{const data=JSON.parse(line),job=pending.get(data.id);if(job)job.finish(data.error?new Error(data.error):null,Buffer.from(data.audio,'base64'));}catch{stop();}});
  const fail=()=>{if(child===process)stop();};process.on('error',fail);process.on('exit',fail);
 }
 function speak(data,signal){return new Promise((resolve,reject)=>{
  if(signal?.aborted){reject(new Error('Voice cancelled'));return;}
  clearTimeout(idleTimer);if(!child)start();const id=++sequence;
  const abort=()=>finish(new Error('Voice cancelled'));
  function finish(error,audio){if(!pending.has(id))return;pending.delete(id);signal?.removeEventListener('abort',abort);error?reject(error):resolve(audio);if(!pending.size){idleTimer=setTimeout(stop,90000);idleTimer.unref();}}
  pending.set(id,{finish});signal?.addEventListener('abort',abort,{once:true});
  child.stdin.write(JSON.stringify({id,text:data.text,voice:data.voice})+'\n',error=>{if(error)finish(error);});
 });}
 return {speak,stop};
}
