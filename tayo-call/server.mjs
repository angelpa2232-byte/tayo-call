import {autoplayTurn,planSchema,planMessages,parsePlan} from './autoplay.mjs';
import {musicTurn} from './songs.mjs';
import {stopProjectRuntime} from './shutdown.mjs';
import {createSettingsStore,openaiReply,openaiSpeech,verifyKey,ConnectionError,apiModel} from './openai-provider.mjs';
import {createVoiceWorker} from './tts-worker.mjs';
import {CHARACTERS,getCharacter,requestedCharacter,characterGreeting} from './characters.mjs';
import http from 'node:http';
import {existsSync} from 'node:fs';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import {buildMessages,instructions} from './conversation.mjs';
export {instructions};
import {advanceStory,prepareStory,initialStory,sceneNarration,proactiveNarration} from './story.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT || 8088), origin=`http://127.0.0.1:${port}`;
const model='qwen3:4b-instruct-2507-q4_K_M', ollama=process.env.TAYO_OLLAMA_URL||'http://127.0.0.1:11434';
const portablePython=new URL('runtime/python/python.exe',import.meta.url);
const python=process.env.TAYO_PYTHON || fileURLToPath(existsSync(portablePython)?portablePython:new URL('.venv/Scripts/python.exe',import.meta.url));
const assets={'/':['index.html','text/html'],'/index.html':['index.html','text/html'],'/app.js':['app.js','application/javascript'],'/tayo-character.js':['tayo-character.js','application/javascript'],'/style.css':['style.css','text/css'],'/tayo-icon.svg':['tayo-icon.svg','image/svg+xml']};
assets['/mini-games.mjs']=['mini-games.mjs','application/javascript'];
assets['/mini-games.css']=['mini-games.css','text/css'];
assets['/mini-games-extra.mjs']=['mini-games-extra.mjs','application/javascript'];
assets['/mini-game-input.mjs']=['mini-game-input.mjs','application/javascript'];
for(const file of ['vehicles.mjs','vehicles-data.mjs','vehicles-art.mjs','vehicles.css'])assets['/'+file]=[file,file.endsWith('.css')?'text/css':'application/javascript'];
for(const file of ['marine.mjs','marine-data.mjs','marine-art.mjs','marine-voice.mjs','marine.css'])assets['/'+file]=[file,file.endsWith('.css')?'text/css':'application/javascript'];
for(const file of ['scene-motion.mjs','scene-backdrops.mjs','repair-scene.mjs','scene-motion.css'])assets['/'+file]=[file,file.endsWith('.css')?'text/css':'application/javascript'];
assets['/everyday-scenes.mjs']=['everyday-scenes.mjs','application/javascript'];
assets['/action-scenes.mjs']=['action-scenes.mjs','application/javascript'];
assets['/play-events.mjs']=['play-events.mjs','application/javascript'];
assets['/scene-visuals.mjs']=['scene-visuals.mjs','application/javascript'];
assets['/songs.mjs']=['songs.mjs','application/javascript'];
assets['/song-player.js']=['song-player.js','application/javascript'];
assets['/characters.mjs']=['characters.mjs','application/javascript'];
for(const id of Object.keys(CHARACTERS))assets['/assets/characters/'+id+'.png']=['assets/characters/'+id+'.png','image/png'];
export function cleanReply(text) {
  const clean=String(text || '').replace(/<think>[\s\S]*?<\/think>/g,'').replace(/[*#`]/g,'').trim();
  if(!clean || !/[가-힣]/.test(clean) || /자살|살인|성관계|비밀번호|전화번호|집 주소/.test(clean)) return '우리 부모님과 함께 재미있는 놀이를 해보자! 좋아하는 동물이 뭐야?';
  return clean.slice(0,320);
}
const sttChildren=new Set();
async function transcribe(audio,signal,context='conversation') {
  return new Promise((resolve,reject)=>{
    const child=spawn(python,[fileURLToPath(new URL('transcribe.py',import.meta.url)),...(context==='marine'?['--marine']:[])],{cwd:root,windowsHide:true,env:{...process.env,HF_HUB_OFFLINE:'1'},signal});
    sttChildren.add(child);child.once('close',()=>sttChildren.delete(child));
    let output=''; child.stdout.on('data',x=>output+=x); child.stderr.on('data',()=>{});
    child.on('error',()=>reject(new Error('로컬 음성인식 설치가 필요합니다. Ollama_준비.bat를 실행해주세요.')));
    child.on('close',code=>{if(code===0) {try {resolve(JSON.parse(output));} catch {reject(new Error('음성인식 결과 오류'));}} else reject(new Error('음성을 읽지 못했어요. 준비 프로그램을 실행하거나 글자로 입력해주세요.'));});
    child.stdin.on('error',()=>{}); child.stdin.end(Buffer.from(audio,'base64'));
  });
}
const voiceWorker=createVoiceWorker(python,fileURLToPath(new URL('speak.py',import.meta.url)),root);
const synthesize=(data,signal)=>voiceWorker.speak(data,signal);
export async function unloadLocalModels(upstream=fetch){
 try{const response=await upstream(ollama+'/api/ps',{signal:AbortSignal.timeout(3000)});if(!response.ok)return false;const loaded=(await response.json()).models||[];
 for(const item of loaded){const result=await upstream(ollama+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:item.name,keep_alive:0}),signal:AbortSignal.timeout(5000)});if(!result.ok)return false;}return true;}catch{return false;}
}
export function makeServer(upstream=fetch,recognize=transcribe,speak=synthesize,settingsStore=createSettingsStore(),lifecycle={}) {
  let busy=false,shuttingDown=false;const timings={},requests=new Set(),usedModels=new Set();
  const server=http.createServer(async(req,res)=>{
    const send=(code,data,type='application/json')=>{if(res.destroyed) return;res.writeHead(code,{'Content-Type':`${type}; charset=utf-8`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(type==='application/json'?JSON.stringify(data):data);};
    try {
      if(req.headers.host!==`127.0.0.1:${port}`) return send(403,{error:'로컬 주소로 접속해주세요.'});
      const path=new URL(req.url,origin).pathname;
      if(shuttingDown)return send(503,{error:'프로그램을 종료하고 있어요.'});
      if(req.method==='GET' && path==='/api/status') {
        const api=await settingsStore.read();
        let models=[],connected=false,stt=false;
        try {if(api.provider==='ollama'){const r=await upstream(ollama+'/api/tags',{signal:AbortSignal.timeout(3000)});if(r.ok){models=(await r.json()).models || [];connected=true;}}} catch {}
        try {await access(python);await access(new URL('models/whisper-tiny/model.bin',import.meta.url));stt=true;} catch {}
        return send(200,{provider:api.provider,apiConfigured:Boolean(api.key),apiModel,timings,connected,configured:api.provider==='openai'?Boolean(api.key):models.some(x=>x.name===model),stt,model,models:models.map(x=>x.name)});
      }
      if(req.method==='POST' && ['/api/chat','/api/transcribe','/api/tts','/api/settings','/api/shutdown'].includes(path)) {
        if(req.headers.origin!==origin || !req.headers['content-type']?.startsWith('application/json')) return send(403,{error:'허용되지 않은 요청입니다.'});
        let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>2500000)return send(413,{error:'녹음이 너무 길어요.'});}
        let data;try{data=JSON.parse(raw);}catch{return send(400,{error:'잘못된 요청입니다.'});}
        if(path==='/api/shutdown'){
          shuttingDown=true;for(const controller of requests)controller.abort();
          res.once('finish',()=>{void shutdown();});
          return send(200,{shuttingDown:true});
        }
        if(path==='/api/settings'){
          if(busy)return send(409,{error:'통화 처리가 끝난 뒤 설정을 저장해주세요.'});
          if(!['ollama','openai'].includes(data.provider))return send(400,{error:'대화 방식을 골라주세요.'});
          const previous=await settingsStore.read();const key=typeof data.key==='string'&&data.key.trim()?data.key.trim():previous.key;
          if(data.provider==='openai'||data.engine==='openai'){
            if(!/^sk-[A-Za-z0-9_-]{20,}$/.test(key)||key.length>512)return send(400,{error:'발급받은 API 키를 입력해주세요.'});
            await verifyKey(key,upstream);
          }
          await settingsStore.write({provider:data.provider,key});
          const localModelReleased=data.provider==='openai'?await unloadLocalModels(upstream):false;
          return send(200,{provider:data.provider,apiConfigured:Boolean(key),apiModel,localModelReleased});
        }
        if(busy)return send(429,{error:'타요가 생각하고 있어요. 잠깐 기다려주세요.'});
        if(['/api/chat','/api/tts'].includes(path) && (typeof data.text!=='string' || !data.text.trim() || data.text.length>500))return send(400,{error:'짧은 문장을 입력해주세요.'});
        if(path==='/api/transcribe' && (typeof data.audio!=='string' || !/^[A-Za-z0-9+/=]+$/.test(data.audio)))return send(400,{error:'녹음 파일이 올바르지 않습니다.'});
        busy=true;const started=Date.now();const controller=new AbortController();requests.add(controller);const timeout=setTimeout(()=>controller.abort(),180000);res.on('close',()=>controller.abort());
        try {
          if(path==='/api/transcribe'){const result=await recognize(data.audio,controller.signal,data.context==='marine'?'marine':'conversation');timings.sttMs=Date.now()-started;return send(200,result);}
          if(path==='/api/tts'){let result;if(data.engine==='openai'){const api=await settingsStore.read();if(!api.key)throw new ConnectionError('부모님 설정에서 API 키를 저장해주세요.');voiceWorker.stop();result=await openaiSpeech(data,api.key,controller.signal,upstream);}else result=await speak(data,controller.signal);timings.ttsMs=Date.now()-started;return send(200,result,'audio/wav');}
          const selectedModel=['qwen3.5:9b','qwen3:14b','qwen3:4b-instruct-2507-q4_K_M','qwen3:0.6b','qwen3:1.7b'].includes(data.model)?data.model:model;
          const history=Array.isArray(data.history)?data.history:[];
          const api=await settingsStore.read();
          async function generate(messages) {
            if(api.provider==='openai'){if(!api.key)throw new ConnectionError('부모님 설정에서 API 키를 입력해주세요.');return cleanReply(await openaiReply(messages,api.key,controller.signal,upstream));}
            usedModels.add(selectedModel);
            const r=await upstream(ollama+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({model:selectedModel,stream:false,think:false,keep_alive:'10m',messages,options:{num_ctx:4096,num_predict:140,num_thread:4,temperature:0.65}})});
            if(!r.ok)throw new Error('Ollama model not ready');
            return cleanReply((await r.json()).message?.content);
          }
          const kind=data.kind==='scene'&&data.story?.mode==='event'?'scene':data.kind==='idle'?'idle':'child';
          const requested=kind==='child'?requestedCharacter(data.text):null;
          const actorId=requested||getCharacter(data.actor).id;
          if(requested){const state=initialStory(actorId);timings.chatMs=Date.now()-started;timings.provider=api.provider;return send(200,{reply:characterGreeting(actorId),story:state,visual:state,actor:actorId,provider:api.provider,switched:true});}
          if(data.autoplay===true){
            const createPlan=async(actor,recent)=>{
              const messages=planMessages(actor,recent),schema=planSchema(actor),signal=AbortSignal.any([controller.signal,AbortSignal.timeout(api.provider==='openai'?15000:20000)]);
              if(api.provider==='openai'){if(!api.key)throw new Error('No API key');return parsePlan(await openaiReply(messages,api.key,signal,upstream,{schema}),actor);}
              usedModels.add(selectedModel);
              const response=await upstream(ollama+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal,body:JSON.stringify({model:selectedModel,stream:false,think:false,keep_alive:'10m',format:schema,messages,options:{num_ctx:4096,num_predict:1000,num_thread:4,temperature:0.7}})});
              if(!response.ok)throw new Error('Plan unavailable');
              return parsePlan((await response.json()).message?.content,actor);
            };
            const recent=Array.isArray(data.recentPlays)?data.recentPlays.slice(-5).filter(x=>typeof x==='string').map(x=>x.slice(0,60)):[];
            const result=await autoplayTurn({actor:actorId,story:data.story,aiStories:data.aiStories===true,recent},createPlan);
            timings.chatMs=Date.now()-started;timings.provider=api.provider;
            return send(200,{...result,provider:api.provider});
          }
          const state=prepareStory(data.story,actorId,data.text,kind);
          const music=musicTurn(data.text,kind,state,data.story?.actor===actorId&&data.story?.musicOffer===true);
          if(music)return send(200,{...music,visual:state,actor:actorId,provider:api.provider});
                    const messages=buildMessages(data.text,history,state,kind,actorId);
          const narrated=proactiveNarration(state,kind)||sceneNarration(state);
          const previous=history.filter(t=>t?.role==='assistant'&&typeof t.content==='string').at(-1)?.content||'';
          const answering=kind==='child'&&/[?？]|좋아해|말해\s?줘|알려\s?줘/.test(previous);
          let reply=narrated&&!answering&&(kind==='scene'||!/[?？]|왜|무엇|뭐야|어떤|공룡|티라노/.test(data.text))?narrated:await generate(messages);
          if(/[\u4e00-\u9fff]/u.test(reply)) {
            messages[0].content+='\n앞 답변에 중국어가 섞였어. 한글로만 짧게 말해. 중국어와 영어 표현은 절대 넣지 마.';
            reply=await generate(messages);
            if(/[\u4e00-\u9fff]/u.test(reply)) reply='내 말이 조금 이상했지? 우리 같이 빵빵 소리를 내볼까?';
          }
          const story=advanceStory(state,kind);
          timings.chatMs=Date.now()-started;timings.provider=api.provider;return send(200,{reply,story,visual:state,actor:actorId,provider:api.provider});
        } finally {busy=false;requests.delete(controller);clearTimeout(timeout);}
      }
      if(req.method!=='GET' || !assets[path])return send(404,{error:'찾을 수 없습니다.'});
      const [file,type]=assets[path];send(200,await readFile(new URL(file,import.meta.url)),type);
    } catch(error) {send(503,{error:error instanceof ConnectionError?error.message:'AI에 연결하지 못했어요. 인터넷 또는 로컬 AI 실행 상태를 확인해주세요.'});}
  });
  async function shutdown(){
    for(const controller of requests)controller.abort();
    await voiceWorker.stop();
    for(const child of sttChildren)child.kill();
    try {
      if(lifecycle.stopRuntime)await lifecycle.stopRuntime();
      else await Promise.allSettled([...usedModels].map(name=>upstream(ollama+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:name,keep_alive:0}),signal:AbortSignal.timeout(3000)})));
    } catch {console.error('Local AI cleanup failed.');}
    server.emit('shutdown-complete');
    server.close();server.closeAllConnections();
  }
  server.on('close',()=>{for(const controller of requests)controller.abort();void voiceWorker.stop();});
  return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const server=makeServer(fetch,transcribe,synthesize,createSettingsStore(),{stopRuntime:stopProjectRuntime});server.on('error',()=>{console.error('8088 포트의 기존 서버를 종료해주세요.');process.exitCode=1;});
  if((await createSettingsStore().read()).provider==='openai')await unloadLocalModels();
  server.listen(port,'127.0.0.1',()=>console.log(`타요 AI 통화: ${origin}\n종료: Ctrl+C / 대화 방식은 부모님 설정에서 선택합니다.`));
}












