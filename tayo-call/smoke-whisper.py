import io, json, subprocess, wave
from pathlib import Path
root=Path(__file__).parent
buffer=io.BytesIO()
with wave.open(buffer,'wb') as audio:
    audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(16000);audio.writeframes(b'\x00\x00'*16000)
result=subprocess.run([str(root/'.venv/Scripts/python.exe'),str(root/'transcribe.py')],input=buffer.getvalue(),capture_output=True,timeout=60)
if result.returncode:
    raise RuntimeError(result.stderr.decode('utf-8',errors='replace'))
assert json.loads(result.stdout)['text']==''
print('Offline Whisper model load and silent WAV decode: PASS')
