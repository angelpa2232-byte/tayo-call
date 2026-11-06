param([switch]$NoBrowser, [int]$StartupTimeoutSeconds=35)
$ErrorActionPreference='Stop'
$appUrl='http://127.0.0.1:8088/'
$runtimePath=Join-Path $PSScriptRoot 'runtime'
$serverPath=Join-Path $PSScriptRoot 'server.ps1'
$launchMutex=New-Object System.Threading.Mutex($false,'Local\TayoVideoCallLauncher8088')
$hasMutex=$false
function Test-TayoServer {
    try {
        $reply=Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 2
        return ($reply.StatusCode -eq 200 -and $reply.Content.Contains('id="btn-accept-call"'))
    } catch { return $false }
}
try {
    try {$hasMutex=$launchMutex.WaitOne(40000)} catch [System.Threading.AbandonedMutexException] {$hasMutex=$true}
    if(-not $hasMutex){throw '다른 시작 작업이 진행 중입니다. 잠시 후 다시 실행해주세요.'}
    if(-not (Test-TayoServer)) {
        New-Item -ItemType Directory -Path $runtimePath -Force | Out-Null
        $stderrPath=Join-Path $runtimePath 'server-start-error.log'
        $stdoutPath=Join-Path $runtimePath 'server-start-output.log'
        $powershellPath=(Get-Command powershell.exe -ErrorAction Stop).Source
        Write-Host '타요 서버를 시작하고 있습니다...'
        $serverProcess=Start-Process -FilePath $powershellPath -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$serverPath+'"'),'-NoBrowser') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -PassThru
        $deadline=[DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
        $ready=$false
        do {
            if(Test-TayoServer){$ready=$true;break}
            if($serverProcess.HasExited){break}
            Start-Sleep -Milliseconds 300
        } while([DateTime]::UtcNow -lt $deadline)
        if(-not $ready){throw ('서버를 시작하지 못했습니다. 오류 기록: '+$stderrPath)}
    }
    Write-Host '타요 서버 준비 완료: http://127.0.0.1:8088/'
    if(-not $NoBrowser){Start-Process $appUrl | Out-Null}
} catch {
    Write-Host ('실행 오류: '+$_.Exception.Message) -ForegroundColor Red
    exit 1
} finally {
    if($hasMutex){$launchMutex.ReleaseMutex()}
    $launchMutex.Dispose()
}
