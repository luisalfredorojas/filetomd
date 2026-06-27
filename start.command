#!/usr/bin/env bash
# Doble clic en macOS para arrancar la app (abre Terminal y ejecuta start.sh).
cd "$(dirname "$0")" || exit 1
exec bash ./start.sh
