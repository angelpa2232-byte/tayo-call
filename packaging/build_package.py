"""Build an explicit, key-free Windows x64 portable release with ZIP64.
Run with the development Python. No downloads, credentials or registry changes.
"""
from pathlib import Path
import hashlib, json, os, shutil, subprocess, sys, time, zipfile

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'tayo-call'
RELEASE='TayoCall-Full-Windows-x64-20261018'
OUT=ROOT/'dist'
DEST=OUT/RELEASE
if DEST.exists() and '--resume' not in sys.argv: raise SystemExit('Release folder already exists; use --resume only for this build.')
if DEST.resolve().parent!=OUT.resolve():raise SystemExit('Release target must remain inside dist')
BASE=Path(json.loads(subprocess.check_output([str(APP/'.venv/Scripts/python.exe'),'-c','import sys,json;print(json.dumps(sys.base_prefix))']).decode().strip()))
NODE=Path(shutil.which('node') or '')
if not NODE.is_file(): raise SystemExit('Node runtime not found')
CSC=Path(os.environ.get('WINDIR','C:/Windows'))/'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if not CSC.is_file(): raise SystemExit('Windows C# compiler missing')
OUT.mkdir(exist_ok=True);DEST.mkdir(exist_ok='--resume' in sys.argv)
manifest=[];copied=0;last_report=time.monotonic()

def copy_file(source,target):
    global copied,last_report
    source=Path(source);target=Path(target);target.parent.mkdir(parents=True,exist_ok=True)
    if target.is_file() and target.stat().st_size==source.stat().st_size:
        with source.open('rb') as f: expected=hashlib.file_digest(f,'sha256').hexdigest()
        with target.open('rb') as f: actual=hashlib.file_digest(f,'sha256').hexdigest()
        if expected==actual:
            copied+=source.stat().st_size;manifest.append({'path':target.relative_to(DEST).as_posix(),'bytes':target.stat().st_size,'sha256':actual});return
    digest=hashlib.sha256()
    with source.open('rb') as src,target.open('wb') as dst:
        while block:=src.read(8*1024*1024): dst.write(block);digest.update(block);copied+=len(block)
    manifest.append({'path':target.relative_to(DEST).as_posix(),'bytes':target.stat().st_size,'sha256':digest.hexdigest()})
    if time.monotonic()-last_report>5:
        print('Copied %.2f GB: %s'%(copied/1e9,target.relative_to(DEST)),flush=True);last_report=time.monotonic()

def tree(source,target,exclude=()):
    for current,dirs,files in os.walk(source):
        dirs[:]=sorted(d for d in dirs if d not in {'__pycache__','.cache','.git',*exclude})
        for name in sorted(files):
            if name.endswith(('.pyc','.pyo')): continue
            src=Path(current)/name;copy_file(src,Path(target)/src.relative_to(source))

def text(path,value,encoding='utf-8'):
    target=DEST/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(value,encoding=encoding)
    digest=hashlib.sha256(target.read_bytes()).hexdigest();manifest.append({'path':path,'bytes':target.stat().st_size,'sha256':digest})

sources=['index.html','app.js','style.css','scene-motion.css','mini-games.mjs','mini-games-extra.mjs','mini-game-input.mjs','mini-games.css','vehicles.mjs','vehicles-data.mjs','vehicles-art.mjs','vehicles.css','marine.mjs','marine-data.mjs','marine-art.mjs','marine-voice.mjs','marine.css','tayo-character.js','tayo-icon.svg',
 'server.mjs','openai-provider.mjs','characters.mjs','conversation.mjs','story.mjs','autoplay.mjs',
 'songs.mjs','song-player.js','play-events.mjs','scene-visuals.mjs','action-scenes.mjs',
 'everyday-scenes.mjs','repair-scene.mjs','scene-backdrops.mjs','scene-motion.mjs',
 'tts-worker.mjs','speak.py','transcribe.py','shutdown.mjs','server.ps1','launch.ps1',
 'stop-local-runtime.ps1','start.bat','README.md']
