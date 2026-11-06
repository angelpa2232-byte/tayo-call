// A short, local-only name search. It never turns silence into an AI message.
export class MarineVoiceSearch{
 constructor({allowed=()=>false,post,onText=()=>{},onStatus=()=>{},env=globalThis}={}){this.allowed=allowed;this.post=post;this.onText=onText;this.onStatus=onStatus;this.env=env;this.version=0;this.phase='idle';}
 status(phase,text){this.phase=phase;this.onStatus(phase,text);}
 release(){
  this.env.clearInterval(this.interval);this.interval=null;
  const recording=this.recorder;this.recorder=null;if(recording){recording.onstop=null;recording.ondataavailable=null;if(recording.state==='recording')recording.stop();}
  this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.context?.close().catch(()=>{});this.context=null;
 }
 stop(){this.version++;this.abort?.abort();this.abort=null;this.release();this.phase='idle';}
 async start(){
  this.stop();const version=this.version;
  if(!this.allowed()){this.status('disabled','부모님 설정에서 음성인식을 켜면 이름으로도 찾을 수 있어요.');return false;}
  const env=this.env,Audio=env.AudioContext||env.webkitAudioContext;
  if(!env.navigator?.mediaDevices?.getUserMedia||!env.MediaRecorder||!Audio){this.status('error','이 브라우저에서는 그림을 눌러 골라 주세요.');return false;}
  try{
   this.status('preparing','마이크를 준비하고 있어요…');
   const stream=await env.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
   if(version!==this.version||!this.allowed()){stream.getTracks().forEach(t=>t.stop());return false;}
   this.stream=stream;const context=new Audio();this.context=context;await context.resume();
   if(version!==this.version){stream.getTracks().forEach(t=>t.stop());context.close().catch(()=>{});return false;}
   if(!this.allowed()){this.release();return false;}
   const analyser=context.createAnalyser();analyser.fftSize=512;context.createMediaStreamSource(stream).connect(analyser);
   const recorder=new env.MediaRecorder(stream),parts=[];this.recorder=recorder;let heard=false,lastSound=0;const started=Date.now(),bins=new Uint8Array(analyser.fftSize);
   recorder.ondataavailable=event=>{if(event.data?.size)parts.push(event.data);};
   recorder.onstop=async()=>{
    if(version!==this.version)return;this.release();
    if(!this.allowed())return;
    if(!heard||!parts.length){this.status('idle','이름을 말하거나 그림을 눌러 봐요. 다시 들으려면 마이크 버튼을 눌러 주세요.');return;}
    this.status('processing','동물 이름을 듣고 있어요…');
    try{
     const blob=new env.Blob(parts,{type:recorder.mimeType});
     const audio=await new Promise((resolve,reject)=>{const reader=new env.FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
     if(version!==this.version||!this.allowed())return;
     this.abort=new env.AbortController();const result=await this.post('/api/transcribe',{audio,context:'marine'},this.abort.signal);
     if(version!==this.version||!this.allowed())return;
     this.phase='idle';this.onText(typeof result.text==='string'?result.text:'');
    }catch(error){if(version===this.version)this.status('error',error.message||'이름을 잘 듣지 못했어요. 그림을 눌러도 돼요.');}
   };
   recorder.start();this.status('listening','듣고 있어요! 예: 돌고래, 문어, 바다거북');
   this.interval=env.setInterval(()=>{
    if(version!==this.version)return;
    if(!this.allowed()){this.stop();return;}
    analyser.getByteTimeDomainData(bins);const rms=Math.sqrt(bins.reduce((sum,n)=>sum+((n-128)/128)**2,0)/bins.length),now=Date.now();
    if(rms>.018){heard=true;lastSound=now;}
    if((heard&&now-lastSound>1100)||now-started>12000){env.clearInterval(this.interval);this.interval=null;if(recorder.state==='recording')recorder.stop();}
   },100);
   return true;
  }catch(error){if(version===this.version){this.release();this.status('error','마이크를 사용할 수 없어요. 그림을 눌러 고를 수 있어요.');}return false;}
 }
}
