import json, os, subprocess, wave
from pathlib import Path
root=Path(__file__).parent
text='앗, 로기가 멈췄네! 우리 같이 도와줄까? 빵빵, 로기야 힘내!'
result=subprocess.run([str(root/'.venv/Scripts/python.exe'),str(root/'speak.py')],input=json.dumps({'text':text,'voice':'M3'},ensure_ascii=False).encode('utf-8'),capture_output=True,env={**os.environ,'HF_HUB_OFFLINE':'1','PYTHONIOENCODING':'utf-8'},timeout=90)
if result.returncode:raise RuntimeError(result.stderr.decode('utf-8',errors='replace'))
path=root/'runtime'/'tayo-voice-sample.wav'
path.write_bytes(result.stdout)
with wave.open(str(path),'rb') as wav:
 assert wav.getnframes()>1000
 print(json.dumps({'sampleRate':wav.getframerate(),'seconds':round(wav.getnframes()/wav.getframerate(),2),'bytes':len(result.stdout)}))