for name in sources:copy_file(APP/name,DEST/'tayo-call'/name)
copy_file(ROOT/'타요영상통화_시작.bat',DEST/'타요영상통화_시작.bat')
tree(APP/'assets',DEST/'tayo-call/assets')
print('Copying isolated Python and installed speech packages...',flush=True)
python_dest=DEST/'tayo-call/runtime/python'
for source in BASE.iterdir():
    if source.is_file() and (source.suffix.lower() in {'.exe','.dll'} or source.name=='LICENSE.txt'):copy_file(source,python_dest/source.name)
tree(BASE/'DLLs',python_dest/'DLLs')
tree(BASE/'Lib',python_dest/'Lib',exclude=('site-packages',))
tree(APP/'.venv/Lib/site-packages',python_dest/'Lib/site-packages')
text('tayo-call/runtime/python/python312._pth','.\nLib\nDLLs\nLib/site-packages\nimport site\n')
node_dest=DEST/'tayo-call/runtime/node'
copy_file(NODE,node_dest/'node.exe')
for source in BASE.glob('vcruntime*.dll'):copy_file(source,node_dest/source.name)
node_license=(ROOT/'packaging/Node-LICENSE.txt').read_text(encoding='utf-8')
text('THIRD_PARTY/Node-LICENSE.txt',node_license)
print('Copying Ollama and every installed local model...',flush=True)
tree(APP/'runtime/ollama',DEST/'tayo-call/runtime/ollama')
# Native speech backends need the application-local MSVC C++ runtime too.
system=Path(os.environ.get('WINDIR','C:/Windows'))/'System32'
for source in [*system.glob('msvcp140*.dll'),system/'concrt140.dll',system/'vcomp140.dll']:
    if source.is_file():
        for folder in ['python','node','ollama']:copy_file(source,DEST/'tayo-call/runtime'/folder/source.name)
for source in BASE.glob('vcruntime*.dll'):copy_file(source,DEST/'tayo-call/runtime/ollama'/source.name)
text('THIRD_PARTY/Microsoft-runtime-NOTICE.txt','Microsoft Visual C++ Runtime 14.44 (x64)\nCopyright Microsoft Corporation.\nhttps://learn.microsoft.com/en-us/cpp/windows/redistributing-visual-cpp-files\n')
for modeldir in ['ollama','supertonic3','whisper-tiny']:tree(APP/'models'/modeldir,DEST/'tayo-call/models'/modeldir)
for metadata in (APP/'models/ollama/manifests').rglob('*'):
    if not metadata.is_file():continue
    data=json.loads(metadata.read_text(encoding='utf-8'))
    for n,layer in enumerate(data.get('layers',[])):
        if 'license' in layer.get('mediaType',''):
            source=APP/'models/ollama/blobs'/layer['digest'].replace(':','-')
            title='-'.join(metadata.relative_to(APP/'models/ollama/manifests').parts)
            copy_file(source,DEST/'THIRD_PARTY'/('model-'+title+'-'+str(n)+'.txt'))
