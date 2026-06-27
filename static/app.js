/* MarkItDown Converter — frontend vanilla JS */
(() => {
  "use strict";

  const MAX_MB = parseInt(document.body.dataset.maxMb || "50", 10);
  const MAX_BYTES = MAX_MB * 1024 * 1024;

  // --- Estado: archivos seleccionados (antes de convertir) ------------------
  /** @type {Map<string, File>} */
  const selected = new Map();

  // --- Referencias DOM ------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const dropzone = $("#dropzone");
  const fileInput = $("#file-input");
  const selectionBox = $("#selection");
  const selectedList = $("#selected-list");
  const selCount = $("#sel-count");
  const convertBtn = $("#convert-btn");
  const clearBtn = $("#clear-btn");
  const globalError = $("#global-error");
  const resultsList = $("#results-list");
  const emptyResults = $("#empty-results");
  const refreshBtn = $("#refresh-btn");
  const toast = $("#toast");

  // Modal
  const modal = $("#preview-modal");
  const previewTitle = $("#preview-title");
  const previewPath = $("#preview-path");
  const previewRendered = $("#preview-rendered");
  const previewRaw = $("#preview-raw").querySelector("code");

  // --- Iconos por tipo ------------------------------------------------------
  const ICONS = {
    pdf: "📕", doc: "📘", docx: "📘", ppt: "📙", pptx: "📙",
    xls: "📗", xlsx: "📗", csv: "📊", tsv: "📊", json: "🧾", xml: "🧾",
    html: "🌐", htm: "🌐", txt: "📄", md: "📝", rtf: "📄", epub: "📚",
    zip: "🗜️", mp3: "🎵", wav: "🎵", m4a: "🎵",
    png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", bmp: "🖼️",
    tiff: "🖼️", webp: "🖼️",
  };
  const iconFor = (name) => ICONS[ext(name)] || "📄";
  const ext = (name) => (name.split(".").pop() || "").toLowerCase();

  // --- Utilidades -----------------------------------------------------------
  function humanSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let size = bytes / 1024, i = 0;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return `${size.toFixed(1)} ${units[i]}`;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.classList.toggle("toast-error", isError);
    toast.classList.remove("hidden");
    requestAnimationFrame(() => toast.classList.add("show"));
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.classList.add("hidden"), 220);
    }, 2200);
  }

  function showGlobalError(msg) {
    globalError.textContent = msg;
    globalError.classList.remove("hidden");
  }
  function clearGlobalError() {
    globalError.textContent = "";
    globalError.classList.add("hidden");
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Ruta copiada al portapapeles");
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); showToast("Ruta copiada al portapapeles"); }
      catch { showToast("No se pudo copiar", true); }
      document.body.removeChild(ta);
    }
  }

  // --- Selección de archivos ------------------------------------------------
  function keyFor(file) {
    return `${file.name}::${file.size}::${file.lastModified}`;
  }

  function addFiles(fileList) {
    clearGlobalError();
    let rejected = 0;
    for (const file of fileList) {
      if (file.size > MAX_BYTES) {
        rejected++;
        continue;
      }
      selected.set(keyFor(file), file);
    }
    if (rejected > 0) {
      showGlobalError(
        `${rejected} archivo(s) superan el límite de ${MAX_MB} MB y fueron ignorados.`
      );
    }
    renderSelection();
  }

  function removeFile(key) {
    selected.delete(key);
    renderSelection();
  }

  function renderSelection() {
    selectedList.innerHTML = "";
    const count = selected.size;
    selCount.textContent = String(count);

    if (count === 0) {
      selectionBox.classList.add("hidden");
      return;
    }
    selectionBox.classList.remove("hidden");

    for (const [key, file] of selected) {
      const li = document.createElement("li");
      li.className = "file-item";
      li.innerHTML = `
        <div class="file-icon">${iconFor(file.name)}</div>
        <div class="file-meta">
          <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
          <div class="file-sub">
            <span class="badge">${escapeHtml(ext(file.name) || "?")}</span>
            <span>${humanSize(file.size)}</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn btn-danger btn-sm" type="button">Quitar</button>
        </div>`;
      li.querySelector("button").addEventListener("click", () => removeFile(key));
      selectedList.appendChild(li);
    }
  }

  // --- Conversión -----------------------------------------------------------
  function setConverting(on) {
    const label = convertBtn.querySelector(".btn-label");
    const spinner = convertBtn.querySelector(".spinner");
    convertBtn.disabled = on;
    clearBtn.disabled = on;
    label.textContent = on ? "Convirtiendo..." : "Convertir";
    spinner.classList.toggle("hidden", !on);
  }

  async function convert() {
    if (selected.size === 0) return;
    clearGlobalError();
    setConverting(true);

    const form = new FormData();
    for (const file of selected.values()) form.append("files", file, file.name);

    try {
      const res = await fetch("/convert", { method: "POST", body: form });
      if (!res.ok) {
        let msg = `Error del servidor (${res.status}).`;
        try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const results = await res.json();
      const okCount = results.filter((r) => r.ok).length;
      const failCount = results.length - okCount;

      selected.clear();
      renderSelection();
      await loadFiles();

      if (failCount === 0) {
        showToast(`${okCount} archivo(s) convertido(s) correctamente`);
      } else {
        showToast(`${okCount} ok · ${failCount} con error`, failCount > 0 && okCount === 0);
        const failed = results.filter((r) => !r.ok)
          .map((r) => `${r.nombre_original}: ${r.error || "error desconocido"}`)
          .join(" | ");
        showGlobalError(`Algunos archivos fallaron — ${failed}`);
      }
    } catch (err) {
      showGlobalError(err.message || "No se pudo completar la conversión.");
    } finally {
      setConverting(false);
    }
  }

  // --- Listado de resultados ------------------------------------------------
  async function loadFiles() {
    try {
      const res = await fetch("/files");
      const files = await res.json();
      renderResults(files);
    } catch {
      // silencioso; el listado es secundario
    }
  }

  function renderResults(files) {
    resultsList.innerHTML = "";
    if (!files || files.length === 0) {
      emptyResults.classList.remove("hidden");
      return;
    }
    emptyResults.classList.add("hidden");

    for (const f of files) {
      const li = document.createElement("li");
      li.className = "file-item";
      li.innerHTML = `
        <div class="file-icon">📝</div>
        <div class="file-meta">
          <div class="file-name" title="${escapeHtml(f.nombre_md)}">${escapeHtml(f.nombre_md)}</div>
          <div class="result-path" title="${escapeHtml(f.ruta_absoluta)}">${escapeHtml(f.ruta_absoluta)}</div>
          <div class="file-sub"><span>${escapeHtml(f.tamano || "")}</span></div>
        </div>
        <div class="file-actions">
          <button class="btn btn-ghost btn-sm" data-act="copy" type="button" title="Copiar ruta">Copiar ruta</button>
          <button class="btn btn-soft btn-sm" data-act="view" type="button">Ver</button>
          <a class="btn btn-primary btn-sm" href="/download/${encodeURIComponent(f.nombre_md)}">Descargar</a>
        </div>`;
      li.querySelector('[data-act="copy"]').addEventListener("click", () =>
        copyToClipboard(f.ruta_absoluta));
      li.querySelector('[data-act="view"]').addEventListener("click", () =>
        openPreview(f.nombre_md));
      resultsList.appendChild(li);
    }
  }

  // --- Previsualización -----------------------------------------------------
  async function openPreview(name) {
    try {
      const res = await fetch(`/preview/${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error("No se pudo cargar la previsualización.");
      const data = await res.json();
      previewTitle.textContent = data.nombre_md;
      previewPath.textContent = data.ruta_absoluta;
      previewRaw.textContent = data.contenido;
      previewRendered.innerHTML = renderMarkdown(data.contenido);
      setPreviewView("rendered");
      modal.classList.remove("hidden");
    } catch (err) {
      showToast(err.message || "Error al previsualizar", true);
    }
  }

  function closePreview() { modal.classList.add("hidden"); }

  function setPreviewView(view) {
    const rendered = view === "rendered";
    previewRendered.classList.toggle("hidden", !rendered);
    document.querySelector("#preview-raw").classList.toggle("hidden", rendered);
    document.querySelectorAll(".modal-tabs .tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.view === view));
  }

  // Render Markdown ligero (sin dependencias). Cubre lo común.
  function renderMarkdown(md) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let inCode = false, codeBuf = [];
    let listType = null; // 'ul' | 'ol'
    let tableBuf = [];

    const inline = (s) => {
      s = escapeHtml(s);
      s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
      s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, '<img alt="$1" src="$2">');
      s = s.replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
      s = s.replace(/_([^_]+)_/g, "<em>$1</em>");
      return s;
    };

    const flushList = () => { if (listType) { html += `</${listType}>`; listType = null; } };
    const flushTable = () => {
      if (tableBuf.length === 0) return;
      const rows = tableBuf;
      tableBuf = [];
      const splitRow = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      let t = "<table>";
      const header = splitRow(rows[0]);
      t += "<thead><tr>" + header.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead>";
      t += "<tbody>";
      for (let i = 2; i < rows.length; i++) {
        const cells = splitRow(rows[i]);
        t += "<tr>" + cells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>";
      }
      t += "</tbody></table>";
      html += t;
    };

    const isTableSep = (l) => /^\s*\|?[\s:|-]+\|?\s*$/.test(l) && l.includes("-");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Bloques de código
      if (/^```/.test(line)) {
        if (inCode) { html += `<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`; codeBuf = []; inCode = false; }
        else { flushList(); flushTable(); inCode = true; }
        continue;
      }
      if (inCode) { codeBuf.push(line); continue; }

      // Tablas
      const looksTableRow = /^\s*\|.*\|\s*$/.test(line);
      if (looksTableRow && tableBuf.length === 0 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        flushList(); tableBuf.push(line); continue;
      }
      if (tableBuf.length > 0) {
        if (looksTableRow || isTableSep(line)) { tableBuf.push(line); continue; }
        else { flushTable(); }
      }

      // Vacío
      if (line.trim() === "") { flushList(); continue; }

      // Encabezados
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { flushList(); html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; continue; }

      // HR
      if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(line.trim())) { flushList(); html += "<hr>"; continue; }

      // Blockquote
      if (/^>\s?/.test(line)) { flushList(); html += `<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>`; continue; }

      // Listas
      const ul = line.match(/^\s*[-*+]\s+(.*)$/);
      const ol = line.match(/^\s*\d+\.\s+(.*)$/);
      if (ul) {
        if (listType !== "ul") { flushList(); html += "<ul>"; listType = "ul"; }
        html += `<li>${inline(ul[1])}</li>`; continue;
      }
      if (ol) {
        if (listType !== "ol") { flushList(); html += "<ol>"; listType = "ol"; }
        html += `<li>${inline(ol[1])}</li>`; continue;
      }

      // Párrafo
      flushList();
      html += `<p>${inline(line)}</p>`;
    }
    flushList();
    flushTable();
    if (inCode) html += `<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`;
    return html || "<p class='empty-hint'>(documento vacío)</p>";
  }

  // --- Eventos --------------------------------------------------------------
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", (e) => {
    addFiles(e.target.files);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.add("dragover");
    }));
  ["dragleave", "drop"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.remove("dragover");
    }));
  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  convertBtn.addEventListener("click", convert);
  clearBtn.addEventListener("click", () => { selected.clear(); renderSelection(); clearGlobalError(); });
  refreshBtn.addEventListener("click", loadFiles);

  // Modal events
  modal.addEventListener("click", (e) => { if (e.target.dataset.close !== undefined) closePreview(); });
  document.querySelectorAll(".modal-tabs .tab").forEach((t) =>
    t.addEventListener("click", () => setPreviewView(t.dataset.view)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) closePreview();
  });

  // --- Init -----------------------------------------------------------------
  loadFiles();
})();
