@echo off
REM ============================================================
REM   Lanzador de MarkItDown Converter (Docker) para Windows.
REM   Requiere tener instalado "Docker Desktop".
REM ============================================================
setlocal enableextensions
cd /d "%~dp0"

echo.
echo   ===========================================
echo        MarkItDown Converter  (Docker)
echo   ===========================================
echo.

REM 1) Docker instalado?
where docker >nul 2>nul
if errorlevel 1 (
  echo No encuentro Docker en tu sistema.
  echo.
  echo Instala "Docker Desktop" ^(gratis^) desde:
  echo     https://www.docker.com/products/docker-desktop/
  echo Abrelo, espera a que aparezca como "running" y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

REM 2) Motor de Docker activo?
docker info >nul 2>nul
if errorlevel 1 (
  echo ==^> Docker no esta activo.
  echo     Abre "Docker Desktop", espera a que diga "running" y vuelve a
  echo     ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

REM 3) Carpeta de salida y puerto
if "%HOST_PORT%"=="" set "HOST_PORT=5001"
set "DISPLAY_OUTPUT_DIR=%cd%\output"
if not exist "output" mkdir output

REM 4) Construir la imagen
echo ==^> Preparando la app ^(la primera vez puede tardar unos minutos^)...
docker compose build

REM 5) Abrir el navegador y levantar
start "" "http://127.0.0.1:%HOST_PORT%"
echo.
echo ==^> Abriendo http://127.0.0.1:%HOST_PORT%
echo     Tus archivos .md apareceran en: %DISPLAY_OUTPUT_DIR%
echo     Para detener la app: cierra esta ventana o pulsa Ctrl+C.
echo.
docker compose up
