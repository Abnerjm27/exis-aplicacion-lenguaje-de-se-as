@echo off
chcp 65001 >nul
title Manitas LSC - Tutor Interactivo (Proyecto EXIS)

echo =========================================================================
echo   Iniciando Servidor Manitas LSC (Vision MediaPipe + LSC70)
echo =========================================================================
echo.

REM [1/3] Liberar puerto 8000 de sesiones previas
echo [1/3] Liberando puerto 8000 de sesiones previas...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM [2/3] Abrir navegador en la aplicacion
echo [2/3] Abriendo tu navegador en http://localhost:8000/landing.html ...
start http://localhost:8000/landing.html
echo.

REM [3/3] Ejecutar servidor web y API LSC
echo [3/3] Ejecutando servidor web y API LSC...
cd /d "%~dp0"
python server.py
pause
