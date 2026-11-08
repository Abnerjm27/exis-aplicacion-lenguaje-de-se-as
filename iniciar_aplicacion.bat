@echo off
chcp 65001 >nul
title Manitas LSC - Tutor Interactivo (Proyecto EXIS)

echo =========================================================================
echo   Iniciando Servidor Web + IA Local Ollama para Manitas (Proyecto EXIS)
echo =========================================================================
echo.

REM [1/4] Liberar puerto 8000 de sesiones previas
echo [1/4] Liberando puerto 8000 de sesiones previas...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM [2/4] Verificacion y arranque limpio de Ollama
echo [2/4] Verificando servidor de IA Ollama en 127.0.0.1:11434...
curl -s --connect-timeout 1 --max-time 2 http://127.0.0.1:11434/api/tags >nul 2>&1
if not errorlevel 1 (
    echo [OK] Servidor Ollama ya esta activo y listo con qwen2.5:3b!
    goto :lanzar_web
)

echo [INFO] Ollama no responde en el puerto 11434. Verificando procesos existentes...
tasklist | findstr /i "ollama.exe" >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Proceso de Ollama detectado en memoria. Esperando respuesta...
    goto :esperar_ollama
)

if exist "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe" (
    echo [INFO] Levantando Ollama desde la aplicacion de escritorio en segundo plano...
    start "" "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe"
    goto :esperar_ollama
)

where ollama >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Levantando 'ollama serve' en segundo plano...
    start "Ollama Engine" /min cmd /c "ollama serve"
    goto :esperar_ollama
)

echo [AVISO] No se encontro el comando 'ollama' en el sistema.
echo Puedes instalarlo con: winget install Ollama.Ollama -e
echo El chat funcionara con el tutor inteligente NLU local integrado (100%% offline).
goto :lanzar_web

:esperar_ollama
echo [INFO] Estableciendo conexion con Ollama...
for /L %%i in (1,1,6) do (
    timeout /t 1 /nobreak >nul
    curl -s --connect-timeout 1 --max-time 1 http://127.0.0.1:11434/api/tags >nul 2>&1
    if not errorlevel 1 (
        echo [OK] Servidor Ollama conectado exitosamente!
        goto :lanzar_web
    )
)
echo [AVISO] Ollama esta cargando en segundo plano. El tutor NLU local integrado asistira el chat.

:lanzar_web
echo.
echo [3/4] Abriendo tu navegador en http://localhost:8000 ...
start http://localhost:8000
echo.

echo [4/4] Ejecutando servidor web y API LSC...
cd /d "%~dp0"
python server.py
pause