@echo off
title PEKEFE Local Dev Server
echo ===================================================
echo   PEKEFE Premium Gastronomy - Yerel Gelistirme
echo   Adres: http://localhost:3000
echo ===================================================
cd /d "%~dp0"
call npm.cmd run dev
pause
