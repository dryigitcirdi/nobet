# VIGIL Local Dev Server for Safari / Chrome / Mobile Testing
param(
    [int]$Port = 5173
)

$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://*:$Port/")
$listener.Prefixes.Add("http://localhost:$Port/") 2>$null

try {
    $listener.Start()
} catch {
    # If wildcard binding requires admin, fall back to localhost
    $listener = [System.Net.HttpListener]::new()
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Start()
}

$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|vEthernet' -and $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VIGIL — Nöbet & İcap Takip Sistemi Yerel Sunucu" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Bilgisayarınızda test etmek için: " -NoNewline
Write-Host "http://localhost:$Port" -ForegroundColor Green
if ($localIp) {
    Write-Host "  iPhone Safari'den açmak için:    " -NoNewline
    Write-Host "http://${localIp}:$Port" -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Sunucuyu durdurmak için Ctrl+C tuşlarına basın..." -ForegroundColor Gray
Write-Host ""

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
        $filePath = Join-Path $root $path

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    } catch {
        # Catch connection aborts
    }
}
