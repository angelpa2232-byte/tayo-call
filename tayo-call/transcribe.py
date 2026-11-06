import io
import json
import sys
from pathlib import Path
from faster_whisper import WhisperModel

model_path = Path(__file__).parent / 'models' / 'whisper-tiny'
if '--prepare' in sys.argv:
    from huggingface_hub import snapshot_download
    snapshot_download('Systran/faster-whisper-tiny', local_dir=str(model_path))
    print('Local Whisper model ready')
else:
    audio = sys.stdin.buffer.read(1800000)
    model = WhisperModel(str(model_path), device='cpu', compute_type='int8', cpu_threads=2, num_workers=1, local_files_only=True)
    vocabulary = '돌고래, 고래, 흰수염고래, 범고래, 상어, 흰동가리, 니모, 블루탱, 도리, 해마, 가오리, 복어, 문어, 오징어, 해파리, 바다거북, 펭귄, 물범, 바다코끼리, 해달, 게, 불가사리, 새우, 다음 설명, 다시 들려줘.' if '--marine' in sys.argv else '꼬마버스 타요, 초록 버스 로기, 노란 버스 라니, 빨간 버스 가니, 소방차 프랭크, 경찰차 패트, 공룡, 티라노, 티라노사우루스, 트리케라톱스, 브라키오사우루스, 강아지, 고양이.'
    segments, _ = model.transcribe(io.BytesIO(audio), language='ko', beam_size=1, condition_on_previous_text=False, vad_filter=True, initial_prompt=vocabulary)
    text = ''.join(segment.text for segment in segments).strip()
    print(json.dumps({'text': text[:500]}, ensure_ascii=True))

