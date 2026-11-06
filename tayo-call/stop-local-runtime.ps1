$ErrorActionPreference='Stop'
# Only executables inside this application's portable Ollama directory belong here.
$runtimeRoot=[System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'runtime/ollama')).TrimEnd('\')+'\'
$targets=@(Get-CimInstance Win32_Process | Where-Object {$_.ExecutablePath -and $_.ExecutablePath.StartsWith($runtimeRoot,[System.StringComparison]::OrdinalIgnoreCase)})
foreach($target in $targets){
    $current=Get-CimInstance Win32_Process -Filter ('ProcessId='+$target.ProcessId) -ErrorAction SilentlyContinue
    if($current -and $current.CreationDate -eq $target.CreationDate -and $current.ExecutablePath -and $current.ExecutablePath.StartsWith($runtimeRoot,[System.StringComparison]::OrdinalIgnoreCase)){
        Stop-Process -Id $target.ProcessId -ErrorAction SilentlyContinue
    }
}
