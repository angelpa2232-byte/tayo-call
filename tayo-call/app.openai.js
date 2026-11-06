document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const audio = new Audio(); audio.autoplay = true;
  let pc, dc, mic, cam, ctx, analyser, frame, timer, abort, character;
  let generation = 0, active = false, muted = false, busy = false;
  let config = { childName: '친구', voice: 'marin', minutes: 5 };
  try { config = { ...config, ...JSON.parse(localStorage.getItem('tayo-preferences') || '{}') }; } catch {}
  const status = text => $('child-transcript').textContent = text;
  const settings = () => { $('settings-modal').classList.add('active'); $('child-name').focus(); };
  async function post(path, data, signal) {
    const res = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal });
    if(!res.ok) { const err=await res.json(); throw new Error(err.error || '연결 오류'); }
    return res;
  }
  const send = event => { if(dc?.readyState === 'open') dc.send(JSON.stringify(event)); };
  function speak(instructions) {
    if(busy || dc?.readyState !== 'open') return;
    busy=true; send({type:'response.create',response:{instructions}});
  }
  function finish(message='통화가 끝났어요. 다음에 또 만나요!') {
    generation++; active=false; abort?.abort(); clearInterval(timer); clearTimeout(connectTimer); cancelAnimationFrame(frame);
    dc?.close(); pc?.close(); dc=pc=null;
    mic?.getTracks().forEach(t=>t.stop()); cam?.getTracks().forEach(t=>t.stop()); mic=cam=null;
    $('user-webcam').srcObject=null; audio.pause(); audio.srcObject=null;
    ctx?.close().catch(()=>{}); ctx=null;
    character?.stopTalking(); character?.destroy(); character=null; busy=false; muted=false;
    $('btn-toggle-mic').classList.add('active'); $('btn-toggle-mic').querySelector('.ctrl-text').textContent='마이크';
    $('btn-accept-call').disabled=false;
    $('active-call-screen').classList.remove('active'); $('incoming-call-screen').classList.add('active');
    $('entry-status').textContent=message;
  }
  let connectTimer;
  function animate() {
    if(!active || !analyser) return;
    const bins=new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(bins);
    const level=Math.sqrt(bins.reduce((s,v)=>s+((v-128)/128)**2,0)/bins.length);
    character.setMouthState(level>0.09?'o':level>0.012?'open':'smile');
    frame=requestAnimationFrame(animate);
  }
  function onEvent(event) {
    if(!active) return;
    let e; try { e=JSON.parse(event.data); } catch { return; }
    switch(e.type) {
      case 'response.created': busy=true; $('tayo-subtitle').textContent=''; break;
      case 'response.output_audio_transcript.delta': $('tayo-subtitle').textContent+=e.delta; break;
      case 'response.output_audio_transcript.done': $('tayo-subtitle').textContent=e.transcript; break;
      case 'input_audio_buffer.speech_started': status('친구가 이야기하고 있어요 🎙️'); break;
      case 'input_audio_buffer.speech_stopped': status('타요가 생각하고 있어요…'); break;
      case 'conversation.item.input_audio_transcription.completed': status(`친구: ${e.transcript}`); break;
      case 'output_audio_buffer.started': status('타요가 이야기하고 있어요 🚌'); break;
      case 'output_audio_buffer.stopped': case 'output_audio_buffer.cleared': status(muted?'마이크가 꺼져 있어요':'편하게 이야기해주세요 🎙️'); break;
      case 'response.done': busy=false; break;
      case 'error': busy=false; status('대화에 문제가 생겼어요. 다시 통화해주세요.'); break;
    }
  }
  async function start() {
    if(active) return;
    $('btn-accept-call').disabled=true; $('entry-status').textContent='타요에게 연결하고 있어요…';
    const id=++generation;
    try {
      const info=await (await fetch('/api/status')).json(); if(id!==generation) return;
      if(!info.configured) { $('btn-accept-call').disabled=false; $('entry-status').textContent='부모님이 AI 연결을 설정해주세요.'; settings(); return; }
      active=true; abort=new AbortController();
      $('incoming-call-screen').classList.remove('active'); $('active-call-screen').classList.add('active');
      status('마이크 사용을 허용해주세요.');
      const input=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      if(id!==generation) { input.getTracks().forEach(t=>t.stop()); return; } mic=input;
      character=new TayoCharacter();
      $('webcam-fallback').style.display='flex'; $('webcam-fallback').textContent='카메라 준비 중…';
      navigator.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false}).then(camera=>{
        if(id!==generation) { camera.getTracks().forEach(t=>t.stop()); return; }
        cam=camera; $('user-webcam').srcObject=cam; $('webcam-fallback').style.display='none';
      }).catch(()=>{if(id===generation) $('webcam-fallback').textContent='카메라 없이도 통화할 수 있어요';});
      ctx=new AudioContext(); await ctx.resume(); if(id!==generation) return;
      pc=new RTCPeerConnection();
      pc.ontrack=e=>{
        if(id!==generation) return;
        const remote=e.streams[0] || new MediaStream([e.track]); audio.srcObject=remote;
        audio.play().catch(()=>status('소리 켜기 버튼을 눌러주세요.'));
        analyser=ctx.createAnalyser(); analyser.fftSize=256;
        ctx.createMediaStreamSource(remote).connect(analyser); animate();
      };
      pc.onconnectionstatechange=()=>{ if(id===generation && ['failed','disconnected'].includes(pc.connectionState)) finish('연결이 끊겼어요. 다시 통화해주세요.'); };
      mic.getAudioTracks().forEach(t=>pc.addTrack(t,mic));
      dc=pc.createDataChannel('oai-events'); dc.onmessage=onEvent;
      dc.onopen=()=>{
        if(id!==generation) return; clearTimeout(connectTimer); status('타요와 연결됐어요!');
        speak('짧게 인사해. 타요 역할의 AI 놀이 친구라고 소개하고 부모님과 함께 만난 것을 반가워해. 오늘 기분을 하나만 물어봐.');
        let seconds=0; $('call-timer').textContent='00:00'; const limit=config.minutes*60;
        timer=setInterval(()=>{ seconds++; $('call-timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; if(seconds>=limit) finish('약속한 놀이 시간이 끝났어요. 다음에 또 만나요!'); },1000);
      };
      connectTimer=setTimeout(()=>{if(id===generation) finish('연결 시간이 오래 걸려요. 인터넷을 확인한 후 다시 받아주세요.');},35000);
      status('실시간 AI 음성 연결 중…');
      const offer=await pc.createOffer(); if(id!==generation) return;
      await pc.setLocalDescription(offer); if(id!==generation) return;
      const result=await post('/api/session',{sdp:offer.sdp,childName:config.childName,voice:config.voice},abort.signal);
      const answer=await result.text(); if(id!==generation) return;
      await pc.setRemoteDescription({type:'answer',sdp:answer});
    } catch(error) {
      if(id!==generation) return;
      finish(error.name==='NotAllowedError'?'마이크 사용을 허용한 후 다시 받아주세요.':error.name==='NotFoundError'?'연결된 마이크를 찾을 수 없어요.':error.message);
    }
  }
  $('child-name').value=config.childName; $('voice-select').value=config.voice; $('call-limit').value=config.minutes;
  $('btn-accept-call').onclick=start; $('btn-end-call').onclick=()=>finish();
  $('btn-parent-settings').onclick=settings; $('btn-open-settings').onclick=settings;
  $('btn-close-settings').onclick=()=>$('settings-modal').classList.remove('active');
  $('btn-save-settings').onclick=async()=>{
    const btn=$('btn-save-settings'); btn.disabled=true;
    try {
      const key=$('llm-api-key').value.trim(); if(key) await post('/api/settings',{apiKey:key});
      config={childName:$('child-name').value.trim().slice(0,20)||'친구',voice:$('voice-select').value,minutes:Number($('call-limit').value)};
      localStorage.setItem('tayo-preferences',JSON.stringify(config)); $('llm-api-key').value=''; $('settings-status').textContent='';
      $('settings-modal').classList.remove('active'); $('entry-status').textContent='준비됐어요. 초록색 버튼을 눌러주세요!';
      if(active) status('설정은 다음 통화부터 적용돼요.');
    } catch(error) { $('settings-status').textContent=error.message; } finally { btn.disabled=false; }
  };
  $('btn-toggle-mic').onclick=()=>{
    if(!mic) return; muted=!muted; mic.getAudioTracks().forEach(t=>t.enabled=!muted);
    $('btn-toggle-mic').classList.toggle('active',!muted); $('btn-toggle-mic').setAttribute('aria-pressed',String(!muted));
    $('btn-toggle-mic').querySelector('.ctrl-text').textContent=muted?'마이크 꺼짐':'마이크';
    status(muted?'마이크가 꺼져 있어요':'편하게 이야기해주세요 🎙️'); if(muted) send({type:'input_audio_buffer.clear'});
  };
  $('btn-tayo-talk').onclick=()=>speak('색깔이나 동물에 관한 짧고 쉬운 놀이 질문을 하나 해줘.');
  $('btn-audio-resume').onclick=()=>{audio.play().catch(()=>status('스피커 출력을 확인해주세요.'));ctx?.resume();};
  $('btn-sound-effect').onclick=()=>{
    if(!ctx) return; ctx.resume(); character?.honkHorn();
    const osc=ctx.createOscillator(),gain=ctx.createGain(); osc.frequency.value=350;
    gain.gain.setValueAtTime(0.08,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.4);
  };
  window.addEventListener('pagehide',()=>finish());
});
