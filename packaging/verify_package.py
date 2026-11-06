from pathlib import Path
import hashlib,json,zipfile,time
ROOT=Path(__file__).resolve().parents[1]
name='TayoCall-Full-Windows-x64-20261018'
archive=ROOT/'dist'/(name+'.zip')
report={'archive':archive.name,'checks':{}}
with zipfile.ZipFile(archive) as package:
    entries=package.namelist()
    assert all(n.startswith(name+'/') and '..' not in Path(n).parts for n in entries)
    assert not any(n.endswith('/openai-settings.json') or '/.venv/' in n or n.endswith('.test.mjs') for n in entries)
    report['checks']['private_settings_and_development_files_excluded']=True
    manifest=json.loads(package.read(name+'/PACKAGE-MANIFEST.json'))
    checked=0;last=time.monotonic()
    for item in manifest['filesSha256']:
        digest=hashlib.sha256()
        with package.open(name+'/'+item['path']) as stream:
            while data:=stream.read(8*1024*1024):digest.update(data)
        assert digest.hexdigest()==item['sha256'],item['path']
        assert package.getinfo(name+'/'+item['path']).file_size==item['bytes']
        checked+=1
        if time.monotonic()-last>5:print('Verified archive entries:',checked,flush=True);last=time.monotonic()
    report['checks']['zip_crc_and_all_file_sha256']=checked
    report['unpackedBytes']=manifest['unpackedBytes']
    report['zipBytes']=archive.stat().st_size
    assert any(n.endswith('/python312._pth') for n in entries)
    assert any(n.endswith('/runtime/node/node.exe') for n in entries)
    assert any(n.endswith('/runtime/ollama/ollama.exe') for n in entries)
    assert any(n.endswith('/타요영상통화_시작.exe') for n in entries)
    report['checks']['portable_runtimes_and_native_launcher_included']=True
    # Check the actual configured development key without printing or copying it.
    settings=ROOT/'tayo-call/runtime/openai-settings.json'
    if settings.is_file():
        key=json.loads(settings.read_text(encoding='utf-8')).get('key','').encode()
        if key:
            for entry in entries:
                if entry.endswith(('.json','.mjs','.js','.html','.txt','.md','.ps1','.bat','.cs')):
                    assert key not in package.read(entry),'Credential found'
    report['checks']['configured_api_key_absent']=True
(ROOT/'dist'/(name+'-verification.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True),flush=True)
