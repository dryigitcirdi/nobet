@echo off
chcp 65001 >nul
title VIGIL - Otomatik GitHub Yayini
cd /d "%~dp0"

set "PATH=C:\Users\dryig\.gemini\antigravity\scratch\mingit\cmd;C:\Users\dryig\.gemini\antigravity\scratch\gh_bin\bin;%PATH%"

echo =======================================================================
echo    VIGIL — Nöbet ve İcap Takip Sistemi Otomatik GitHub Yayını
echo =======================================================================
echo.

:: 1. GitHub Giriş Kontrolü
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo [1/4] GitHub hesabınıza bağlanılıyor...
    echo.
    echo Tarayıcınız açılacak, lütfen "Authorize github" butonuna tıklayın.
    echo.
    gh auth login --web -h github.com -p https -s repo,workflow
) else (
    echo [1/4] GitHub bağlantısı hazır!
)

echo.
echo [2/4] Proje dosyaları hazırlanıyor...
git init >nul 2>&1
git branch -M main >nul 2>&1
git config user.name "Vigil App" >nul 2>&1
git config user.email "vigil@nobet.local" >nul 2>&1
git add .
git commit -m "Vigil Duty Roster PWA v2" >nul 2>&1

echo.
echo [3/4] GitHub'da "nobet" deposu oluşturulup yükleniyor...
gh repo create nobet --public --source=. --push >nul 2>&1
if %errorlevel% neq 0 (
    echo Depo zaten mevcut, güncellemeler gönderiliyor...
    git push -u origin main --force
)

echo.
echo [4/4] GitHub Pages (İnternet Yayını) aktifleştiriliyor...
gh api -X POST repos/:owner/nobet/pages -f source[branch]=main -f source[path]=/ >nul 2>&1

for /f "tokens=*" %%i in ('gh api repos/:owner/nobet --jq .html_url') do set REPO_URL=%%i
for /f "tokens=*" %%i in ('gh api user --jq .login') do set GH_USER=%%i

set "PAGES_URL=https://%GH_USER%.github.io/nobet/"

echo.
echo =======================================================================
echo   TEBRİKLER! UYGULAMANIZ İNTERNETTE YAYINLANDI!
echo =======================================================================
echo.
echo   Canlı İnternet Bağlantınız: %PAGES_URL%
echo   GitHub Deponuz:             %REPO_URL%
echo.
echo   iPhone Safari'den bu bağlantıyı açıp "Ana Ekrana Ekle" diyebilirsiniz.
echo =======================================================================
echo.
start "" "%PAGES_URL%"
pause
