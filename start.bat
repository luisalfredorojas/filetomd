@echo off
REM ============================================================
REM   Lanzador de MarkItDown Converter para Windows.
REM   No necesitas tener Python instalado: usa "uv", que descarga
REM   Python y las dependencias automaticamente la primera vez.
REM ============================================================
setlocal enableextensions
cd /d "%~dp0"

echo.
echo   ===========================================
echo          MarkItDown Converter
echo   ===========================================
echo.

REM 1) Asegurar que 'uv' esta disponible
set "UV=uv"
where uv >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.local\bin\uv.exe" (
    set "UV=%USERPROFILE%\.local\bin\uv.exe"
  ) else (
    echo ==^> Instalando 'uv' ^(descarga Python y dependencias por ti^)...
    powershell -ExecutionPolicy ByPass -Command "irm https://astral.sh/uv/install.ps1 | iex"
    set "UV=%USERPROFILE%\.local\bin\uv.exe"
  )
)

REM 2) Preparar el entorno la primera vez
if not exist ".venv" (
  echo ==^> Preparando el entorno por primera vez ^(puede tardar 1-2 minutos^)...
  "%UV%" venv --python 3.13 .venv
  "%UV%" pip install --python .venv -r requirements.txt
  echo ==^> Entorno listo.
)

REM 3) Abrir el navegador
if "%PORT%"=="" set "PORT=5000"
start "" "http://127.0.0.1:%PORT%"

REM 4) Levantar la app
echo.
echo ==^> Abriendo http://127.0.0.1:%PORT%
echo     Para detener la app: cierra esta ventana o pulsa Ctrl+C.
echo.
".venv\Scripts\python.exe" app.py

pause
