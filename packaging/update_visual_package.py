"""Refresh app files in the full ZIP and produce a small overlay update."""
from pathlib import Path
import hashlib,json,shutil,zipfile
ROOT=Path(__file__).resolve().parents[1]
name='TayoCall-Full-Windows-x64-20261018'
release=ROOT/'dist'/name
archive=ROOT/'dist'/(name+'.zip')
changed=['tayo-call/'+f for f in ['index.html','style.css','scene-backdrops.mjs','scene-visuals.mjs','action-scenes.mjs','everyday-scenes.mjs']]
manifest=json.loads((release/'PACKAGE-MANIFEST.json').read_text(encoding='utf-8'))
records={r['path']:r for r in manifest['filesSha256']}
for relative in changed:
 target=release/relative
 shutil.copyfile(ROOT/relative,target)
 records[relative]={'path':relative,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
manifest.update(files=len(records),unpackedBytes=sum(r['bytes'] for r in records.values()),filesSha256=list(records.values()))
(release/'PACKAGE-MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
changed.append('PACKAGE-MANIFEST.json')
update=ROOT/'dist'/'TayoCall-Update-20261018-Visuals.zip'
with zipfile.ZipFile(update,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as package:
 for relative in changed:package.write(release/relative,relative)
 package.writestr('업데이트_적용방법.txt','타요 영상통화를 종료하세요.\n이 ZIP의 내용을 기존 타요영상통화_시작.exe가 있는 폴더에 압축 해제하고 파일 교체를 선택하세요.\ntayo-call 폴더 안에 다시 tayo-call 폴더를 만들지 않도록 주의하세요.\n기존 실행 파일을 실행하세요. 화면이 그대로면 Ctrl+F5를 누르세요.\n언어모델과 API 키 설정은 유지됩니다.\n\n변경: 자막 별도 영역, 상세 건물/나무/공룡 그림.\n')
with zipfile.ZipFile(archive,'a',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=3) as package:
 replaced={name+'/'+p for p in changed}
 package.filelist[:]=[e for e in package.filelist if e.filename not in replaced]
 package.NameToInfo={e.filename:e for e in package.filelist}
 for relative in changed:package.write(release/relative,name+'/'+relative)
 assert len(package.filelist)==len(package.NameToInfo),'Duplicate entries'
with archive.open('rb') as file:digest=hashlib.file_digest(file,'sha256').hexdigest()
(ROOT/'dist'/(name+'.zip.sha256')).write_text(digest+'  '+archive.name+'\n',encoding='utf-8')
with zipfile.ZipFile(update) as package:assert package.testzip() is None
print(json.dumps({'updateBytes':update.stat().st_size,'fullBytes':archive.stat().st_size,'sha256':digest}),flush=True)
