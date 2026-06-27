#!/usr/bin/env bash
#
# Lanzador de MarkItDown Converter para macOS / Linux.
#
# No necesitas tener Python instalado: este script usa "uv", que descarga
# automáticamente el Python correcto e instala las dependencias la primera vez.
#
set -euo pipefail

# Ir a la carpeta de este script (para que funcione desde cualquier sitio).
cd "$(dirname "$0")"

echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │        MarkItDown Converter              │"
echo "  └─────────────────────────────────────────┘"
echo ""

# 1) Asegurar que 'uv' está disponible -------------------------------------
if ! command -v uv >/dev/null 2>&1; then
  if [ -x "$HOME/.local/bin/uv" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    echo "==> Instalando 'uv' (descarga Python y dependencias por ti)..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
  fi
fi

# 2) Preparar el entorno la primera vez ------------------------------------
if [ ! -d ".venv" ]; then
  echo "==> Preparando el entorno por primera vez (puede tardar 1-2 minutos)..."
  uv venv --python 3.13 .venv
  uv pip install --python .venv -r requirements.txt
  echo "==> Entorno listo."
fi

# 3) Abrir el navegador automáticamente ------------------------------------
PORT="${PORT:-5000}"
URL="http://127.0.0.1:${PORT}"
(
  sleep 2
  if command -v open >/dev/null 2>&1; then open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
  fi
) >/dev/null 2>&1 &

# 4) Levantar la app --------------------------------------------------------
echo ""
echo "==> Abriendo $URL"
echo "    Para detener la app: cierra esta ventana o pulsa Ctrl+C."
echo ""
exec .venv/bin/python app.py
