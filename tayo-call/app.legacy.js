/**
 * app.js: 타요 화상채팅 메인 컨트롤러
 * - 웹캠(PIP) 연결
 * - Web Speech API (STT 음성인식 + TTS 음성합성)
 * - 30개월 유아 특화 대화 엔진
 * - Web Audio API 벨소리 & 경적 사운드
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. DOM 요소
  const incomingScreen = document.getElementById('incoming-call-screen');
  const activeCallScreen = document.getElementById('active-call-screen');
  const btnAcceptCall = document.getElementById('btn-accept-call');
  const btnEndCall = document.getElementById('btn-end-call');
  const btnSoundEffect = document.getElementById('btn-sound-effect');
  const btnTayoTalk = document.getElementById('btn-tayo-talk');
  const btnToggleMic = document.getElementById('btn-toggle-mic');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const settingsModal = document.getElementById('settings-modal');

  const userWebcam = document.getElementById('user-webcam');
  const webcamFallback = document.getElementById('webcam-fallback');
  const tayoSubtitle = document.getElementById('tayo-subtitle');
  const childTranscript = document.getElementById('child-transcript');
  const callTimer = document.getElementById('call-timer');

  const childNameInput = document.getElementById('child-name');
  const voiceSelect = document.getElementById('voice-select');
  const voicePitchInput = document.getElementById('voice-pitch');
  const pitchValText = document.getElementById('pitch-val');
  const llmApiKeyInput = document.getElementById('llm-api-key');

  // 상태 변수
  let tayo = null;
  let audioCtx = null;
  let ringtoneTimer = null;
  let callDurationTimer = null;
  let callSeconds = 0;
  let mediaStream = null;
  let recognition = null;
  let isListening = false;
  let idlePromptTimer = null;
  let isCallActive = false;

  // 설정
  const config = {
    childName: '친구',
    pitch: 1.18,
    rate: 1.05,
    apiKey: ''
  };

  // 2. 사운드 생성기 (Web Audio API)
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // 전화 벨소리 (따르릉 따르릉)
  function playRingtone() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    // 이중 톤 (FaceTime/전화 느낌)
    const playTone = (freq1, freq2, startTime, duration) => {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.frequency.value = freq1;
      osc2.frequency.value = freq2;

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    };

    playTone(440, 480, now, 0.4);
    playTone(440, 480, now + 0.5, 0.4);
  }

  // 타요 경적 소리 (빵빵!)
  function playHornSound() {
    initAudio();
    const now = audioCtx.currentTime;
    
    const playBeep = (time) => {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.value = 310;
      osc2.frequency.value = 390;

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.18);
      osc2.stop(time + 0.18);
    };

    playBeep(now);
    playBeep(now + 0.22);

    if (tayo) tayo.honkHorn();
  }

  // 벨소리 루프 시작
  function startRingtoneLoop() {
    initAudio();
    playRingtone();
    ringtoneTimer = setInterval(playRingtone, 2600);
  }

  function stopRingtoneLoop() {
    if (ringtoneTimer) {
      clearInterval(ringtoneTimer);
      ringtoneTimer = null;
    }
  }

  // 3. 웹캠 시작 (FaceTime PIP)
  async function startWebcam() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false // 오디오는 Web Speech API가 사용
      });
      userWebcam.srcObject = mediaStream;
      webcamFallback.style.display = 'none';
    } catch (err) {
      console.warn('웹캠 접근 실패 또는 권한 없음:', err);
      webcamFallback.innerHTML = '<span>📷 카메라 없음<br>(가상 모드 작동)</span>';
      webcamFallback.style.display = 'flex';
    }
  }

  function stopWebcam() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    userWebcam.srcObject = null;
  }

  // 4. 고품질 신경망(Neural) 음성 관리
  let availableVoices = [];
  let selectedVoice = null;

  function loadHighQualityVoices() {
    return new Promise((resolve) => {
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          availableVoices = voices;
          selectBestKoreanVoice();
          updateVoiceDropdown();
          resolve(voices);
        }
      };

      checkVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = checkVoices;
      }
      setTimeout(checkVoices, 400);
      setTimeout(checkVoices, 1200);
    });
  }

  function updateVoiceDropdown() {
    if (!voiceSelect) return;
    const koreanVoices = availableVoices.filter(v => v.lang.startsWith('ko') || v.lang.includes('KO') || v.lang.includes('Korean'));
    if (koreanVoices.length === 0) return;

    voiceSelect.innerHTML = '';
    koreanVoices.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.name;
      const isNatural = v.name.includes('Natural') || v.name.includes('Online');
      const isKidTone = v.name.includes('InJoon');
      let label = v.name;
      if (isKidTone) label = `⭐ ${v.name} (추천: 개구쟁이 소년 톤)`;
      else if (isNatural) label = `✨ ${v.name} (자연스러운 AI 신경망)`;
      
      opt.textContent = label;
      if (selectedVoice && selectedVoice.name === v.name) {
        opt.selected = true;
      }
      voiceSelect.appendChild(opt);
    });
  }

  function selectBestKoreanVoice() {
    const koreanVoices = availableVoices.filter(v => v.lang.startsWith('ko') || v.lang.includes('KO') || v.lang.includes('Korean'));
    console.log('발견된 한국어 음성 목록:', koreanVoices.map(v => v.name));

    // 1순위: 마이크로소프트 인준 소년 음성 (InJoon Online Natural - 타요 캐릭터에 가장 적합한 어린이/소년 톤)
    let best = koreanVoices.find(v => v.name.includes('InJoon') && (v.name.includes('Natural') || v.name.includes('Online')));
    
    // 2순위: 마이크로소프트 선희 신경망 음성 (SunHi Online Natural - 가장 부드러운 고품질 한국어 AI 톤)
    if (!best) {
      best = koreanVoices.find(v => v.name.includes('SunHi') && (v.name.includes('Natural') || v.name.includes('Online')));
    }

    // 3순위: 기타 Natural 또는 Online 키워드가 들어간 고품질 신경망 음성 (기계음 제외)
    if (!best) {
      best = koreanVoices.find(v => v.name.includes('Natural') || v.name.includes('Online'));
    }

    // 4순위: 일반 한국어 음성
    if (!best && koreanVoices.length > 0) {
      best = koreanVoices[0];
    }

    selectedVoice = best;
    if (selectedVoice) {
      console.log('✅ 선택된 타요 음성 엔진:', selectedVoice.name);
      const isNatural = selectedVoice.name.includes('Natural') || selectedVoice.name.includes('Online');
      // 인준 소년 음성은 자체 피치가 높으므로 1.15, 선희 등 여성 음성은 1.25로 세팅
      if (selectedVoice.name.includes('InJoon')) {
        config.pitch = 1.15;
      } else if (isNatural) {
        config.pitch = 1.22;
      }
      if (voicePitchInput) voicePitchInput.value = config.pitch;
      if (pitchValText) pitchValText.textContent = `${config.pitch} (피치)`;
    }
  }

  // 4-1. 고품질 클라우드 AI 음성 스트리밍 (MP3) 및 립싱크
  let currentAudio = null;

  async function tayoSpeak(text, callback) {
    // 이전 오디오 및 TTS 중단
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // 텍스트 자막 표시
    tayoSubtitle.textContent = `"${text}"`;

    try {
      // 1. OpenAI API 키가 있는 경우: 최고급 사람 성우 톤 (tts-1 nova)
      if (config.apiKey && config.apiKey.startsWith('sk-')) {
        const audioBlob = await fetchOpenAITTS(text);
        if (audioBlob) {
          playAudioBlob(audioBlob, callback);
          return;
        }
      }

      // 2. 무료 고품질 클라우드 AI 음성 스트리밍 (/api/tts 프록시)
      const audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      // 발음이 또렷하게 들리도록 정상 배속(1.0) 설정
      audio.playbackRate = 1.0;

      // '빵빵' 또는 '출발' 단어가 있으면 경적 효과음 함께 출력
      if (text.includes('빵빵') || text.includes('출발')) {
        setTimeout(() => playHornSound(), 200);
      }

      audio.onplay = () => {
        if (tayo) tayo.startTalking();
        resetIdlePrompt();
      };

      audio.onended = () => {
        if (tayo) tayo.stopTalking();
        resetIdlePrompt();
        currentAudio = null;
        if (callback) callback();
      };

      audio.onerror = (e) => {
        console.warn('클라우드 오디오 로드 실패, 로컬 폴백 사용:', e);
        fallbackLocalSpeech(text, callback);
      };

      await audio.play();

    } catch (err) {
      console.warn('클라우드 음성 재생 예외, 로컬 폴백 사용:', err);
      fallbackLocalSpeech(text, callback);
    }
  }

  // OpenAI TTS API 호출
  async function fetchOpenAITTS(text) {
    try {
      const resp = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'nova', // 가장 밝고 자연스러운 한국어 발음
          speed: 1.05
        })
      });
      if (!resp.ok) throw new Error(`OpenAI TTS Error: ${resp.status}`);
      return await resp.blob();
    } catch (e) {
      console.warn('OpenAI TTS 실패:', e);
      return null;
    }
  }

  function playAudioBlob(blob, callback) {
    const blobUrl = URL.createObjectURL(blob);
    const audio = new Audio(blobUrl);
    currentAudio = audio;

    audio.onplay = () => {
      if (tayo) tayo.startTalking();
      resetIdlePrompt();
    };

    audio.onended = () => {
      if (tayo) tayo.stopTalking();
      resetIdlePrompt();
      currentAudio = null;
      URL.revokeObjectURL(blobUrl);
      if (callback) callback();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(blobUrl);
    };

    audio.play();
  }

  // 비상용 로컬 Web Speech Synthesis 폴백
  function fallbackLocalSpeech(text, callback) {
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    utterance.onstart = () => {
      if (tayo) tayo.startTalking();
      resetIdlePrompt();
    };

    utterance.onend = () => {
      if (tayo) tayo.stopTalking();
      resetIdlePrompt();
      if (callback) callback();
    };

    window.speechSynthesis.speak(utterance);
  }

  // 5. 음성 인식 (STT)
  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      childTranscript.textContent = '※ 음성 인식을 지원하지 않는 브라우저입니다 (Edge/Chrome 권장).';
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.trim();
      if (!transcript) return;

      console.log('아이 발화 인식:', transcript);
      childTranscript.textContent = `"${transcript}"`;

      // 타요 응답 생성
      handleChildSpeech(transcript);
    };

    recognition.onerror = (event) => {
      console.warn('음성 인식 오류:', event.error);
      if (event.error === 'not-allowed') {
        childTranscript.textContent = '마이크 권한을 허용해주세요!';
      }
    };

    recognition.onend = () => {
      if (isCallActive && isListening) {
        try {
          recognition.start();
        } catch (e) {
          // 이미 실행 중일 수 있음
        }
      }
    };
  }

  function startListening() {
    if (recognition && !isListening) {
      try {
        recognition.start();
        isListening = true;
        btnToggleMic.classList.remove('muted');
        btnToggleMic.classList.add('active');
        btnToggleMic.querySelector('.ctrl-text').textContent = '마이크 켜짐';
        childTranscript.textContent = '타요가 귀를 쫑긋 세우고 있어요! 👂';
      } catch (e) {
        console.warn('음성 인식 시작 실패:', e);
      }
    }
  }

  function stopListening() {
    if (recognition && isListening) {
      isListening = false;
      recognition.stop();
      btnToggleMic.classList.remove('active');
      btnToggleMic.classList.add('muted');
      btnToggleMic.querySelector('.ctrl-text').textContent = '마이크 꺼짐';
      childTranscript.textContent = '마이크가 꺼져 있어요.';
    }
  }

  // 6. 30개월 유아 맞춤형 타요 대화 엔진
  const TayoDialogueEngine = {
    // 30개월 아이의 단어/소리에 반응하는 규칙 사전
    rules: [
      {
        keywords: ['안녕', '하이', '타요', '타요야', '안뇽'],
        responses: [
          `안녕 ${config.childName}! 나는 꼬마버스 타요야! 만나서 너무 반가워! 빵빵~`,
          `우와 ${config.childName}! 안녕! 타요랑 오늘 재미있게 놀자! 붕붕~`,
          `안녕 안녕! 타요가 ${config.childName} 보러 씽씽 달려왔어!`
        ]
      },
      {
        keywords: ['로기', '가니', '라니', '씨투'],
        responses: [
          '맞아! 내 초록색 친구 로기! 오늘 차고지에서 같이 숨바꼭질했어! 헤헤~',
          '가니랑 라니도 알아? 친구들은 지금 손님들 태우러 출동했어! 붕붕~',
          '와아! 타요 친구들을 다 알고 있구나! 너 정말 최고야!'
        ]
      },
      {
        keywords: ['포코', '패트', '맥스', '빌리', '경찰'],
        responses: [
          '포코는 땅을 푹푹 파고, 패트는 삐뽀삐뽀 출동해! 멋지지?',
          '중장비 친구들도 정말 힘이 세! 포코랑 모래놀이 할래?'
        ]
      },
      {
        keywords: ['빵빵', '부릉', '붕붕', '빠방', '차'],
        responses: [
          '빵빵~! 부릉부릉~ 타요가 힘차게 달린다! 빵빵~!',
          '붕붕~ 달려요 달려! 우리 같이 운전놀이 해볼까? 핸들을 꽉 잡아!',
          '빵빵! 길을 비켜주세요~ 꼬마버스 타요가 나가신다!'
        ]
      },
      {
        keywords: ['맘마', '밥', '과자', '딸기', '바나나', '사탕', '우유', '젤리', '고기'],
        responses: [
          '우와 맛있겠다! 맘마 냠냠 많이 먹고 튼튼해져야 해! 타요는 기름 꿀꺽꿀꺽 먹었어~',
          '딸기랑 바나나 타요도 좋아해! 골고루 잘 먹는 착한 친구구나! 최고!',
          '냠냠냠~ 맘마 맛있게 먹었어? 타요 배도 뽈록해졌어! 헤헤'
        ]
      },
      {
        keywords: ['좋아', '신나', '재밌', '응', '어'],
        responses: [
          '헤헤, 타요도 너무너무 신나! 바퀴가 통통 튀는 것 같아!',
          '우와 신난다! 우리 같이 손뼉 짝짝 쳐볼까? 짝짝짝!',
          '좋아 좋아! 타요가 재미난 이야기 더 많이 해줄게!'
        ]
      },
      {
        keywords: ['싫어', '아니', '안해'],
        responses: [
          '에구, 그랬어? 괜찮아 괜찮아! 타요가 빵빵 소리로 기분 좋게 해줄게! 빵빵~',
          '싫었구나~ 그럼 타요랑 부릉부릉 드라이브 갈까? 붕붕~',
          '우쭈쭈~ 타요가 꼭 안아줄게! 힘내라 얍!'
        ]
      },
      {
        keywords: ['엄마', '아빠'],
        responses: [
          '엄마 아빠 말씀 잘 듣는 착한 친구지? 타요가 사랑의 하트 뿅뿅 보낼게!',
          '엄마 아빠랑 손잡고 타요 버스타러 놀러와! 빵빵~'
        ]
      },
      {
        keywords: ['노래', '노래해', '개구쟁이'],
        responses: [
          '타요 노래 불러줄까? 꼬마버스가 달린다~ 씽씽씽 달린다~ 타요 타요 꼬마버스 타요! 랄랄라~',
          '부릉부릉 붕붕붕 달려가요~ 타요랑 같이 노래 부르니까 정말 신난다!'
        ]
      },
      {
        keywords: ['졸려', '자자', '잘자', '하품'],
        responses: [
          '오늘 신나게 놀아서 졸리구나~ 코 자고 꿈나라 차고지에서 또 만나! 잘 자~',
          '눈이 스르륵 감기네~ 타요가 자장가 불러줄게. 예쁜 꿈 꿔!'
        ]
      },
      {
        keywords: ['어디', '어디가', '출발', '가자'],
        responses: [
          '타요는 지금 남산 타워로 신나게 달리고 있어! 손님들 태우러 출~발!',
          '놀이터로 출발해볼까? 부릉부릉~ 씽씽 달려가요!'
        ]
      }
    ],

    // 기본 리액션 (매칭되는 단어가 없거나 짧은 옹알이일 때)
    defaultReplies: [
      `헤헤! ${config.childName} 목소리 들으니까 타요는 너무 신나! 빵빵~`,
      `우와, 정말? 타요한테 재미있는 이야기 더 들려줘!`,
      `부릉부릉~ 타요가 ${config.childName} 얼굴 보니까 기분이 최고야!`,
      `빵빵! 타요랑 같이 노래 부를까? 붕붕~`,
      `맞아 맞아! ${config.childName}는 오늘 뭐 하고 놀았어?`
    ],

    // 아이가 오랫동안(12초 이상) 말이 없을 때 먼저 말 걸기
    idlePrompts: [
      `${config.childName}야~ 지금 뭐하고 있어? 타요는 붕붕 달리고 있어!`,
      `친구 얼굴이 화면에 보여서 타요는 너무 좋다! 빵빵~`,
      `혹시 타요 빵빵 소리 듣고 싶어? 빵빵~!`,
      `어디 재미있는 데로 같이 놀러갈까? 부릉부릉~`
    ],

    getRandom(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },

    getReply(text) {
      const clean = text.toLowerCase();
      for (const rule of this.rules) {
        if (rule.keywords.some(kw => clean.includes(kw))) {
          return this.getRandom(rule.responses);
        }
      }
      return this.getRandom(this.defaultReplies);
    }
  };

  // 7. 아이 발화 처리
  function handleChildSpeech(transcript) {
    // LLM API 키가 입력되어 있으면 온라인 AI 호출 가능, 없으면 고속 유아 전용 룰 엔진 사용
    if (config.apiKey && config.apiKey.trim().length > 10) {
      callOnlineLLM(transcript);
    } else {
      const reply = TayoDialogueEngine.getReply(transcript);
      setTimeout(() => {
        tayoSpeak(reply);
      }, 400); // 아이 발화 직후 0.4초 만에 자연스럽게 반응
    }
  }

  // LLM 연동 (선택 사항)
  async function callOnlineLLM(userPrompt) {
    try {
      childTranscript.textContent = '타요가 생각하고 있어요... 💭';
      // Gemini 또는 OpenAI 호환 엔드포인트 호출
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `너는 애니메이션 '꼬마버스 타요'의 주인공인 파란색 버스 타요야. 
대화 상대는 만 2~3세(30개월) 남아 유아야. 
규칙:
1. 문장은 1~2줄로 아주 짧고 단순하게 반말로 답할 것.
2. 효과음('빵빵!', '부릉부릉~', '헤헤', '붕붕~')을 적극적으로 넣을 것.
3. 밝고 긍정적이며 칭찬과 따뜻한 리액션을 해줄 것.
4. 유아의 서툰 발음이나 짧은 단어도 다정하게 받아줄 것.`
            },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 60,
          temperature: 0.7
        })
      });
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || TayoDialogueEngine.getReply(userPrompt);
      tayoSpeak(reply);
    } catch (e) {
      console.warn('API 호출 실패, 로컬 룰 엔진으로 대체:', e);
      const reply = TayoDialogueEngine.getReply(userPrompt);
      tayoSpeak(reply);
    }
  }

  // 조용할 때 먼저 말 걸기 타이머
  function resetIdlePrompt() {
    if (idlePromptTimer) clearTimeout(idlePromptTimer);
    if (!isCallActive) return;

    idlePromptTimer = setTimeout(() => {
      if (isCallActive && !window.speechSynthesis.speaking) {
        const prompt = TayoDialogueEngine.getRandom(TayoDialogueEngine.idlePrompts);
        tayoSpeak(prompt);
      }
    }, 14000); // 14초 침묵 시
  }

  // 8. 통화 연결 및 종료
  function startCall() {
    stopRingtoneLoop();
    isCallActive = true;

    incomingScreen.classList.remove('active');
    activeCallScreen.classList.add('active');

    // 캐릭터 초기화
    if (!tayo) {
      tayo = new TayoCharacter();
    }

    // 웹캠 및 STT 활성화
    startWebcam();
    initSpeechRecognition();
    startListening();

    // 통화 시간 타이머
    callSeconds = 0;
    callTimer.textContent = '00:00';
    callDurationTimer = setInterval(() => {
      callSeconds++;
      const min = String(Math.floor(callSeconds / 60)).padStart(2, '0');
      const sec = String(callSeconds % 60).padStart(2, '0');
      callTimer.textContent = `${min}:${sec}`;
    }, 1000);

    // 타요의 첫 인사 (자연스러운 억양과 호흡)
    setTimeout(() => {
      tayoSpeak(`안녕, ${config.childName}! 나는 꼬마버스 타요야! 빵, 빵~! 오늘 만나서 정말 반가워!`);
    }, 700);
  }

  function endCall() {
    isCallActive = false;
    stopListening();
    stopWebcam();
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (tayo) tayo.stopTalking();

    if (callDurationTimer) {
      clearInterval(callDurationTimer);
      callDurationTimer = null;
    }
    if (idlePromptTimer) {
      clearTimeout(idlePromptTimer);
      idlePromptTimer = null;
    }

    activeCallScreen.classList.remove('active');
    incomingScreen.classList.add('active');

    // 다시 수신 대기
    startRingtoneLoop();
  }

  // 9. 이벤트 리스너 바인딩
  btnAcceptCall.addEventListener('click', () => {
    initAudio();
    startCall();
  });

  btnEndCall.addEventListener('click', endCall);

  btnSoundEffect.addEventListener('click', () => {
    playHornSound();
  });

  btnTayoTalk.addEventListener('click', () => {
    const randomReply = TayoDialogueEngine.getRandom(TayoDialogueEngine.idlePrompts);
    tayoSpeak(randomReply);
  });

  btnToggleMic.addEventListener('click', () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  });

  // 설정 모달
  btnOpenSettings.addEventListener('click', () => {
    settingsModal.classList.add('active');
  });

  btnCloseSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });

  voicePitchInput.addEventListener('input', (e) => {
    pitchValText.textContent = `${e.target.value} (피치)`;
  });

  voiceSelect.addEventListener('change', (e) => {
    const found = availableVoices.find(v => v.name === e.target.value);
    if (found) {
      selectedVoice = found;
      if (found.name.includes('InJoon')) {
        config.pitch = 1.15;
      } else if (found.name.includes('Natural') || found.name.includes('Online')) {
        config.pitch = 1.22;
      }
      voicePitchInput.value = config.pitch;
      pitchValText.textContent = `${config.pitch} (피치)`;
    }
  });

  btnSaveSettings.addEventListener('click', () => {
    if (childNameInput.value.trim()) {
      config.childName = childNameInput.value.trim();
    }
    const found = availableVoices.find(v => v.name === voiceSelect.value);
    if (found) {
      selectedVoice = found;
    }
    config.pitch = parseFloat(voicePitchInput.value);
    config.apiKey = llmApiKeyInput.value.trim();
    settingsModal.classList.remove('active');
    
    // 변경된 목소리로 테스트 인사
    tayoSpeak(`안녕! 타요 목소리 어때? 붕붕~`);
  });

  // 페이지 클릭 시 오디오 컨텍스트 언락 및 초기 벨소리 시작
  document.body.addEventListener('click', () => {
    initAudio();
  }, { once: true });

  // 고품질 신경망 AI 음성 로드 시작
  loadHighQualityVoices();

  // 앱 로드 시 벨소리 시작
  startRingtoneLoop();
});

