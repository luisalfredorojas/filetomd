# MarkItDown Converter

Aplicación web **local** (corre solo en tu máquina, sin nube ni API keys) que
envuelve la librería [`microsoft/markitdown`](https://github.com/microsoft/markitdown)
con una interfaz sencilla para convertir **PDF, Word, PowerPoint, Excel, HTML,
CSV, JSON, XML, imágenes y más** a archivos **Markdown (`.md`)**.

La conversión la hace siempre `markitdown` — esta app solo le pone una interfaz
amigable: arrastrar y soltar, lista de selección, conversión por lotes,
previsualización y descarga.

Se ejecuta dentro de **Docker**, así que no tienes que instalar ni configurar
Python: todo va empaquetado y funciona igual en cualquier computadora.

![offline](https://img.shields.io/badge/offline-100%25-success) ![docker](https://img.shields.io/badge/Docker-listo-2496ed) ![python](https://img.shields.io/badge/python-3.13-blue)

---

## 🟢 Guía paso a paso (para cualquier persona)

Solo necesitas **una cosa instalada**: Docker Desktop (es gratis). Lo demás es
automático.

### 📦 Paso 1 — Instala Docker Desktop (solo una vez)

1. Entra a **https://www.docker.com/products/docker-desktop/**
2. Descarga la versión para tu sistema (**Mac** o **Windows**) e instálala como
   cualquier programa.
3. **Abre Docker Desktop** y espera a que el ícono de la ballena 🐳 deje de
   moverse / diga **"running"** (en marcha). Déjalo abierto.

> 💡 Docker es como una "caja" donde la app trae todo lo que necesita para
> funcionar. Lo instalas una vez y sirve para siempre.

### 📥 Paso 2 — Descarga este proyecto

1. Abre **https://github.com/luisalfredorojas/filetomd**
2. Botón verde **`< > Code`** → **`Download ZIP`**.
3. En tu carpeta de **Descargas**, **haz doble clic en el ZIP** para
   descomprimirlo. Tendrás una carpeta llamada **`filetomd-main`**.

### ▶️ Paso 3 — Abre la aplicación

Entra en la carpeta `filetomd-main` y:

- 🍎 **En Mac:** haz doble clic en **`start.command`**.
- 🪟 **En Windows:** haz doble clic en **`start.bat`**.

Se abrirá una ventana negra. **La primera vez tarda unos minutos** (Docker
prepara la app); las siguientes veces abre en segundos. Cuando esté lista, tu
navegador se abre solo con la app. **No cierres la ventana negra mientras la
uses.**

> ⚠️ **Mac, la primera vez** puede mostrar *"Apple no pudo verificar que
> «start.command» esté libre de malware"* (botones *Mover a la papelera / Listo*).
> Es normal. Pulsa **"Listo"**, ve a **Ajustes del Sistema → Privacidad y
> seguridad**, baja y pulsa **"Abrir igualmente"**, y vuelve a abrir
> `start.command`. (Solo la primera vez.)
>
> ⚠️ **Windows, la primera vez** puede salir *"Windows protegió tu PC"* → **Más
> información** → **Ejecutar de todas formas**.

### 🌐 Paso 4 — Usa la app

Tu navegador se abre solo en **http://127.0.0.1:5001** (o el siguiente puerto
libre). Si no se abriera, mira en la ventana negra la línea
*"Abriendo http://127.0.0.1:…"* y escribe esa dirección en tu navegador.

➡️ **Para cerrar la app:** cierra la ventana negra o pulsa `Ctrl + C` en ella.

---

> 🔒 **¿Es seguro / privado?** Sí. Todo ocurre **dentro de tu computadora**: la
> app solo escucha en `127.0.0.1` (tu propia máquina), no se expone a la red ni
> a internet. Tus archivos no se suben a ningún servidor.

---

## Cómo usarla

1. **Arrastra** uno o varios archivos a la zona de carga (o haz clic para
   seleccionarlos).
2. Revisa la **lista de seleccionados**: nombre, extensión, tamaño e ícono.
   Puedes **quitar** los que no quieras antes de convertir.
3. Pulsa **Convertir**. Verás un spinner mientras se procesan.
4. En **Archivos generados** aparece cada `.md` con:
   - Su **nombre**.
   - La **ruta** donde quedó guardado en tu máquina (botón **Copiar ruta**).
   - **Descargar** el `.md`.
   - **Ver**: abre una previsualización (renderizada o texto plano).
5. Los `.md` que generes quedan en la carpeta **`output/`** dentro del proyecto
   (`filetomd-main/output/`).

Si un archivo falla (corrupto, sin texto extraíble, formato no soportado), se
marca como **fallido** con un mensaje claro y **el resto del lote continúa**.

---

## 🛠️ Para usuarios técnicos (línea de comandos)

Con Docker instalado, desde la carpeta del proyecto:

```bash
# clonar (opcional) en vez de descargar el ZIP
git clone https://github.com/luisalfredorojas/filetomd.git
cd filetomd

# construir y levantar
docker compose up --build

# (en otra terminal) detener
docker compose down
```

La app queda en `http://127.0.0.1:5001`. Variables útiles:

| Variable             | Por defecto | Para qué |
|----------------------|-------------|----------|
| `HOST_PORT`          | `5001`      | Puerto en tu máquina (cámbialo si está ocupado). |
| `MAX_FILE_SIZE_MB`   | `50`        | Tamaño máximo por archivo. |
| `DISPLAY_OUTPUT_DIR` | (auto)      | Ruta del host que se muestra en la interfaz. |

```bash
HOST_PORT=8080 MAX_FILE_SIZE_MB=100 docker compose up
```

> **¿Sin Docker?** La app es Flask normal: también puedes crear un entorno con
> Python 3.10–3.13, `pip install -r requirements.txt` y `python app.py`. Pero la
> forma recomendada y soportada es Docker.

---

## Estructura del proyecto

```
filetomd/
├── app.py                # Servidor Flask + endpoints
├── requirements.txt      # flask + markitdown (extras de documentos)
├── Dockerfile            # Imagen de la app (Python 3.13)
├── docker-compose.yml    # Orquestación: puerto, carpeta de salida, etc.
├── .dockerignore
├── start.command         # Lanzador Mac (doble clic) → usa Docker
├── start.sh              # Lanzador terminal (macOS / Linux) → usa Docker
├── start.bat             # Lanzador Windows (doble clic) → usa Docker
├── templates/
│   └── index.html        # Interfaz + estilos embebidos (modo claro, responsive)
├── static/
│   └── app.js            # Lógica frontend (fetch/AJAX, drag & drop, preview)
├── output/               # Aquí aparecen tus .md (carpeta montada en el contenedor)
├── uploads/              # Temporales dentro del contenedor (se limpian solos)
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
- **Tamaño máximo**: 50 MB por archivo por defecto (`MAX_FILE_SIZE_MB`).
- **Dónde quedan los `.md`**: en `output/` dentro de la carpeta del proyecto
  (esa carpeta se "monta" en el contenedor, por eso los ves en tu máquina).
- **Limpieza**: los archivos temporales de subida se eliminan tras convertir.

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

- **"No encuentro Docker" / la ventana se cierra pidiendo instalar Docker** →
  instala **Docker Desktop** (Paso 1) y ábrelo antes de lanzar la app.
- **"Docker no está activo"** → abre **Docker Desktop** y espera a que el ícono
  de la ballena diga **"running"**; luego vuelve a abrir `start.command`.
- **La primera vez tarda mucho** → es normal: Docker está descargando y
  preparando la app. Solo pasa una vez.
- **No abre el navegador solo** → mira la dirección *"Abriendo http://127.0.0.1:…"*
  en la ventana negra y escríbela en tu navegador.
- **Un PDF no genera texto** → puede ser un PDF escaneado (solo imágenes) sin
  capa de texto; no hay texto que extraer.
- **macOS: "no pudo verificar que está libre de malware"** → pulsa **Listo**,
  ve a **Ajustes del Sistema → Privacidad y seguridad → "Abrir igualmente"** y
  vuelve a abrir `start.command`. (Atajo: `xattr -dr com.apple.quarantine
  ~/Downloads/filetomd-main`.) Solo la 1ª vez.

---

## Privacidad

Todo ocurre en tu máquina. La app escucha solo en `127.0.0.1` (no se expone a la
red local ni a internet) y los archivos **no salen de tu equipo**: no hay
llamadas a servicios externos ni API keys.
