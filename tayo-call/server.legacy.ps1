# PowerShell HttpListener local web server and TTS proxy
$port = 8088
$folder = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host " Tayo Video Call Server Running! " -ForegroundColor Yellow
    Write-Host " URL: http://127.0.0.1:$port/" -ForegroundColor Green
    Write-Host " Close this window to stop the program." -ForegroundColor Gray
    Write-Host "==========================================" -ForegroundColor Cyan
} catch {
    Write-Host "Port start failed: $_" -ForegroundColor Red
    exit 1
}

# Launch Edge in application window mode
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

if (Test-Path $edgePath) {
    Start-Process $edgePath -ArgumentList "--app=http://127.0.0.1:$port/","--autoplay-policy=no-user-gesture-required","--use-fake-ui-for-media-stream"
} else {
    Start-Process "http://127.0.0.1:$port/"
}

# Request processing loop
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # 1. Cloud AI Audio streaming (/api/tts?text=...)
        if ($request.Url.LocalPath -eq "/api/tts") {
            $rawUrl = $request.RawUrl
            $idx = $rawUrl.IndexOf("text=")
            if ($idx -ge 0) {
                try {
                    $encodedText = $rawUrl.Substring($idx + 5)
                    $ampIdx = $encodedText.IndexOf("&")
                    if ($ampIdx -ge 0) {
                        $encodedText = $encodedText.Substring(0, $ampIdx)
                    }

                    $ttsUrl = "https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=" + $encodedText
                    $wc = New-Object System.Net.WebClient
                    $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    $audioBytes = $wc.DownloadData($ttsUrl)

                    $response.ContentType = "audio/mpeg"
                    $response.ContentLength64 = $audioBytes.Length
                    $response.OutputStream.Write($audioBytes, 0, $audioBytes.Length)
                } catch {
                    $response.StatusCode = 500
                }
            } else {
                $response.StatusCode = 400
            }
            $response.OutputStream.Close()
            continue
        }

        # 2. Static web files
        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "index.html"
        }

        $filePath = Join-Path $folder $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()

            if ($ext -eq ".html") { $response.ContentType = "text/html; charset=utf-8" }
            elseif ($ext -eq ".css") { $response.ContentType = "text/css; charset=utf-8" }
            elseif ($ext -eq ".js") { $response.ContentType = "application/javascript; charset=utf-8" }
            elseif ($ext -eq ".svg") { $response.ContentType = "image/svg+xml" }
            elseif ($ext -eq ".png") { $response.ContentType = "image/png" }
            elseif ($ext -eq ".mp3") { $response.ContentType = "audio/mpeg" }
            else { $response.ContentType = "application/octet-stream" }

            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }

        $response.OutputStream.Close()
    } catch {
        # continue handling requests
    }
}
