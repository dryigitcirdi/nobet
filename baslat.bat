@echo off
title VIGIL Sunucusu
cd /d "%~dp0"
echo ========================================================
echo   VIGIL - Nobet ve Icap Takip Sistemi Baslatiliyor...
echo ========================================================
start "" "http://localhost:5173"
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
