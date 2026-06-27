"""
MarkItDown Converter — servidor Flask local.

Envuelve la librería microsoft/markitdown con una interfaz web sencilla para
convertir PDFs (y otros formatos soportados) a archivos Markdown (.md).

Todo corre en local, offline, sin servicios en la nube.
"""

import os
import re
import unicodedata
from pathlib import Path

from flask import (
    Flask,
    abort,
    jsonify,
    render_template,
    request,
    send_from_directory,
)
from werkzeug.utils import secure_filename

from markitdown import MarkItDown

# --------------------------------------------------------------------------- #
# Configuración
# --------------------------------------------------------------------------- #

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
UPLOAD_DIR = BASE_DIR / "uploads"

OUTPUT_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)

# Tamaño máximo por archivo (configurable). 50 MB por defecto.
MAX_FILE_SIZE_MB = int(os.environ.get("MAX_FILE_SIZE_MB", "50"))
MAX_CONTENT_LENGTH = MAX_FILE_SIZE_MB * 1024 * 1024

# Extensiones soportadas (offline) por la configuración instalada de markitdown.
# Documentos vía extras [pdf,docx,pptx,xlsx,xls,outlook]; el resto lo maneja
# el núcleo de markitdown. No se incluye audio (la transcripción requiere red).
SUPPORTED_EXTENSIONS = {
    # documentos
    ".pdf",
    ".docx",
    ".pptx",
    ".xlsx",
    ".xls",
    ".msg",
    # texto / datos / web
    ".csv",
    ".tsv",
    ".json",
    ".xml",
    ".html",
    ".htm",
    ".txt",
    ".md",
    ".epub",
    ".ipynb",
    ".zip",
    # imágenes (metadatos / texto incrustado)
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".tiff",
    ".webp",
}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

# Una sola instancia reutilizable de MarkItDown (plugins deshabilitados).
_md = MarkItDown(enable_plugins=False)


# --------------------------------------------------------------------------- #
# Utilidades
# --------------------------------------------------------------------------- #

def human_size(num_bytes: int) -> str:
    """Devuelve un tamaño legible (B, KB, MB, GB)."""
    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024.0:
            if unit == "B":
                return f"{int(size)} {unit}"
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"


def sanitize_basename(name: str) -> str:
    """
    Sanitiza el nombre base de un archivo (sin extensión) para evitar
    path traversal y caracteres problemáticos. Devuelve un slug seguro.
    """
    # Quitar cualquier componente de ruta.
    name = os.path.basename(name)
    stem = Path(name).stem

    # Normalizar unicode -> ascii aproximado.
    stem = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode("ascii")

    # Reemplazar separadores y caracteres no permitidos.
    stem = re.sub(r"[^\w.\- ]", "_", stem)
    stem = stem.strip().strip(".")
    stem = re.sub(r"\s+", "_", stem)
    stem = re.sub(r"_+", "_", stem)

    if not stem:
        stem = "archivo"
    return stem


def unique_output_path(basename: str) -> Path:
    """
    Devuelve una ruta única dentro de OUTPUT_DIR para `<basename>.md`.
    Si ya existe, agrega sufijo incremental: nombre_1.md, nombre_2.md, ...
    """
    candidate = OUTPUT_DIR / f"{basename}.md"
    if not candidate.exists():
        return candidate

    counter = 1
    while True:
        candidate = OUTPUT_DIR / f"{basename}_{counter}.md"
        if not candidate.exists():
            return candidate
        counter += 1


def is_supported(filename: str) -> bool:
    return Path(filename).suffix.lower() in SUPPORTED_EXTENSIONS


def safe_output_file(filename: str) -> Path:
    """
    Resuelve un nombre de archivo dentro de OUTPUT_DIR de forma segura,
    evitando path traversal. Lanza 404 si es inválido o no existe.
    """
    safe_name = os.path.basename(filename)
    if safe_name != filename or not safe_name.endswith(".md"):
        abort(404)

    target = (OUTPUT_DIR / safe_name).resolve()
    if OUTPUT_DIR.resolve() not in target.parents:
        abort(404)
    if not target.is_file():
        abort(404)
    return target


