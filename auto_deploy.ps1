$gitBin = "C:\Users\dryig\.gemini\antigravity\scratch\mingit\cmd"
$ghBin = "C:\Users\dryig\.gemini\antigravity\scratch\gh_bin\bin"
$chromeExe = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$env:PATH = "$gitBin;$ghBin;" + $env:PATH
$root = "C:\Users\dryig\.gemini\antigravity\scratch\nobet-app"
Set-Location $root

Write-Host ">>> Starting GitHub Authentication Flow..."

# Check if already authenticated
$status = & gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "$ghBin\gh.exe"
    $psi.Arguments = "auth login --web -h github.com -p https -s repo,workflow"
    $psi.RedirectStandardError = $true
    $psi.RedirectStandardOutput = $true
    $psi.UseShellExecute = $false
    $proc = [System.Diagnostics.Process]::Start($psi)

    $code = ""
    while (-not $proc.HasExited) {
        $line = $proc.StandardError.ReadLine()
        if ($line) {
            Write-Host $line
            if ($line -match "code:\s*([A-Z0-9-]+)") {
                $code = $matches[1]
                Write-Host ">>> CODE_FOR_USER: $code"
                
                # Launch Chrome in a visible foreground new window
                if (Test-Path $chromeExe) {
                    Start-Process $chromeExe -ArgumentList "--new-window https://github.com/login/device"
                } else {
                    Start-Process "https://github.com/login/device"
                }
                break
            }
        }
    }

    # Wait for user to authorize in browser
    $proc.WaitForExit()
    Write-Host ">>> Authentication finished with code: $($proc.ExitCode)"
}

# Verify authentication
$user = & gh api user --jq .login
if (-not $user) {
    Write-Host ">>> Error: Not authenticated."
    exit 1
}

Write-Host ">>> Authenticated as GitHub user: $user"

# Git setup
& git init
& git branch -M main
& git config user.name "$user"
& git config user.email "dryigitcirdi@gmail.com"
& git add .
& git commit -m "Vigil Duty Roster PWA v2"

Write-Host ">>> Creating repository and pushing..."
& gh repo create nobet --public --source=. --push 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ">>> Repo might already exist, adding remote and pushing..."
    & git remote remove origin 2>$null
    & git remote add origin "https://github.com/$user/nobet.git"
    & git push -u origin main --force
}

Write-Host ">>> Enabling GitHub Pages..."
& gh api -X POST "repos/$user/nobet/pages" -f "source[branch]=main" -f "source[path]=/" 2>&1

$pagesUrl = "https://$user.github.io/nobet/"
Write-Host "=========================================================="
Write-Host ">>> DEPLOY_SUCCESS: $pagesUrl"
Write-Host "=========================================================="

if (Test-Path $chromeExe) {
    Start-Process $chromeExe -ArgumentList "$pagesUrl"
} else {
    Start-Process $pagesUrl
}