text('THIRD_PARTY/NOTICE.txt','''타요 영상통화 개인용 포터블 배포본
Node.js, Python, Ollama 및 Python 음성 라이브러리/모델이 포함되어 있습니다.
Python 라이선스: tayo-call/runtime/python/LICENSE.txt
Node 라이선스: 이 폴더의 Node-LICENSE.txt
Python 패키지 라이선스: runtime/python/Lib/site-packages 각 *.dist-info 및 패키지 폴더
모델 라이선스: 이 폴더의 model-*.txt 및 각 모델 README/LICENSE
캐릭터 그림과 명칭의 권리는 각 원권리자에게 있습니다.
''')
text('사용방법.txt','''타요 영상통화 전체 포터블 패키지 · Windows 10/11 x64

1. ZIP 파일 전체를 이 PC의 쓰기 가능한 폴더에 압축 해제합니다.
2. 타요영상통화_시작.exe를 더블클릭합니다. 검은 명령창 없이 브라우저가 열립니다.
   EXE 실행이 어려우면 같은 폴더의 타요영상통화_시작.bat를 사용할 수 있습니다.
3. 부모님 설정에서 목소리와 AI 방식을 선택합니다.
   - 기본: 로컬 Ollama / 무료 Supertonic / 음성인식 끄기 / 자동 상황극
   - OpenAI 사용 시 API 키를 이 PC에서 입력합니다. 개발 PC의 키는 포함되지 않았습니다.
4. 캐릭터가 말한 뒤 5초 기다리고 다음 장면으로 이어집니다.
5. 완전히 끝내려면 부모님 설정 또는 첫 화면의 '프로그램 완전 종료'를 누릅니다.

Node.js, Python, Codex, Ollama 별도 설치가 필요하지 않습니다.
기존 개발 PC가 켜져 있을 필요가 없습니다. localhost 서버는 이 PC에서만 실행됩니다.
기본 로컬 모델은 Qwen3 4B Instruct입니다. 나머지 설치된 모델도 전부 포함했습니다.
AI 새 이야기 끄기는 준비된 상황극을 사용하여 로컬 AI 생성 대기 시간을 줄입니다.
OpenAI 대화/음성 및 공식 유튜브 노래는 인터넷이 필요하고 OpenAI는 사용료가 발생합니다.
한국어 Windows 목소리는 해당 PC에 설치되어 있을 때 사용할 수 있습니다.

권장: RAM 16GB 이상. 모든 모델은 동시에 메모리에 올라가지 않습니다.
ZIP과 압축 해제 폴더를 함께 둘 경우 약 50GB의 디스크 여유 공간을 확보합니다.
Windows ARM/32비트, macOS용 배포본은 아닙니다. 실제 다른 PC에서의 최종 확인은 필요합니다.
폴더의 실행파일과 하위 폴더를 따로 떼어 이동하지 마세요.

점검: 타요영상통화_시작.exe --check (runtime/portable-check.log 생성)
문제 발생 시 tayo-call/runtime/launcher-error.log, server-start-error.log를 확인하세요.
''')
text('THIRD_PARTY/Launcher.cs',(ROOT/'packaging/Launcher.cs').read_text(encoding='utf-8'))
exe=DEST/'타요영상통화_시작.exe'
subprocess.run([str(CSC),'/nologo','/target:winexe','/platform:x64','/reference:System.Windows.Forms.dll','/out:'+str(exe),str(ROOT/'packaging/Launcher.cs')],check=True)
manifest.append({'path':exe.name,'bytes':exe.stat().st_size,'sha256':hashlib.sha256(exe.read_bytes()).hexdigest()})
summary={'release':RELEASE,'files':len(manifest),'unpackedBytes':sum(f['bytes'] for f in manifest),'credentialsIncluded':False,'filesSha256':manifest}
(DEST/'PACKAGE-MANIFEST.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print('Creating ZIP64 archive (large model blobs stored without recompression)...',flush=True)
archive=OUT/(RELEASE+'.zip');written=0;last_report=time.monotonic()
with zipfile.ZipFile(archive,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=3) as package:
    for file in sorted(DEST.rglob('*')):
        if not file.is_file():continue
        relative=file.relative_to(DEST).as_posix()
        compression=zipfile.ZIP_STORED if 'models/ollama/blobs/' in relative or file.suffix.lower() in {'.onnx','.bin'} else zipfile.ZIP_DEFLATED
        package.write(file,RELEASE+'/'+relative,compress_type=compression,compresslevel=3)
        written+=file.stat().st_size
        if time.monotonic()-last_report>5:print('Archived %.2f GB'%(written/1e9),flush=True);last_report=time.monotonic()
print('Computing archive SHA-256...',flush=True)
with archive.open('rb') as file:digest=hashlib.file_digest(file,'sha256').hexdigest()
(OUT/(RELEASE+'.zip.sha256')).write_text(digest+'  '+archive.name+'\n',encoding='utf-8')
print(json.dumps({'archive':str(archive),'zipBytes':archive.stat().st_size,'unpackedBytes':summary['unpackedBytes'],'files':len(manifest),'sha256':digest}),flush=True)
