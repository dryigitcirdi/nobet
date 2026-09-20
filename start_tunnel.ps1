$port = 5173
$root = "C:\Users\dryig\.gemini\antigravity\scratch\nobet-app"

# Kill any previous jobs or cloudflared
Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue

# Start HTTP Server Job with localhost binding
$serverJob = Start-Job -ScriptBlock {
    param($root, $port)
    $listener = [System.Net.HttpListener]::new()
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()

    $mimeTypes = @{
        ".html" = "text/html; charset=utf-8"
        ".css"  = "text/css; charset=utf-8"
        ".js"   = "application/javascript; charset=utf-8"
        ".json" = "application/json; charset=utf-8"
        ".svg"  = "image/svg+xml"
        ".png"  = "image/png"
        ".ico"  = "image/x-icon"
    }

    while ($listener.IsListening) {
        try {
            $ctx = $listener.GetContext()
            $req = $ctx.Request
            $res = $ctx.Response
            $path = $req.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
            $file = Join-Path $root $path
            if (Test-Path $file -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($file).ToLower()
                $res.ContentType = $mimeTypes[$ext]
                $bytes = [System.IO.File]::ReadAllBytes($file)
                $res.ContentLength64 = $bytes.Length
                $res.Headers.Add("Access-Control-Allow-Origin", "*")
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                $res.StatusCode = 200
            } else {
                $res.StatusCode = 404
            }
            $res.OutputStream.Close()
        } catch {}
    }
} -ArgumentList $root, $port

Start-Sleep -Milliseconds 800

# Run cloudflared with --http-host-header localhost
$cfExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $cfExe
$psi.Arguments = "tunnel --http-host-header localhost --url http://127.0.0.1:$port"
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($psi)
$url = ""
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

while ($stopwatch.ElapsedMilliseconds -lt 15000) {
    $line = $proc.StandardError.ReadLine()
    if ($line -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
        $url = $matches[0]
        break
    }
}

Write-Host "ONLINE_URL: $url"

# Keep script running to maintain tunnel
while ($true) {
    Start-Sleep -Seconds 60
}
