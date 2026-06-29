#!/usr/bin/env bash
#
# Lanzador de MarkItDown Converter (Docker) para macOS / Linux.
#
# Requiere tener instalado "Docker Desktop". Este script se encarga del resto:
# construye la imagen, abre el navegador y levanta la app.
#
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │      MarkItDown Converter  (Docker)      │"
echo "  └─────────────────────────────────────────┘"
echo ""

# 1) ¿Está Docker instalado? ------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ No encuentro Docker en tu sistema."
  echo ""
  echo "   Instala 'Docker Desktop' (gratis) desde:"
  echo "     https://www.docker.com/products/docker-desktop/"
  echo ""
  echo "   Ábrelo una vez, espera a que aparezca como 'running' (en marcha) y"
  echo "   vuelve a hacer doble clic en este archivo."
  echo ""
  read -n 1 -s -r -p "Pulsa una tecla para cerrar..."
  exit 1
fi

# 2) ¿Está el motor de Docker activo? Si no, intentar abrirlo y esperar. -----
if ! docker info >/dev/null 2>&1; then
  echo "==> Docker no está activo. Intento abrir Docker Desktop..."
  if [ "$(uname)" = "Darwin" ]; then open -a Docker >/dev/null 2>&1 || true; fi
  printf "    Esperando a que Docker arranque"
  for _ in $(seq 1 60); do
    if docker info >/dev/null 2>&1; then echo "  ¡listo!"; break; fi
    printf "."; sleep 2
  done
  if ! docker info >/dev/null 2>&1; then
    echo ""
    echo "❌ Docker no terminó de arrancar. Abre 'Docker Desktop' a mano, espera"
    echo "   a que diga 'running' y vuelve a intentar."
    read -n 1 -s -r -p "Pulsa una tecla para cerrar..."
    exit 1
  fi
fi

# 3) Carpeta de salida (en TU máquina) y puerto libre -----------------------
mkdir -p output
export DISPLAY_OUTPUT_DIR="$(pwd)/output"

find_free_port() {
  local p
  for p in $(seq 5001 5060); do
    # Si NO se puede conectar, el puerto está libre.
    if ! (echo > "/dev/tcp/127.0.0.1/$p") 2>/dev/null; then echo "$p"; return; fi
  done
  echo 5001
}
export HOST_PORT="${HOST_PORT:-$(find_free_port)}"
URL="http://127.0.0.1:${HOST_PORT}"

# 4) Construir la imagen (la 1ª vez tarda; luego usa caché) ------------------
echo "==> Preparando la app (la primera vez puede tardar unos minutos)..."
docker compose build

# 5) Abrir el navegador cuando la app esté lista ----------------------------
(
  for _ in $(seq 1 40); do
    if (echo > "/dev/tcp/127.0.0.1/${HOST_PORT}") 2>/dev/null; then
      sleep 1
      if command -v open >/dev/null 2>&1; then open "$URL"
      elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
      fi
      break
    fi
    sleep 1
  done
) >/dev/null 2>&1 &

# 6) Levantar la app (y detener el contenedor al cerrar) --------------------
cleanup() { echo ""; echo "==> Deteniendo la app..."; docker compose down >/dev/null 2>&1 || true; }
# INT/TERM = Ctrl+C; HUP = cerrar la ventana de Terminal; EXIT = cualquier salida.
trap cleanup EXIT INT TERM HUP

echo ""
echo "==> Abriendo $URL"
echo "    Tus archivos .md aparecerán en: $DISPLAY_OUTPUT_DIR"
echo "    Para detener la app: cierra esta ventana o pulsa Ctrl+C."
echo ""
docker compose up
