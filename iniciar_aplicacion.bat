@echo off
title LSC Learn - Tutor de Lengua de Señas Colombiana (Proyecto EXIS)
echo =========================================================================
echo   Iniciando Servidor Web + IA Local Ollama para LSC Learn (Proyecto EXIS)
echo =========================================================================
echo.

echo [1/4] Liberando puerto 8000 de sesiones previas...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/4] Verificando e iniciando servidor de IA Ollama...
curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Servidor Ollama no detectado en puerto 11434.
    where ollama >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Levantando 'ollama serve' en segundo plano...
        start "Ollama Engine" /min ollama serve
        timeout /t 3 /nobreak >nul
        curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
        if %errorlevel% equ 0 (
            echo [OK] Servidor Ollama iniciado exitosamente en http://127.0.0.1:11434!
        ) else (
            echo [AVISO] Ollama esta iniciando en segundo plano. Cargara en unos instantes.
        )
    ) else (
        echo [ALERTA] No se encontro el comando 'ollama' en PATH.
        echo Puedes instalarlo con: winget install Ollama.Ollama -e
    )
) else (
    echo [OK] Servidor Ollama ya esta activo y listo con qwen2.5:3b!
)
echo.

echo [3/4] Abriendo tu navegador en http://localhost:8000 ...
start http://localhost:8000

echo [4/4] Ejecutando servidor web y API LSC...
python "%~dp0server.py"
pause
