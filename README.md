# MarkItDown Converter

Aplicación web **local** (corre solo en tu máquina, sin nube ni API keys) que
envuelve la librería [`microsoft/markitdown`](https://github.com/microsoft/markitdown)
con una interfaz sencilla para convertir **PDF, Word, PowerPoint, Excel, HTML,
CSV, JSON, XML, imágenes y más** a archivos **Markdown (`.md`)**.

La conversión la hace siempre `markitdown` — esta app solo le pone una interfaz
amigable: arrastrar y soltar, lista de selección, conversión por lotes,
previsualización y descarga.

![offline](https://img.shields.io/badge/offline-100%25-success) ![sin-python](https://img.shields.io/badge/no%20necesitas%20Python-✓-blue) ![flask](https://img.shields.io/badge/flask-3.x-black)

---

## 🟢 Guía para personas NO técnicas (paso a paso)

> No necesitas saber programar **ni tener Python instalado**. Solo seguir estos
> 3 pasos. La primera vez tarda 1–2 minutos (descarga lo necesario); después
> abre en segundos.

### 📥 Paso 1 — Descarga el proyecto a tu computadora

1. Abre esta página en tu navegador:
   **https://github.com/luisalfredorojas/filetomd**
2. Haz clic en el botón verde **`< > Code`** (arriba a la derecha).
3. En el menú que aparece, haz clic en **`Download ZIP`**.
4. Ve a tu carpeta de **Descargas** y **haz doble clic en el ZIP** para
   descomprimirlo. Te quedará una carpeta llamada **`filetomd-main`**.
5. (Recomendado) Muévela a un lugar cómodo, por ejemplo tu **Escritorio**.

### ▶️ Paso 2 — Abre la aplicación

Entra en la carpeta `filetomd-main` y:

#### 🍎 En Mac

- **Haz doble clic en `start.command`**.
- Se abrirá una ventana negra (Terminal) y, en unos segundos, tu navegador con
  la app lista. **No cierres la ventana negra mientras uses la app.**

> ⚠️ Si Mac muestra *"no se puede abrir porque es de un desarrollador no
> identificado"*: haz **clic derecho** sobre `start.command` → **Abrir** →
> **Abrir**. Solo hay que hacerlo la primera vez.

#### 🪟 En Windows

- **Haz doble clic en `start.bat`**.
- Se abrirá una ventana y, en unos segundos, tu navegador con la app.
- **No cierres esa ventana mientras uses la app.**

> ⚠️ Si Windows muestra una pantalla azul *"Windows protegió tu PC"*: haz clic
> en **Más información** → **Ejecutar de todas formas**. Solo la primera vez.

### 🌐 Paso 3 — Usa la app

Tu navegador se abre solo en **http://127.0.0.1:5000**. Si no se abre solo,
escribe esa dirección en tu navegador.

➡️ **Para cerrar la app:** simplemente cierra la ventana negra (Terminal) que se
abrió, o pulsa `Ctrl + C` dentro de ella.

---

> 🔒 **¿Es seguro?** Sí. Todo ocurre **dentro de tu computadora**. Tus archivos
> no se suben a internet ni se envían a ningún servidor. No necesita cuenta ni
> contraseñas.
>
> 🔧 **¿Cómo funciona por dentro?** El lanzador usa
> [`uv`](https://docs.astral.sh/uv/), una herramienta ligera que descarga el
> Python correcto e instala todo lo necesario **dentro de la propia carpeta del
> proyecto** (no ensucia tu sistema). Si no tienes `uv`, el lanzador lo instala
> solo automáticamente.

---

## La app se abre en

### 👉 http://127.0.0.1:5000

---

## Cómo usarla

1. **Arrastra** uno o varios archivos a la zona de carga (o haz clic para
   seleccionarlos).
2. Revisa la **lista de seleccionados**: nombre, extensión, tamaño e ícono.
   Puedes **quitar** los que no quieras antes de convertir.
3. Pulsa **Convertir**. Verás un spinner mientras se procesan.
4. En **Archivos generados** aparece cada `.md` con:
   - Su **nombre**.
   - La **ruta absoluta** en disco (botón **Copiar ruta**).
   - **Descargar** el `.md`.
   - **Ver**: abre una previsualización (renderizada o texto plano).
5. El listado **persiste**: al recargar la página se leen los `.md` que ya
   existen en `output/`.

Si un archivo falla (corrupto, sin texto extraíble, formato no soportado), se
marca como **fallido** con un mensaje claro y **el resto del lote continúa**.

---

## 🛠️ Instalación manual (opcional, para usuarios técnicos)

Si prefieres gestionar Python tú mismo (necesitas **Python 3.10–3.13**):

```bash
# (opcional) clonar con git en vez de descargar el ZIP
git clone https://github.com/luisalfredorojas/filetomd.git
cd filetomd

# 1. Crear el entorno virtual
python3 -m venv .venv

# 2. Activarlo
source .venv/bin/activate          # macOS / Linux
# .venv\Scripts\Activate.ps1       # Windows (PowerShell)

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Levantar la app
python app.py
```

> **Nota sobre Python 3.14:** algunas dependencias de `markitdown` aún no
> publican versiones para Python 3.14. Usa Python 3.10–3.13, o simplemente usa
> el lanzador (`start.command` / `start.bat` / `start.sh`), que ya provisiona
> un Python 3.13 compatible automáticamente.

---

## Estructura del proyecto

```
filetomd/
├── app.py              # Servidor Flask + endpoints
├── requirements.txt    # flask + markitdown (extras de documentos)
├── start.command       # Lanzador macOS (doble clic)
├── start.sh            # Lanzador terminal (macOS / Linux)
├── start.bat           # Lanzador Windows (doble clic)
├── .python-version     # Fija Python 3.13 para uv
├── templates/
│   └── index.html      # Interfaz + estilos embebidos (modo claro, responsive)
├── static/
│   └── app.js          # Lógica frontend (fetch/AJAX, drag & drop, preview)
├── output/             # Aquí se guardan los .md generados
├── uploads/            # Archivos subidos temporalmente (se limpian solos)
├── .venv/              # Entorno virtual (se crea automáticamente)
└── README.md
```

---

## Endpoints (API)

| Método | Ruta                    | Descripción                                                   |
|--------|-------------------------|--------------------------------------------------------------|
| `GET`  | `/`                     | Sirve la interfaz.                                            |
| `POST` | `/convert`              | Recibe archivos (multipart) y devuelve JSON con el resultado.|
| `GET`  | `/files`                | Lista los `.md` existentes en `output/`.                     |
| `GET`  | `/download/<filename>`  | Descarga un `.md` desde `output/`.                           |
| `GET`  | `/preview/<filename>`   | Devuelve el contenido de un `.md` para previsualizar.        |

**Respuesta de `/convert`** (un objeto por archivo):

```json
[
  {
    "nombre_original": "informe.pdf",
    "nombre_md": "informe.md",
    "ruta_absoluta": "/ruta/a/output/informe.md",
    "ok": true,
    "error": null
  }
]
```

---

## Detalles de comportamiento

- **Nombres de salida**: `informe.pdf` → `informe.md`. Si ya existe, **no se
  sobrescribe**: se agrega sufijo incremental (`informe_1.md`, `informe_2.md`…).
- **Sanitización**: los nombres se limpian para evitar *path traversal* y
  caracteres problemáticos.
- **Validación de formato**: se validan las extensiones soportadas antes de
  intentar convertir.
- **Tamaño máximo**: 50 MB por archivo por defecto. Configurable con la variable
  de entorno `MAX_FILE_SIZE_MB`:

  ```bash
  MAX_FILE_SIZE_MB=100 ./start.sh
  ```

- **Puerto**: 5000 por defecto. Cámbialo con `PORT` (útil si el 5000 está
  ocupado; en macOS lo usa a veces AirPlay):

  ```bash
  PORT=5050 ./start.sh
  ```

- **Limpieza**: los archivos temporales en `uploads/` se eliminan tras convertir.

---

## Formatos soportados (offline)

PDF · DOCX · PPTX · XLSX · XLS · MSG (Outlook) · CSV · TSV · JSON · XML ·
HTML/HTM · TXT · MD · EPUB · IPYNB · ZIP · imágenes (PNG, JPG, GIF, BMP,
TIFF, WEBP).

> Se usan los extras de documentos de markitdown
> (`[pdf,docx,pptx,xlsx,xls,outlook]`) en lugar de `[all]` **a propósito**:
> `[all]` arrastra servicios de nube (Azure Document Intelligence, transcripción
> de YouTube/audio) que necesitan red o API keys y que esta app **local y
> offline** no usa.

---

## Solución de problemas

- **No abre el navegador solo** → abre manualmente http://127.0.0.1:5000.
- **El puerto 5000 está ocupado** → arranca con otro puerto: `PORT=5050 ./start.sh`.
- **Un PDF no genera texto** → puede ser un PDF escaneado (solo imágenes) sin
  capa de texto; no hay texto que extraer.
- **macOS bloquea `start.command`** → clic derecho → **Abrir** (solo la 1ª vez).

---

## Privacidad

Todo ocurre en tu máquina. Los archivos **no salen de tu equipo**: no hay
llamadas a servicios externos ni API keys.