def list_output_files() -> list[dict]:
    """Lista los .md existentes en OUTPUT_DIR, ordenados por fecha desc."""
    files = []
    for path in OUTPUT_DIR.glob("*.md"):
        if not path.is_file():
            continue
        stat = path.stat()
        files.append(
            {
                "nombre_md": path.name,
                "ruta_absoluta": str(path.resolve()),
                "tamano": human_size(stat.st_size),
                "modificado": stat.st_mtime,
            }
        )
    files.sort(key=lambda f: f["modificado"], reverse=True)
    return files


# --------------------------------------------------------------------------- #
# Rutas
# --------------------------------------------------------------------------- #

@app.route("/")
def index():
    return render_template(
        "index.html",
        max_file_size_mb=MAX_FILE_SIZE_MB,
        supported_extensions=sorted(SUPPORTED_EXTENSIONS),
    )


@app.route("/convert", methods=["POST"])
def convert():
    uploaded = request.files.getlist("files")
    if not uploaded:
        return jsonify({"error": "No se recibieron archivos."}), 400

    results = []

    for file_storage in uploaded:
        original_name = file_storage.filename or "archivo"
        entry = {
            "nombre_original": original_name,
            "nombre_md": None,
            "ruta_absoluta": None,
            "ok": False,
            "error": None,
        }

        if not original_name.strip():
            entry["error"] = "Nombre de archivo vacío."
            results.append(entry)
            continue

        if not is_supported(original_name):
            ext = Path(original_name).suffix or "(sin extensión)"
            entry["error"] = f"Formato no soportado: {ext}"
            results.append(entry)
            continue

        # Guardar el archivo subido de forma temporal y segura.
        temp_name = secure_filename(original_name) or "upload"
        temp_path = UPLOAD_DIR / temp_name

        # Evitar colisiones en uploads temporales.
        counter = 0
        while temp_path.exists():
            counter += 1
            temp_path = UPLOAD_DIR / f"{counter}_{temp_name}"

        try:
            file_storage.save(str(temp_path))

            # Conversión usando la API de markitdown.
            result = _md.convert(str(temp_path))
            markdown_text = result.text_content or ""

            basename = sanitize_basename(original_name)
            out_path = unique_output_path(basename)
            out_path.write_text(markdown_text, encoding="utf-8")

            entry["nombre_md"] = out_path.name
            entry["ruta_absoluta"] = str(out_path.resolve())
            entry["ok"] = True
        except Exception as exc:  # noqa: BLE001 — un fallo no debe romper el lote
            entry["error"] = _friendly_error(exc)
        finally:
            # Limpiar temporal.
            try:
                if temp_path.exists():
                    temp_path.unlink()
            except OSError:
                pass

        results.append(entry)

    return jsonify(results)


def _friendly_error(exc: Exception) -> str:
    """Convierte una excepción en un mensaje legible (sin stack trace)."""
    name = type(exc).__name__
    msg = str(exc).strip()
    if not msg:
        return f"No se pudo convertir el archivo ({name})."
    # Acortar mensajes muy largos.
    if len(msg) > 300:
        msg = msg[:297] + "..."
    return msg


@app.route("/files")
def files():
    return jsonify(list_output_files())


@app.route("/download/<path:filename>")
def download(filename):
    target = safe_output_file(filename)
    return send_from_directory(
        OUTPUT_DIR, target.name, as_attachment=True, mimetype="text/markdown"
    )


@app.route("/preview/<path:filename>")
def preview(filename):
    target = safe_output_file(filename)
    content = target.read_text(encoding="utf-8", errors="replace")
    return jsonify(
        {
            "nombre_md": target.name,
            "ruta_absoluta": str(target.resolve()),
            "contenido": content,
        }
    )


@app.errorhandler(413)
def too_large(_err):
    return (
        jsonify(
            {
                "error": f"Archivo demasiado grande. Máximo permitido: "
                f"{MAX_FILE_SIZE_MB} MB."
            }
        ),
        413,
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}
    print("\n  MarkItDown Converter")
    print(f"  Carpeta de salida: {OUTPUT_DIR.resolve()}")
    print(f"  Abre: http://127.0.0.1:{port}\n")
    # use_reloader=False para no abrir el navegador dos veces desde el lanzador.
    app.run(host="127.0.0.1", port=port, debug=debug, use_reloader=False)
