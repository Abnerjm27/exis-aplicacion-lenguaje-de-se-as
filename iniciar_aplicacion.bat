@echo off
title LSC Learn - Tutor de Lengua de Señas Colombiana (Proyecto EXIS)
echo =========================================================================
echo   Iniciando Servidor Web + IA Local Ollama para LSC Learn (Proyecto EXIS)
echo =========================================================================
echo.

echo [1/3] Liberando puerto 8000 de sesiones previas...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Verificando si Ollama esta activo...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Ollama no parece estar corriendo. El chat usara el tutor inteligente integrado.
) else (
    echo [OK] Ollama detectado y listo con qwen2.5:3b!
)
echo.

echo [3/3] Abriendo tu navegador en http://localhost:8000 ...
start http://localhost:8000
python "%~dp0server.py"
pause
