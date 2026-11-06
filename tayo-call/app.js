document.addEventListener('DOMContentLoaded',()=>{
  const $=id=>document.getElementById(id), synth=window.speechSynthesis;
  let active=false,busy=false,muted=false,generation=0,stream,cam,ctx,analyser,recorder,character,abort,timer,vadTimer,restartTimer;
  let actorId='tayo',musicActive=false,turnVersion=0,gameActive=false,miniGames,vehicleLibrary,marineLibrary,savedGameActor='tayo';
  const songPlayer=window.SongPlayer?new window.SongPlayer():null;
  const catalog=window.CharacterCatalog;
  const actorName=()=>catalog?.getCharacter(actorId)?.name||'타요';
  const appChannel=window.BroadcastChannel?new window.BroadcastChannel('tayo-call-lifecycle'):null;
  if(appChannel)appChannel.onmessage=event=>{if(event.data==='shutdown'){finish('다른 화면에서 프로그램을 완전히 종료했습니다.');$('btn-accept-call').disabled=true;$('settings-modal').classList.remove('active');window.close?.();}};
  function setActor(id){actorId=id;const actor=catalog?.getCharacter(id);if(!actor)return;character?.setCharacter?.(id);document.querySelector('.status-name').textContent=actor.name+' · AI 놀이';document.querySelectorAll('[data-cast]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cast===id)));}
  function renderScene(state,waiting=false){displayedStory=state;const gameButton=$('btn-scene-game');if(gameButton){const event=window.PlayEvents?.eventById?.(state.event);const gameId=event?.variant==='snack'?'fruit':({passengers:'count',training:'colors',delivery:'gifts',balloon:'balloon',repair:'tire',wash:'wash',night:'stars',detour:'bridge',picnic:'flower',equipment:'shapes'})[state.scene];gameButton.hidden=state.mode!=='event'||!gameId;if(gameButton.dataset)gameButton.dataset.game=gameId||'';gameButton.textContent=({count:'🎮 친구들을 직접 태워볼까?',colors:'🎮 네가 물대포를 쏴볼까?',gifts:'🎮 같은 선물을 찾아볼까?',fruit:'🎮 과일을 나눠 담아볼까?',balloon:'🎮 풍선을 키워볼까?',tire:'🎮 타이어에 바람을 넣어볼까?',wash:'🎮 먼지를 직접 닦아볼까?',stars:'🎮 별을 모아볼까?',bridge:'🎮 다리를 만들어볼까?',flower:'🎮 꽃을 키워볼까?',shapes:'🎮 같은 모양을 찾아볼까?'})[gameId]||'🎮 같이 놀기';}$('scene-art').classList.toggle('scene-waiting',waiting);const visuals=window.SceneVisuals;if(!visuals)return;const view=visuals.sceneView(state);$('tayo-character-wrapper').classList.toggle('mission-portrait',Boolean(view.mission));$('scene-art').innerHTML=visuals.sceneSvg(view);$('scene-caption').textContent=view.title;$('scene-choices').textContent='';document.querySelector('.scenery-background').style.display='none';for(const [label,text] of (config.speechRecognition?view.choices:[])){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>reply(text);$('scene-choices').append(b);}character?.stage?.classList.toggle('rolling',view.scene==='rescue'&&view.step===0);}
  function switchActor(id){
    if(!active){if(catalog&&new URLSearchParams(window.location.search).has('preview')){setActor(id);renderScene({scene:'daily',mode:'chat',step:0});}return;}
    // A cast button interrupts the current turn without ending the call or camera.
    turnVersion++;busy=true;abort?.abort();ttsAbort?.abort();clearTimeout(sceneTimer);clearTimeout(leadTimer);clearTimeout(restartTimer);stopRecording();heard=false;
    songPlayer?.stop();musicActive=false;
    if(ttsAudio){ttsAudio.onended=null;ttsAudio.onerror=null;ttsAudio.pause();ttsAudio=null;}if(ttsUrl)URL.revokeObjectURL(ttsUrl);ttsUrl=null;
    cancelAnimationFrame(lipFrame);synth?.cancel();character?.stopTalking();
    setActor(id);history=[];recentPlays=[];story={actor:id,mode:'chat',scene:'daily',step:0,round:0,turns:0};renderScene(story);busy=false;
    const greeting=catalog.characterGreeting?.(id)||('안녕! 나 '+catalog.getCharacter(id).name+'야! 우리 같이 놀자!');history=[{role:'assistant',content:greeting}];talk(greeting);
  }
  let ttsAudio,ttsUrl,ttsAbort,lipFrame;
  let leadTimer,sceneTimer,displayedStory,quietPrompts=0,recentPlays=[],story={actor:'tayo',mode:'chat',scene:'daily',step:0,round:0,turns:0};
  let recordingStart=0,lastSound=0,heard=false,history=[],voices=[],lastReply='';
  let config={speechRecognition:false,aiStories:true,childName:'친구',minutes:5,voice:'',engine:'supertonic',ttsVoice:'M3',voiceRevision:'',model:'qwen3:4b-instruct-2507-q4_K_M',modelRevision:'fast-4b-v2'};
  try {config={...config,...JSON.parse(localStorage.getItem('tayo-local-preferences')||'{}')};}catch{}
  try{if(JSON.parse(localStorage.getItem('tayo-local-preferences')||'{}').modelRevision!=='fast-4b-v2'){config.model='qwen3:4b-instruct-2507-q4_K_M';config.modelRevision='fast-4b-v2';}}catch{}
  const status=text=>$('child-transcript').textContent=text;
  function loadVoices(){
    voices=(synth?.getVoices()||[]).filter(v=>v.localService && v.lang.toLowerCase().startsWith('ko'));
    const select=$('voice-select');select.textContent='';
    for(const voice of voices){const option=document.createElement('option');option.value=voice.name;option.textContent=voice.name;select.append(option);}
    if(!voices.length){const option=document.createElement('option');option.value='';option.textContent='한국어 오프라인 목소리 없음 (자막 사용)';select.append(option);}
    select.value=voices.some(v=>v.name===config.voice)?config.voice:(voices[0]?.name||'');
  }
  loadVoices();if(synth)synth.onvoiceschanged=loadVoices;
  const settings=()=>{clearTimeout(sceneTimer);clearTimeout(leadTimer);$('scene-art').classList.add('scene-suspended');$('settings-modal').classList.add('active');$('child-name').focus();};
  async function post(path,data,signal){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal});const json=await r.json();if(!r.ok)throw new Error(json.error);return json;}
  function scheduleAutoplay(){
    clearTimeout(sceneTimer);clearTimeout(leadTimer);
    if(!active||gameActive||config.speechRecognition||musicActive)return;
    const id=generation;status('5초 동안 편하게 대답해요 · 음성인식은 꺼져 있어요');
    sceneTimer=setTimeout(()=>{
      if(!active||id!==generation||config.speechRecognition||musicActive)return;
      if(busy||document.hidden||$('settings-modal').classList.contains('active')){scheduleAutoplay();return;}
      reply('[상황극 자동 진행 신호: 아이의 발언이 아님]','auto');
    },5000);
  }
  function scheduleScene(){
    clearTimeout(sceneTimer);
    if(!active||gameActive||muted||musicActive||displayedStory?.mode!=='event'||displayedStory.step>=3||story.mode!=='event')return;
    const id=generation;
    sceneTimer=setTimeout(()=>{
      if(!active||muted||id!==generation)return;
      if(busy||heard||document.hidden||$('settings-modal').classList.contains('active')){scheduleScene();return;}
      reply('[장면 진행 신호: 다음 행동을 보여줘. 아이의 말이 아님]','scene');
    },3000);
  }
    function scheduleLead(){
    clearTimeout(leadTimer);
    if(!config.speechRecognition){scheduleAutoplay();return;}
    if(displayedStory?.mode==='event'&&displayedStory.step<3){scheduleScene();return;}
    if(!active||gameActive||muted||musicActive)return;
    const id=generation;
    leadTimer=setTimeout(()=>{
      if(!active||id!==generation||muted)return;
      if(busy||heard||document.hidden||$('settings-modal').classList.contains('active')){scheduleLead();return;}
      quietPrompts++;
      reply('[프로그램 진행 신호: 잠깐 조용함]','idle');
    },quietPrompts===0?9000:quietPrompts===1?12000:16000);
  }
  function stopRecording(){clearInterval(vadTimer);if(recorder?.state==='recording')recorder.stop();}
  function finish(message='통화가 끝났어요. 다음에 또 만나요!'){
    miniGames?.close(false);vehicleLibrary?.close(false);marineLibrary?.close(false);gameActive=false;
    musicActive=false;songPlayer?.stop();active=false;$('scene-art').classList.remove('scene-waiting','scene-suspended');generation++;turnVersion++;abort?.abort();clearTimeout(sceneTimer);clearTimeout(leadTimer);clearInterval(timer);clearTimeout(restartTimer);stopRecording();
    ttsAbort?.abort();ttsAudio?.pause();if(ttsUrl)URL.revokeObjectURL(ttsUrl);ttsAudio=null;ttsUrl=null;cancelAnimationFrame(lipFrame);synth?.cancel();stream?.getTracks().forEach(t=>t.stop());cam?.getTracks().forEach(t=>t.stop());stream=cam=null;
    ctx?.close().catch(()=>{});ctx=null;character?.stopTalking();character?.destroy();character=null;
    $('user-webcam').srcObject=null;busy=false;muted=false;history=[];
    $('btn-accept-call').disabled=false;$('btn-toggle-mic').classList.add('active');$('btn-toggle-mic').querySelector('.ctrl-text').textContent='마이크';
    $('active-call-screen').classList.remove('active');$('incoming-call-screen').classList.add('active');$('entry-status').textContent=message;
  }
  async function exitApp(){
    finish('프로그램 완전 종료 중…');$('settings-modal').classList.remove('active');$('btn-accept-call').disabled=true;
    $('btn-exit-entry').disabled=true;$('btn-exit-app').disabled=true;
    try {
      await post('/api/shutdown',{});appChannel?.postMessage('shutdown');
      let stopped=false;
      for(let attempt=0;attempt<30;attempt++){
        await new Promise(resolve=>setTimeout(resolve,500));
        try{await fetch('/api/status',{signal:AbortSignal.timeout(1000)});}catch{stopped=true;break;}
      }
      if(!stopped)throw new Error('종료 처리가 지연되고 있어요. 잠시 후 완전 종료를 다시 눌러주세요.');
      $('entry-status').textContent='프로그램과 서버를 종료했습니다. 다시 실행하려면 시작 파일을 눌러주세요.';
      if($('provider-status'))$('provider-status').textContent='프로그램 종료됨 · 이 탭을 닫아도 됩니다.';
      window.close?.();
    }catch(error){$('entry-status').textContent=error.message||'완전 종료 요청에 실패했어요.';$('btn-exit-entry').disabled=false;$('btn-exit-app').disabled=false;}
  }
  function listen(){
    if(!active||gameActive||!config.speechRecognition||busy||muted||!stream||!ctx||recorder?.state==='recording')return;
    stream.getAudioTracks().forEach(t=>t.enabled=true);
    const id=generation,version=turnVersion,chunks=[];heard=false;lastSound=0;recordingStart=Date.now();
    const current=new MediaRecorder(stream);recorder=current;
    current.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    current.onstop=async()=>{
      clearInterval(vadTimer);
      if(!active||!config.speechRecognition||id!==generation||version!==turnVersion||muted||busy)return;
      if(!heard){restartTimer=setTimeout(listen,100);return;}
      busy=true;status('친구 말을 듣고 있어요…');
      stream.getAudioTracks().forEach(t=>t.enabled=false);
      try{
        const blob=new Blob(chunks,{type:current.mimeType});
        const audio=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
        if(!active||id!==generation||version!==turnVersion)return;
        abort=new AbortController();const result=await post('/api/transcribe',{audio},abort.signal);
        if(!active||!config.speechRecognition||id!==generation||version!==turnVersion)return;
        if(!result.text){busy=false;heard=false;status('잘 못 들었어. 한 번 더 말해줄래?');restartTimer=setTimeout(listen,500);scheduleLead();return;}
        busy=false;await reply(result.text);
      }catch(error){if(active&&id===generation&&version===turnVersion){busy=false;status(error.message);restartTimer=setTimeout(listen,1500);}}
    };
    current.start();status(actorName()+'가 친구 목소리를 듣고 있어요 🎙️');
    const bins=new Uint8Array(analyser.fftSize);
    vadTimer=setInterval(()=>{
      if(!active||id!==generation||version!==turnVersion){stopRecording();return;}
      analyser.getByteTimeDomainData(bins);
      const rms=Math.sqrt(bins.reduce((s,v)=>s+((v-128)/128)**2,0)/bins.length),now=Date.now();
      if(rms>0.025){clearTimeout(leadTimer);heard=true;lastSound=now;}
      if((heard&&now-lastSound>1100)||(now-recordingStart>20000)){clearInterval(vadTimer);if(current.state==='recording')current.stop();}
    },100);
  }
  function beginSong(id){
    if(!active||!songPlayer)return;musicActive=true;busy=true;heard=false;clearTimeout(sceneTimer);clearTimeout(leadTimer);clearTimeout(restartTimer);stopRecording();stream?.getAudioTracks().forEach(t=>t.enabled=false);
    status('노래를 듣는 동안 마이크는 잠시 쉬어요 🎵');
    songPlayer.play(id,reason=>{musicActive=false;if(!active)return;busy=false;talk(reason==='ended'?'노래 끝! 손뼉 짝짝! 이제 우리 놀이를 이어 가자!':'좋아! 우리 놀이를 이어 가자!');});
  }
  function startSceneMotion(){$('scene-art').classList.remove('scene-waiting');}
  function talk(text,after){
    if(!active)return;lastReply=text;character?.react?.(text);$('tayo-subtitle').textContent=text;stopRecording();stream?.getAudioTracks().forEach(t=>t.enabled=false);busy=true;
    const id=generation,version=turnVersion,voice=voices.find(v=>v.name===config.voice)||voices[0];
    const done=()=>{if(!active||id!==generation||version!==turnVersion)return;cancelAnimationFrame(lipFrame);ttsAudio?.pause();ttsAudio=null;if(ttsUrl)URL.revokeObjectURL(ttsUrl);ttsUrl=null;if(active&&id===generation&&version===turnVersion){startSceneMotion();character?.stopTalking();busy=false;heard=false;if(after){after();return;}restartTimer=setTimeout(listen,350);scheduleLead();}};
    function windowsVoice(){
      if(!synth||!voice){startSceneMotion();status('한국어 목소리가 없어 자막으로 표시해요.');restartTimer=setTimeout(done,2500);return;}
      const utterance=new SpeechSynthesisUtterance(text);utterance.lang='ko-KR';utterance.voice=voice;utterance.rate=actorId==='rogi'?1.3:actorId==='frank'?1.2:1.26;utterance.pitch=({tayo:1.28,rogi:1.38,lani:1.42,gani:1.16,frank:1.02,pat:1.1})[actorId];
      utterance.onstart=()=>{if(active&&id===generation&&version===turnVersion){startSceneMotion();character?.startTalking();status(actorName()+'가 이야기하고 있어요 🚌');}};
      utterance.onend=done;utterance.onerror=done;synth.cancel();synth.speak(utterance);
    }
    if(config.engine==='windows'){windowsVoice();return;}
    (async()=>{
      try{
        status(actorName()+' 목소리를 준비하고 있어요…');ttsAbort=new AbortController();
        let res;
        const voiceRequest={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,engine:config.engine,actor:actorId,voice:actorId==='tayo'?config.ttsVoice:catalog.getCharacter(actorId).voice}),signal:ttsAbort.signal};
        for(let attempt=0;attempt<5;attempt++){
          res=await fetch('/api/tts',voiceRequest);if(res.status!==429||attempt===4)break;
          await new Promise(resolve=>setTimeout(resolve,150*(attempt+1)));
          if(!active||id!==generation||version!==turnVersion)return;
        }
        if(!res.ok){const failure=await res.json().catch(()=>({}));throw new Error(failure.error||'음성을 만들지 못했어요.');}const blob=await res.blob();
        if(!active||id!==generation||version!==turnVersion)return;
        ttsUrl=URL.createObjectURL(blob);ttsAudio=new Audio(ttsUrl);ttsAudio.playbackRate=config.engine==='openai'?1:1.08;ttsAudio.preservesPitch=config.engine==='openai';ttsAudio.onended=done;
        ttsAudio.onerror=()=>{if(active&&id===generation&&version===turnVersion){status('음성 재생 오류로 Windows 목소리를 사용해요.');windowsVoice();}};
        if(!ctx)ctx=new AudioContext();await ctx.resume();if(!active||id!==generation||version!==turnVersion)return;
        const meter=ctx.createAnalyser();meter.fftSize=256;
        const source=ctx.createMediaElementSource(ttsAudio);source.connect(meter);meter.connect(ctx.destination);
        const bins=new Uint8Array(meter.fftSize);
        const lips=()=>{if(!active||id!==generation||version!==turnVersion)return;meter.getByteTimeDomainData(bins);const level=Math.sqrt(bins.reduce((s,v)=>s+((v-128)/128)**2,0)/bins.length);character?.setMouthState(level>0.08?'o':level>0.01?'open':'smile');lipFrame=requestAnimationFrame(lips);};
        await ttsAudio.play();if(!active||id!==generation||version!==turnVersion)return;startSceneMotion();status(actorName()+'가 이야기하고 있어요 🚌');lips();
      }catch(error){if(active&&id===generation&&version===turnVersion){status(error.message+' Windows 예비 목소리로 읽어요.');windowsVoice();}}
    })();
  }
  async function reply(text,kind='child'){
    if(!active||gameActive||busy)return;clearTimeout(sceneTimer);clearTimeout(leadTimer);if(kind==='child'){quietPrompts=0;const requested=catalog?.requestedCharacter(text);if(requested){setActor(requested);history=[];story={actor:requested,mode:'chat',scene:'daily',step:0,round:0,turns:0};renderScene(story);}}const id=generation,version=turnVersion;busy=true;stopRecording();stream?.getAudioTracks().forEach(t=>t.enabled=false);
    if(kind==='child'){$('last-utterance').textContent=`인식된 말: ${text}`;status(`친구: ${text}`);}else status(actorName()+'가 다음 놀이를 준비하고 있어요…');$('tayo-subtitle').textContent=actorName()+'가 생각하고 있어요…';abort=new AbortController();
    try{const data=await post('/api/chat',{text,history,model:config.model,story,kind,actor:actorId,autoplay:!config.speechRecognition&&kind==='auto',aiStories:config.aiStories,recentPlays},abort.signal);if(!active||id!==generation||version!==turnVersion)return;
      if(data.actor&&data.actor!==actorId)setActor(data.actor);renderScene(data.visual||story,true);story=data.story||story;if(data.playTitle&&recentPlays.at(-1)!==data.playTitle)recentPlays=[...recentPlays,data.playTitle].slice(-5);if(data.autoplay)$('last-utterance').textContent=data.notice||((data.playSource==='ai'?'AI 새 상황극 · ':'준비된 상황극 · ')+data.playTitle+' · 음성인식 꺼짐');history=[...history,...(kind==='child'?[{role:'user',content:text}]:[]),{role:'assistant',content:data.reply}].slice(-12);talk(data.reply,data.music?()=>beginSong(data.music):undefined);
    }catch(error){if(active&&id===generation&&version===turnVersion){busy=false;status(error.message);if(config.speechRecognition)restartTimer=setTimeout(listen,1200);else scheduleAutoplay();}}
  }
  function updatePlayMode(){
    $('btn-toggle-mic').disabled=!config.speechRecognition;$('btn-toggle-mic').classList.toggle('active',config.speechRecognition&&!muted);
    $('btn-toggle-mic').querySelector('.ctrl-text').textContent=config.speechRecognition?(muted?'마이크 꺼짐':'마이크'):'음성인식 꺼짐';
    $('text-input').placeholder=config.speechRecognition?'부모님 글자 입력 (음성인식 대체)':'부모님 입력 · 캐릭터 변경 등';
  }
  function updateVoiceMode(){const engine=$('tts-engine').value;const local=engine==='supertonic';$('tts-voice').disabled=!local;if($('voice-mode-help'))$('voice-mode-help').textContent=engine==='openai'?'유료 음성 · 저장된 OpenAI API 키 사용 · 캐릭터별 목소리와 억양이 바뀝니다. 대화 AI 요금과 별도로 음성 요금이 발생합니다.':engine==='windows'?'무료 음성 · Windows 한국어 목소리를 사용합니다. 음성 API를 호출하지 않습니다.':'무료 음성 · 이 PC에서 목소리를 만듭니다. 음성 API를 호출하지 않습니다. OpenAI로 대화해도 목소리는 무료로 사용할 수 있습니다.';}

  function updateModelMode(){const online=$('chat-provider')?.value==='openai';$('model-select').disabled=online;if($('model-mode-help'))$('model-mode-help').textContent=online?'OpenAI에서는 GPT-5.4 mini를 사용합니다. 아래 로컬 모델 선택은 적용되지 않습니다.':'Ollama 무료 로컬 대화에 사용할 모델을 선택하세요.';}
  async function check(){
    const r=await fetch('/api/status');const info=await r.json();
    info.configured=info.provider==='openai'?info.apiConfigured:(info.models?.includes(config.model)||false);
    const modeLabel=info.provider==='openai'?'OpenAI API 대화 · 유료':'Ollama 로컬 대화 · API 사용 안 함';if($('provider-status'))$('provider-status').textContent=modeLabel;if($('active-provider-status'))$('active-provider-status').textContent=modeLabel;
    if($('chat-provider'))$('chat-provider').value=info.provider||'ollama';updateModelMode();if($('api-key-status'))$('api-key-status').textContent=info.apiConfigured?'API 키 저장됨 · 변경할 때만 새 키를 입력하세요.':'아직 API 키를 저장하지 않았어요.';
    $('setup-status').textContent=info.provider==='openai'?(info.apiConfigured?'OpenAI 대화 준비됨 · '+info.apiModel+' · API 사용료 발생':'부모님 설정에서 API 키를 저장해주세요.'):!info.connected?'Ollama가 실행되지 않았어요. Ollama_준비.bat를 실행해주세요.':!info.configured?'선택한 대화 모델을 다운로드해주세요.':!info.stt?'대화 AI 준비됨 · 음성인식 설치 필요 (글자 대화 가능)':'Ollama와 로컬 음성인식 준비 완료';
    return info;
  }
  async function start(){
    if(active)return;$('btn-accept-call').disabled=true;const id=++generation;
    try{const info=await check();if(id!==generation)return;
      if(!info.configured&&config.speechRecognition){$('entry-status').textContent=$('setup-status').textContent;$('btn-accept-call').disabled=false;settings();return;}
      active=true;busy=false;history=[];quietPrompts=0;recentPlays=[];updatePlayMode();story={actor:'tayo',mode:'chat',scene:'daily',step:0,round:0,turns:0};$('last-utterance').textContent=config.speechRecognition?'인식된 말: 아직 없어요':'음성인식 꺼짐 · 응답을 녹음하지 않고 상황극을 이어가요';character=new TayoCharacter();setActor('tayo');renderScene(story);$('incoming-call-screen').classList.remove('active');$('active-call-screen').classList.add('active');
      $('webcam-fallback').style.display='flex';$('webcam-fallback').textContent='카메라 준비 중…';
      navigator.mediaDevices.getUserMedia({video:{width:320,height:240},audio:false}).then(s=>{if(id!==generation){s.getTracks().forEach(t=>t.stop());return;}cam=s;$('user-webcam').srcObject=s;$('webcam-fallback').style.display='none';}).catch(()=>{if(id===generation)$('webcam-fallback').textContent='카메라 없이 통화 중';});
      if(config.speechRecognition && info.stt && window.MediaRecorder){try{
        const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
        if(id!==generation){s.getTracks().forEach(t=>t.stop());return;}stream=s;ctx=new AudioContext();await ctx.resume();if(id!==generation)return;
        analyser=ctx.createAnalyser();analyser.fftSize=512;ctx.createMediaStreamSource(s).connect(analyser);
      }catch{status('마이크를 사용할 수 없어요. 아래에 글자로 입력해주세요.');}}
      let seconds=0;$('call-timer').textContent='00:00';const limit=config.minutes*60;
      timer=setInterval(()=>{seconds++;$('call-timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;if(seconds>=limit)finish('약속한 놀이 시간이 끝났어요. 다음에 또 만나요!');},1000);
      const greeting=config.speechRecognition?`안녕, ${config.childName}! 빵빵, 타요 놀이 시작하자! 누구랑 얘기하고 싶어? 타요, 프랭크, 로기 중에 골라줘!`:`안녕, ${config.childName}! 빵빵! 나랑 상상 놀이 하자. 너는 소리나 손짓으로 함께해 줘!`;history=[{role:'assistant',content:greeting}];talk(greeting);
    }catch(error){if(id===generation)finish(error.message);}
  }
  $('speech-recognition').value=config.speechRecognition?'on':'off';$('ai-stories').value=config.aiStories?'on':'off';updatePlayMode();
  $('tts-engine').value=config.engine;$('tts-voice').value=config.ttsVoice;$('model-select').value=config.model;$('child-name').value=config.childName;$('call-limit').value=config.minutes;
  $('btn-exit-entry').onclick=exitApp;$('btn-exit-app').onclick=exitApp;
  $('btn-accept-call').onclick=start;$('btn-end-call').onclick=()=>finish();$('btn-parent-settings').onclick=settings;$('btn-open-settings').onclick=settings;
  $('btn-close-settings').onclick=()=>{$('settings-modal').classList.remove('active');$('scene-art').classList.toggle('scene-suspended',muted);scheduleLead();};
  if($('chat-provider'))$('chat-provider').onchange=updateModelMode;updateModelMode();
  $('tts-engine').onchange=updateVoiceMode;updateVoiceMode();
  $('btn-check-ollama').onclick=()=>check().catch(()=>{$('setup-status').textContent='서버 연결을 확인해주세요.';});
  $('btn-save-settings').onclick=async()=>{const save=$('btn-save-settings');save.disabled=true;$('settings-status').textContent='연결 확인 후 저장하고 있어요…';try{const provider=$('chat-provider')?.value||'ollama';const key=$('openai-key')?.value||'';const saved=await post('/api/settings',{provider,key,engine:$('tts-engine').value});$('settings-status').textContent=saved.provider==='openai'?'OpenAI API로 저장했습니다.':'Ollama 로컬 대화로 저장했습니다.';if($('openai-key'))$('openai-key').value='';const wasRecognition=config.speechRecognition;config={speechRecognition:$('speech-recognition').value==='on',aiStories:$('ai-stories').value==='on',childName:$('child-name').value.trim().slice(0,20)||'친구',minutes:Number($('call-limit').value),voice:$('voice-select').value,engine:$('tts-engine').value,voiceRevision:'character-openai-v1',ttsVoice:$('tts-voice').value,model:$('model-select').value,modelRevision:'fast-4b-v2'};localStorage.setItem('tayo-local-preferences',JSON.stringify(config));updatePlayMode();if(active&&wasRecognition!==config.speechRecognition){heard=false;stopRecording();stream?.getTracks().forEach(t=>t.stop());stream=null;muted=false;if(config.speechRecognition){try{const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});if(!active||!config.speechRecognition)s.getTracks().forEach(t=>t.stop());else{stream=s;if(!ctx)ctx=new AudioContext();await ctx.resume();analyser=ctx.createAnalyser();analyser.fftSize=512;ctx.createMediaStreamSource(s).connect(analyser);listen();}}catch{status('마이크를 사용할 수 없어요. 부모님 글자 입력으로 대화할 수 있어요.');}}updatePlayMode();}$('settings-modal').classList.remove('active');$('scene-art').classList.toggle('scene-suspended',muted);scheduleLead();await check();}catch(error){$('settings-status').textContent=error.message;}finally{save.disabled=false;}};
  $('btn-toggle-mic').onclick=()=>{if(!config.speechRecognition)return;if(!stream){status('로컬 음성인식을 설치하고 마이크를 허용해주세요.');return;}muted=!muted;$('scene-art').classList.toggle('scene-suspended',muted);stream.getAudioTracks().forEach(t=>t.enabled=!muted&&!busy);$('btn-toggle-mic').classList.toggle('active',!muted);$('btn-toggle-mic').querySelector('.ctrl-text').textContent=muted?'마이크 꺼짐':'마이크';if(muted){clearTimeout(sceneTimer);clearTimeout(leadTimer);stopRecording();status('마이크가 꺼져 있어요');}else {listen();scheduleLead();}};
  function interruptForGame(){
    turnVersion++;abort?.abort();ttsAbort?.abort();clearTimeout(sceneTimer);clearTimeout(leadTimer);clearTimeout(restartTimer);stopRecording();heard=false;
    stream?.getAudioTracks().forEach(t=>t.enabled=false);synth?.cancel();
    if(ttsAudio){ttsAudio.onended=null;ttsAudio.onerror=null;ttsAudio.pause();ttsAudio=null;}
    if(ttsUrl)URL.revokeObjectURL(ttsUrl);ttsUrl=null;cancelAnimationFrame(lipFrame);character?.stopTalking();busy=false;
  }
  const activityCallbacks={
    onEnter(){if(!gameActive)savedGameActor=actorId;gameActive=true;interruptForGame();songPlayer?.stop();musicActive=false;$('scene-art').classList.add('scene-suspended');},
    onSpeak(text,actor,after){interruptForGame();const version=turnVersion;const done=()=>{if(gameActive&&version===turnVersion)after?.();};if(active){setActor(actor);talk(text,done);}else if(synth&&typeof SpeechSynthesisUtterance!=='undefined'){const voice=new SpeechSynthesisUtterance(text);voice.lang='ko-KR';voice.voice=voices[0]||null;voice.rate=1.2;voice.pitch=1.28;voice.onend=done;voice.onerror=done;synth.speak(voice);}else done();},
    onLeave(){interruptForGame();gameActive=false;if(active){setActor(savedGameActor);renderScene(displayedStory||story);$('scene-art').classList.toggle('scene-suspended',muted);listen();scheduleLead();}}
  };
  if(window.MiniGames)miniGames=new window.MiniGames({...activityCallbacks,onEnter(){vehicleLibrary?.close(false);marineLibrary?.close(false);activityCallbacks.onEnter();}});
  if(window.VehicleLibrary)vehicleLibrary=new window.VehicleLibrary({...activityCallbacks,onEnter(){miniGames?.close(false);marineLibrary?.close(false);activityCallbacks.onEnter();}});
  if(window.MarineLibrary)marineLibrary=new window.MarineLibrary({...activityCallbacks,canListen:()=>config.speechRecognition,onQuiet:interruptForGame,post,onEnter(){miniGames?.close(false);vehicleLibrary?.close(false);activityCallbacks.onEnter();}});
  if($('btn-marine-entry'))$('btn-marine-entry').onclick=()=>marineLibrary?.open();
  if($('btn-marine'))$('btn-marine').onclick=()=>marineLibrary?.open();
  if($('btn-vehicles-entry'))$('btn-vehicles-entry').onclick=()=>vehicleLibrary?.open();
  if($('btn-vehicles'))$('btn-vehicles').onclick=()=>vehicleLibrary?.open();
  if($('btn-mini-games-entry'))$('btn-mini-games-entry').onclick=()=>miniGames?.open();
  if($('btn-mini-games'))$('btn-mini-games').onclick=()=>miniGames?.open();
  if($('btn-scene-game'))$('btn-scene-game').onclick=()=>miniGames?.open($('btn-scene-game').dataset.game);
  $('btn-song').onclick=()=>reply('노래 틀어줘');
  $('btn-tayo-talk').onclick=()=>reply('[프로그램 진행 신호: 아이에게 놀이를 제안해줘.]',config.speechRecognition?'idle':'auto');
  $('btn-audio-resume').onclick=()=>{if(!busy&&lastReply)talk(lastReply);};
  $('text-form').onsubmit=e=>{e.preventDefault();const value=$('text-input').value.trim();if(!value||busy||!active)return;$('text-input').value='';reply(value);};
  $('btn-sound-effect').onclick=()=>{if(!ctx)return;character?.honkHorn();const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=350;g.gain.setValueAtTime(0.08,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.4);};
  if(catalog){for(const actor of Object.values(catalog.CHARACTERS)){const button=document.createElement('button');button.type='button';button.dataset.cast=actor.id;button.innerHTML=`<img src="assets/characters/${actor.id}.png" alt=""> ${actor.name}`;button.setAttribute('aria-pressed',String(actor.id==='tayo'));button.onclick=()=>switchActor(actor.id);$('cast-picker').append(button);}}
  if(catalog){const preview=new URLSearchParams(window.location.search).get('preview');if(catalog.CHARACTERS[preview]){character=new TayoCharacter();setActor(preview);const params=new URLSearchParams(window.location.search),event=window.PlayEvents?.eventById(params.get('event')),step=Math.max(0,Math.min(3,Number(params.get('step')||0)));renderScene(event?.id.startsWith(preview+'-')?{actor:preview,mode:'event',scene:event.visual,event:event.id,step}:{scene:catalog.getCharacter(preview).scene,step});$('incoming-call-screen').classList.remove('active');$('active-call-screen').classList.add('active');$('tayo-subtitle').textContent='캐릭터 미리보기 · 마이크와 카메라는 사용하지 않아요';status('이름 버튼을 눌러 그림을 비교해보세요.');}}
  if(typeof fetch==='function')check().catch(()=>{if($('provider-status'))$('provider-status').textContent='서버 연결을 확인해주세요.';});
  window.addEventListener('pagehide',()=>finish());
});









