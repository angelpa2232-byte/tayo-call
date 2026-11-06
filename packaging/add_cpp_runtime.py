"""Add required app-local C++ runtimes, preserving existing ZIP64 payloads."""
from pathlib import Path
import hashlib,json,os,shutil,zipfile
ROOT=Path(__file__).resolve().parents[1]
name='TayoCall-Full-Windows-x64-20261018';release=ROOT/'dist'/name;archive=ROOT/'dist'/(name+'.zip')
manifest=json.loads((release/'PACKAGE-MANIFEST.json').read_text(encoding='utf-8'))
records={entry['path']:entry for entry in manifest['filesSha256']};changed=[]
system=Path(os.environ.get('WINDIR','C:/Windows'))/'System32'
sources=list(system.glob('msvcp140*.dll'))+[system/'concrt140.dll',system/'vcomp140.dll']
for source in sources:
 if not source.is_file():continue
 for folder in ['python','node','ollama']:
  relative='tayo-call/runtime/'+folder+'/'+source.name
  target=release/relative;shutil.copyfile(source,target);changed.append(relative)
  with target.open('rb') as file:digest=hashlib.file_digest(file,'sha256').hexdigest()
  records[relative]={'path':relative,'bytes':target.stat().st_size,'sha256':digest}
for source in (release/'tayo-call/runtime/python').glob('vcruntime*.dll'):
 relative='tayo-call/runtime/ollama/'+source.name;target=release/relative;shutil.copyfile(source,target);changed.append(relative)
 records[relative]={'path':relative,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
relative='THIRD_PARTY/Microsoft-runtime-NOTICE.txt';target=release/relative
target.write_text('Microsoft Visual C++ Runtime 14.44 (x64)\nCopyright Microsoft Corporation.\nApplication-local runtime files are included for the bundled native libraries.\nMicrosoft redistribution and licensing information:\nhttps://learn.microsoft.com/en-us/cpp/windows/redistributing-visual-cpp-files\n',encoding='utf-8')
records[relative]={'path':relative,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()};changed.append(relative)
# Refresh the launcher after its successful relocated cold-start test.
source=ROOT/'packaging/Launcher.cs';target=release/'THIRD_PARTY/Launcher.cs';shutil.copyfile(source,target)
for relative in ['타요영상통화_시작.exe','THIRD_PARTY/Launcher.cs']:
 target=release/relative;changed.append(relative);records[relative]={'path':relative,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
manifest.update(files=len(records),unpackedBytes=sum(r['bytes'] for r in records.values()),filesSha256=list(records.values()))
(release/'PACKAGE-MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8');changed.append('PACKAGE-MANIFEST.json')
changed_names={name+'/'+relative for relative in changed}
with zipfile.ZipFile(archive,'a',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=3) as package:
 # Replace only central-directory references for updated files; unchanged model
 # entries keep their original compressed bytes and offsets.
 package.filelist[:]=[entry for entry in package.filelist if entry.filename not in changed_names]
 package.NameToInfo={entry.filename:entry for entry in package.filelist}
 for relative in changed:package.write(release/relative,name+'/'+relative)
with archive.open('rb') as file:digest=hashlib.file_digest(file,'sha256').hexdigest()
(ROOT/'dist'/(name+'.zip.sha256')).write_text(digest+'  '+archive.name+'\n',encoding='utf-8')
print(json.dumps({'appLocalFilesAdded':len(changed)-1,'zipBytes':archive.stat().st_size,'sha256':digest}),flush=True)
