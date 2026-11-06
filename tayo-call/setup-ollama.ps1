$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$runtime=Join-Path $root 'runtime'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$ollama=Join-Path $runtime 'ollama/ollama.exe'
if (-not (Test-Path -LiteralPath $ollama)) {
    Write-Host 'Ollama 공식 포터블 파일 다운로드 (약 1.5GB)...'
    $archive=Join-Path $runtime 'ollama-windows-amd64.zip'
        if (-not (Test-Path -LiteralPath $archive) -or (Get-Item -LiteralPath $archive).Length -ne 1468053171) {
        & curl.exe --fail --location --retry 3 --continue-at - --output $archive 'https://github.com/ollama/ollama/releases/download/v0.40.3/ollama-windows-amd64.zip'
        if($LASTEXITCODE -ne 0 -or (Get-Item -LiteralPath $archive).Length -ne 1468053171){throw '다운로드 실패. 준비 프로그램을 다시 실행하면 이어받습니다.'}
    }
    Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $runtime 'ollama') -Force
}
$env:OLLAMA_MODELS=Join-Path $root 'models/ollama'
$env:OLLAMA_NO_CLOUD='1'
$env:OLLAMA_NUM_PARALLEL='1'
$env:OLLAMA_MAX_LOADED_MODELS='1'
$env:OLLAMA_HOST='127.0.0.1:11434'
try { Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 | Out-Null } catch {
    Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'ollama-out.log') -RedirectStandardError (Join-Path $runtime 'ollama-error.log') | Out-Null
    $ready=$false
    for($i=0;$i -lt 30;$i++) { Start-Sleep -Seconds 1;try{Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 1 | Out-Null;$ready=$true;break}catch{} }
    if(-not $ready){throw 'Ollama를 시작하지 못했습니다. runtime/ollama-error.log를 확인해주세요.'}
}
Write-Host '대화 모델 다운로드 (Qwen3.5 9B, 약 6.6~7.6GB)...'
& $ollama pull qwen3.5:9b
if($LASTEXITCODE -ne 0){throw '대화 모델 다운로드 실패. 다시 준비 프로그램을 실행해주세요.'}
$python=Join-Path $root '.venv/Scripts/python.exe'
if(-not (Test-Path -LiteralPath $python)) {
    $basePython=$null
    $bundled=Get-ChildItem -LiteralPath "$env:USERPROFILE\.cache\codex-runtimes" -Filter python.exe -Recurse -ErrorAction SilentlyContinue | Where-Object FullName -Match 'dependencies\\python\\python.exe$' | Select-Object -First 1
    if($bundled){$basePython=$bundled.FullName}
    if(-not $basePython){$command=Get-Command python -ErrorAction SilentlyContinue;if($command -and $command.Source -notmatch 'WindowsApps'){$basePython=$command.Source}}
    if(-not $basePython){throw 'Python 3.10 이상을 설치한 후 준비 프로그램을 다시 실행해주세요: https://www.python.org/downloads/windows/'}
    & $basePython -m venv (Join-Path $root '.venv')
    if($LASTEXITCODE -ne 0){throw 'Python 환경 생성 실패'}
}
& $python -m pip install 'faster-whisper==1.2.1' 'av==15.1.0' 'supertonic==1.3.1'
if($LASTEXITCODE -ne 0){throw '음성인식 패키지 설치 실패'}
$env:HF_HOME=Join-Path $root 'models/huggingface-cache'
& $python (Join-Path $root 'transcribe.py') --prepare
if($LASTEXITCODE -ne 0){throw '음성인식 모델 다운로드 실패'}
& $python (Join-Path $root 'speak.py') --prepare
if($LASTEXITCODE -ne 0){throw '한국어 음성 모델 다운로드 실패'}
Write-Host '준비 완료! 타요영상통화_시작.bat를 실행해주세요.' -ForegroundColor Green
