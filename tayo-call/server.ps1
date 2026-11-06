param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
if(-not $NoBrowser){& (Join-Path $PSScriptRoot 'launch.ps1');exit $LASTEXITCODE}
$portableNode=Join-Path $PSScriptRoot 'runtime/node/node.exe'
$portablePython=Join-Path $PSScriptRoot 'runtime/python/python.exe'
$portableMode=(Test-Path -LiteralPath $portableNode) -and (Test-Path -LiteralPath $portablePython)
$nodePath=$null
if(Test-Path -LiteralPath $portableNode){$nodePath=$portableNode}
if(-not $nodePath){$nodeCommand=Get-Command node -ErrorAction SilentlyContinue;if($nodeCommand){$nodePath=$nodeCommand.Source}}
if(-not $nodePath){
    $bundled=Get-ChildItem -LiteralPath "$env:USERPROFILE\.cache\codex-runtimes" -Filter node.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if($bundled){$nodePath=$bundled.FullName}
}
if($portableMode){$env:TAYO_PYTHON=$portablePython;$env:TAYO_OLLAMA_URL='http://127.0.0.1:11435'}
if (-not $nodePath) { throw 'Node.js 22 이상이 필요합니다. Node.js를 설치한 후 다시 실행해주세요.' }
$ollamaPath=Join-Path $PSScriptRoot 'runtime/ollama/ollama.exe'
$useLocalAI=$true
try {$savedSettings=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'runtime/openai-settings.json') -Raw -ErrorAction Stop | ConvertFrom-Json;if($savedSettings.provider -eq 'openai'){$useLocalAI=$false}}catch{}
if($useLocalAI -and (Test-Path -LiteralPath $ollamaPath)) {
    $env:OLLAMA_MODELS=Join-Path $PSScriptRoot 'models/ollama'
    $env:OLLAMA_NO_CLOUD='1'
    $env:OLLAMA_NUM_PARALLEL='1'
    $env:OLLAMA_MAX_LOADED_MODELS='1'
    $env:OLLAMA_HOST=if($portableMode){'127.0.0.1:11435'}else{'127.0.0.1:11434'}
    try { Invoke-RestMethod ('http://'+$env:OLLAMA_HOST+'/api/tags') -TimeoutSec 2 | Out-Null } catch {
        Start-Process -FilePath $ollamaPath -ArgumentList 'serve' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'runtime/ollama-out.log') -RedirectStandardError (Join-Path $PSScriptRoot 'runtime/ollama-error.log') | Out-Null
    }
}

try { & $nodePath (Join-Path $PSScriptRoot 'server.mjs') } finally { & (Join-Path $PSScriptRoot 'stop-local-runtime.ps1') }
