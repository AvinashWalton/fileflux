/* ============================================================
   FileFlux — script.js
   Author: Avinash Walton
   All conversions run 100% in the browser. Zero server calls.
   ============================================================ */

"use strict";

/* ── PDF.js worker ── */
if (typeof pdfjsLib !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* ============================================================
   UTILITIES
   ============================================================ */

function showToast(msg, type = "info", duration = 3000) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.className = "toast"), duration);
}

function setProgress(fillId, statusId, pct, msg) {
  const fill = document.getElementById(fillId);
  const status = document.getElementById(statusId);
  if (fill) fill.style.width = pct + "%";
  if (status) status.textContent = msg || "";
}

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }, 1000);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
}

function basename(filename) {
  return filename.replace(/\.[^/.]+$/, "");
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

/* ============================================================
   DROP ZONE SETUP
   ============================================================ */

function setupDropZone(dzId, inputId, onFile, { multiple = false } = {}) {
  const dz = document.getElementById(dzId);
  const input = document.getElementById(inputId);
  if (!dz || !input) return;

  dz.addEventListener("dragover", (e) => {
    e.preventDefault();
    dz.classList.add("dragover");
  });
  dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    dz.classList.remove("dragover");
    const files = multiple ? Array.from(e.dataTransfer.files) : [e.dataTransfer.files[0]];
    if (files[0]) onFile(multiple ? files : files[0]);
  });
  input.addEventListener("change", () => {
    if (!input.files.length) return;
    const files = multiple ? Array.from(input.files) : input.files[0];
    onFile(files);
  });
}

function markDropZone(dzId, fileName) {
  const dz = document.getElementById(dzId);
  if (!dz) return;
  dz.classList.add("has-file");
  const hint = dz.querySelector(".dz-hint");
  if (hint) hint.textContent = "✅ " + fileName;
}

/* ============================================================
   TABS
   ============================================================ */

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    const id = "tab-" + btn.dataset.tab;
    const panel = document.getElementById(id);
    if (panel) panel.classList.add("active");
  });
});

/* ============================================================
   HAMBURGER MENU
   ============================================================ */
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");
hamburger?.addEventListener("click", () => {
  const open = hamburger.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", open);
  mobileNav.classList.toggle("open", open);
  mobileNav.setAttribute("aria-hidden", !open);
});
mobileNav?.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    hamburger.classList.remove("open");
    mobileNav.classList.remove("open");
    mobileNav.setAttribute("aria-hidden", true);
  })
);

/* ============================================================
   YEAR IN FOOTER
   ============================================================ */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ============================================================
   1. PNG → JPG
   ============================================================ */
(function () {
  let _file = null;
  const qualitySlider = document.getElementById("q-png2jpg");
  const qualityVal = document.getElementById("q-png2jpg-val");
  const bgInput = document.getElementById("bg-png2jpg");
  const btn = document.getElementById("btn-png2jpg");
  const prevArea = document.getElementById("prev-png2jpg");

  qualitySlider?.addEventListener("input", () => {
    qualityVal.textContent = qualitySlider.value;
  });

  setupDropZone("dz-png2jpg", "file-png2jpg", (file) => {
    if (!file || !file.type.includes("png")) {
      showToast("Please select a PNG file.", "error"); return;
    }
    _file = file;
    markDropZone("dz-png2jpg", file.name);
    btn.disabled = false;
    prevArea.innerHTML = "";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    prevArea.appendChild(img);
  });

  btn?.addEventListener("click", async () => {
    if (!_file) return;
    try {
      btn.disabled = true;
      btn.textContent = "Converting…";
      const img = await loadImageFromFile(_file);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = bgInput.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, "image/jpeg", parseInt(qualitySlider.value) / 100);
      triggerDownload(URL.createObjectURL(blob), basename(_file.name) + ".jpg");
      showToast("✅ JPG downloaded!", "success");
    } catch (e) {
      showToast("Conversion failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Convert & Download JPG";
    }
  });
})();

/* ============================================================
   2. JPG → PNG
   ============================================================ */
(function () {
  let _file = null;
  const btn = document.getElementById("btn-jpg2png");
  const prevArea = document.getElementById("prev-jpg2png");

  setupDropZone("dz-jpg2png", "file-jpg2png", (file) => {
    if (!file || (!file.type.includes("jpeg") && !file.type.includes("jpg"))) {
      showToast("Please select a JPG/JPEG file.", "error"); return;
    }
    _file = file;
    markDropZone("dz-jpg2png", file.name);
    btn.disabled = false;
    prevArea.innerHTML = "";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    prevArea.appendChild(img);
  });

  btn?.addEventListener("click", async () => {
    if (!_file) return;
    try {
      btn.disabled = true;
      btn.textContent = "Converting…";
      const img = await loadImageFromFile(_file);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, "image/png");
      triggerDownload(URL.createObjectURL(blob), basename(_file.name) + ".png");
      showToast("✅ PNG downloaded!", "success");
    } catch (e) {
      showToast("Conversion failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Convert & Download PNG";
    }
  });
})();

/* ============================================================
   3. PDF → Image (PDF.js)
   ============================================================ */
(function () {
  let _file = null;
  const scaleSlider = document.getElementById("scale-pdf2img");
  const scaleVal = document.getElementById("scale-pdf2img-val");
  const btn = document.getElementById("btn-pdf2img");
  const prevArea = document.getElementById("prev-pdf2img");
  const progressWrap = document.getElementById("pdf2img-progress");

  scaleSlider?.addEventListener("input", () => {
    scaleVal.textContent = scaleSlider.value + "x";
  });

  setupDropZone("dz-pdf2img", "file-pdf2img", (file) => {
    if (!file || file.type !== "application/pdf") {
      showToast("Please select a PDF file.", "error"); return;
    }
    _file = file;
    markDropZone("dz-pdf2img", file.name);
    btn.disabled = false;
    prevArea.innerHTML = "";
  });

  btn?.addEventListener("click", async () => {
    if (!_file || typeof pdfjsLib === "undefined") {
      showToast("PDF.js not loaded. Check your connection.", "error"); return;
    }
    try {
      btn.disabled = true;
      btn.textContent = "Processing…";
      progressWrap.hidden = false;
      prevArea.innerHTML = "";

      const arrayBuffer = await _file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const total = pdf.numPages;
      const scale = parseFloat(scaleSlider.value);

      for (let i = 1; i <= total; i++) {
        setProgress("pdf2img-fill", "pdf2img-status", Math.round((i / total) * 100), `Page ${i}/${total}…`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

        const blob = await canvasToBlob(canvas, "image/png");
        const url = URL.createObjectURL(blob);

        // Show thumbnail
        const thumb = document.createElement("img");
        thumb.src = url;
        thumb.title = `Page ${i}`;
        prevArea.appendChild(thumb);

        // Download
        triggerDownload(url, `${basename(_file.name)}_page${i}.png`);
        await new Promise((r) => setTimeout(r, 300));
      }
      showToast(`✅ ${total} page(s) downloaded!`, "success");
    } catch (e) {
      showToast("PDF error: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Convert Pages to PNG";
      progressWrap.hidden = true;
    }
  });
})();

/* ============================================================
   4. Image → PDF (jsPDF)
   ============================================================ */
(function () {
  let _files = [];
  const btn = document.getElementById("btn-img2pdf");
  const prevArea = document.getElementById("prev-img2pdf");

  setupDropZone("dz-img2pdf", "file-img2pdf", (files) => {
    _files = files.filter((f) => f.type.startsWith("image/"));
    if (!_files.length) { showToast("No valid images selected.", "error"); return; }
    markDropZone("dz-img2pdf", `${_files.length} file(s) selected`);
    btn.disabled = false;
    prevArea.innerHTML = "";
    _files.forEach((f) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(f);
      prevArea.appendChild(img);
    });
  }, { multiple: true });

  btn?.addEventListener("click", async () => {
    if (!_files.length || typeof jspdf === "undefined") {
      showToast("jsPDF not loaded. Check your connection.", "error"); return;
    }
    try {
      btn.disabled = true;
      btn.textContent = "Generating PDF…";
      const { jsPDF } = jspdf;

      let pdf = null;
      for (let i = 0; i < _files.length; i++) {
        const img = await loadImageFromFile(_files[i]);
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const orientation = w > h ? "l" : "p";
        if (i === 0) {
          pdf = new jsPDF({ orientation, unit: "px", format: [w, h] });
        } else {
          pdf.addPage([w, h], orientation);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(dataUrl, "JPEG", 0, 0, w, h);
      }
      pdf.save("images_to_pdf.pdf");
      showToast("✅ PDF downloaded!", "success");
    } catch (e) {
      showToast("PDF generation failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Convert to PDF & Download";
    }
  });
})();

/* ============================================================
   5. Text → Image
   ============================================================ */
(function () {
  const textarea = document.getElementById("txt2img-text");
  const fontSel = document.getElementById("txt2img-font");
  const fontSize = document.getElementById("txt2img-size");
  const textColor = document.getElementById("txt2img-color");
  const bgColor = document.getElementById("txt2img-bg");
  const canvasW = document.getElementById("txt2img-w");
  const padding = document.getElementById("txt2img-pad");
  const prevArea = document.getElementById("prev-txt2img");
  const btnPrev = document.getElementById("btn-txt2img-preview");
  const btnDl = document.getElementById("btn-txt2img-dl");

  function renderTextCanvas() {
    const text = textarea?.value || "";
    const font = fontSel?.value || "sans-serif";
    const size = parseInt(fontSize?.value) || 28;
    const color = textColor?.value || "#111111";
    const bg = bgColor?.value || "#ffffff";
    const width = Math.min(parseInt(canvasW?.value) || 800, 4000);
    const pad = parseInt(padding?.value) || 40;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = `${size}px ${font}`;

    const usableW = width - pad * 2;
    const lines = [];
    const rawLines = text.split("\n");
    rawLines.forEach((line) => {
      if (!line.trim()) { lines.push(""); return; }
      const words = line.split(" ");
      let cur = "";
      words.forEach((word) => {
        const test = cur ? cur + " " + word : word;
        if (ctx.measureText(test).width > usableW && cur) {
          lines.push(cur);
          cur = word;
        } else {
          cur = test;
        }
      });
      if (cur) lines.push(cur);
    });

    const lineH = size * 1.5;
    const height = pad * 2 + lines.length * lineH;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.font = `${size}px ${font}`;
    ctx.textBaseline = "top";

    lines.forEach((line, i) => {
      ctx.fillText(line, pad, pad + i * lineH);
    });

    return canvas;
  }

  btnPrev?.addEventListener("click", () => {
    const canvas = renderTextCanvas();
    prevArea.innerHTML = "";
    canvas.style.maxWidth = "100%";
    prevArea.appendChild(canvas);
  });

  btnDl?.addEventListener("click", async () => {
    const text = textarea?.value?.trim();
    if (!text) { showToast("Please enter some text first.", "error"); return; }
    const canvas = renderTextCanvas();
    const blob = await canvasToBlob(canvas, "image/png");
    triggerDownload(URL.createObjectURL(blob), "text_image.png");
    showToast("✅ Image downloaded!", "success");
  });
})();

/* ============================================================
   6. Image → Text (Tesseract OCR)
   ============================================================ */
(function () {
  let _file = null;
  const btn = document.getElementById("btn-img2txt");
  const langSel = document.getElementById("img2txt-lang");
  const prevArea = document.getElementById("prev-img2txt");
  const progressWrap = document.getElementById("ocr-progress");
  const resultWrap = document.getElementById("ocr-result-wrap");
  const resultTA = document.getElementById("ocr-result");
  const btnCopy = document.getElementById("btn-copy-ocr");
  const btnDl = document.getElementById("btn-dl-ocr");

  setupDropZone("dz-img2txt", "file-img2txt", (file) => {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please select a valid image.", "error"); return;
    }
    _file = file;
    markDropZone("dz-img2txt", file.name);
    btn.disabled = false;
    prevArea.innerHTML = "";
    resultWrap.hidden = true;
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    prevArea.appendChild(img);
  });

  btn?.addEventListener("click", async () => {
    if (!_file || typeof Tesseract === "undefined") {
      showToast("Tesseract.js not loaded. Check your connection.", "error"); return;
    }
    try {
      btn.disabled = true;
      btn.textContent = "Extracting…";
      progressWrap.hidden = false;
      resultWrap.hidden = true;

      const lang = langSel?.value || "eng";
      const result = await Tesseract.recognize(_file, lang, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const pct = Math.round(m.progress * 100);
            setProgress("ocr-fill", "ocr-status", pct, `Recognizing… ${pct}%`);
          } else {
            setProgress("ocr-fill", "ocr-status", 10, m.status + "…");
          }
        },
      });
      resultTA.value = result.data.text;
      resultWrap.hidden = false;
      showToast("✅ Text extracted!", "success");
    } catch (e) {
      showToast("OCR failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Extract Text";
      progressWrap.hidden = true;
    }
  });

  btnCopy?.addEventListener("click", () => {
    navigator.clipboard.writeText(resultTA.value);
    showToast("Copied to clipboard!", "info");
  });

  btnDl?.addEventListener("click", () => {
    const blob = new Blob([resultTA.value], { type: "text/plain" });
    triggerDownload(URL.createObjectURL(blob), "extracted_text.txt");
    showToast("✅ Text file downloaded!", "success");
  });
})();

/* ============================================================
   7. PDF → Text (PDF.js)
   ============================================================ */
(function () {
  let _file = null;
  const btn = document.getElementById("btn-pdf2txt");
  const progressWrap = document.getElementById("pdf2txt-progress");
  const resultWrap = document.getElementById("pdf2txt-result-wrap");
  const resultTA = document.getElementById("pdf2txt-result");
  const btnCopy = document.getElementById("btn-copy-pdf2txt");
  const btnDl = document.getElementById("btn-dl-pdf2txt");

  setupDropZone("dz-pdf2txt", "file-pdf2txt", (file) => {
    if (!file || file.type !== "application/pdf") {
      showToast("Please select a PDF file.", "error"); return;
    }
    _file = file;
    markDropZone("dz-pdf2txt", file.name);
    btn.disabled = false;
    resultWrap.hidden = true;
  });

  btn?.addEventListener("click", async () => {
    if (!_file || typeof pdfjsLib === "undefined") {
      showToast("PDF.js not loaded. Check your connection.", "error"); return;
    }
    try {
      btn.disabled = true;
      btn.textContent = "Extracting…";
      progressWrap.hidden = false;

      const arrayBuffer = await _file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const total = pdf.numPages;
      let fullText = "";

      for (let i = 1; i <= total; i++) {
        setProgress("pdf2txt-fill", "pdf2txt-status", Math.round((i / total) * 100), `Page ${i}/${total}…`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

      resultTA.value = fullText.trim();
      resultWrap.hidden = false;
      showToast("✅ Text extracted!", "success");
    } catch (e) {
      showToast("Extraction failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Extract Text";
      progressWrap.hidden = true;
    }
  });

  btnCopy?.addEventListener("click", () => {
    navigator.clipboard.writeText(resultTA.value);
    showToast("Copied to clipboard!", "info");
  });

  btnDl?.addEventListener("click", () => {
    const blob = new Blob([resultTA.value], { type: "text/plain" });
    triggerDownload(URL.createObjectURL(blob), "pdf_text.txt");
    showToast("✅ Text file downloaded!", "success");
  });
})();

/* ============================================================
   8. Text → PDF (jsPDF)
   ============================================================ */
(function () {
  const btn = document.getElementById("btn-txt2pdf");
  const titleInput = document.getElementById("txt2pdf-title");
  const contentTA = document.getElementById("txt2pdf-text");
  const sizeInput = document.getElementById("txt2pdf-size");
  const pageSelect = document.getElementById("txt2pdf-page");
  const colorInput = document.getElementById("txt2pdf-color");

  btn?.addEventListener("click", () => {
    if (typeof jspdf === "undefined") {
      showToast("jsPDF not loaded. Check your connection.", "error"); return;
    }
    const text = contentTA?.value?.trim();
    if (!text) { showToast("Please enter some content.", "error"); return; }

    try {
      btn.disabled = true;
      btn.textContent = "Generating…";
      const { jsPDF } = jspdf;
      const pageSize = pageSelect?.value || "a4";
      const fontSize = parseInt(sizeInput?.value) || 12;
      const hexColor = colorInput?.value || "#111111";
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      const pdf = new jsPDF({ unit: "mm", format: pageSize });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const usable = pw - margin * 2;

      pdf.setFontSize(fontSize);
      pdf.setTextColor(r, g, b);

      let y = margin;

      // Title
      const title = titleInput?.value?.trim();
      if (title) {
        pdf.setFontSize(fontSize + 6);
        pdf.setFont("helvetica", "bold");
        pdf.text(title, margin, y);
        y += 12;
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", "normal");
      }

      const lines = pdf.splitTextToSize(text, usable);
      const lineH = fontSize * 0.4 + 1.5;

      lines.forEach((line) => {
        if (y + lineH > ph - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += lineH;
      });

      const filename = (title || "document").replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".pdf";
      pdf.save(filename);
      showToast("✅ PDF downloaded!", "success");
    } catch (e) {
      showToast("PDF generation failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate & Download PDF";
    }
  });
})();

/* ============================================================
   9. Image Resizer
   ============================================================ */
(function () {
  let _file = null;
  let _origW = 0, _origH = 0;
  const wInput = document.getElementById("resize-w");
  const hInput = document.getElementById("resize-h");
  const lockCB = document.getElementById("resize-lock");
  const fmtSel = document.getElementById("resize-fmt");
  const btn = document.getElementById("btn-resize");
  const prevArea = document.getElementById("prev-resize");
  const infoEl = document.getElementById("resize-info");

  setupDropZone("dz-resize", "file-resize", async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please select a valid image.", "error"); return;
    }
    _file = file;
    const img = await loadImageFromFile(file);
    _origW = img.naturalWidth;
    _origH = img.naturalHeight;
    wInput.value = _origW;
    hInput.value = _origH;
    infoEl.textContent = `Original: ${_origW} × ${_origH}px · ${formatBytes(file.size)}`;
    infoEl.style.display = "inline-block";
    markDropZone("dz-resize", file.name);
    btn.disabled = false;
    prevArea.innerHTML = "";
    const thumb = document.createElement("img");
    thumb.src = URL.createObjectURL(file);
    prevArea.appendChild(thumb);
  });

  wInput?.addEventListener("input", () => {
    if (lockCB?.checked && _origH) {
      const ratio = _origH / _origW;
      hInput.value = Math.round(parseInt(wInput.value) * ratio);
    }
  });
  hInput?.addEventListener("input", () => {
    if (lockCB?.checked && _origW) {
      const ratio = _origW / _origH;
      wInput.value = Math.round(parseInt(hInput.value) * ratio);
    }
  });

  btn?.addEventListener("click", async () => {
    if (!_file) return;
    try {
      btn.disabled = true;
      btn.textContent = "Resizing…";
      const img = await loadImageFromFile(_file);
      const w = parseInt(wInput.value) || _origW;
      const h = parseInt(hInput.value) || _origH;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const mime = fmtSel?.value || "image/png";
      const ext = mime.split("/")[1];
      const blob = await canvasToBlob(canvas, mime, 0.92);
      triggerDownload(URL.createObjectURL(blob), `${basename(_file.name)}_${w}x${h}.${ext}`);
      showToast(`✅ Resized to ${w}×${h} and downloaded!`, "success");
    } catch (e) {
      showToast("Resize failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Resize & Download";
    }
  });
})();

/* ============================================================
   10. Image Compressor
   ============================================================ */
(function () {
  let _file = null;
  const qSlider = document.getElementById("q-compress");
  const qVal = document.getElementById("q-compress-val");
  const btn = document.getElementById("btn-compress");
  const prevArea = document.getElementById("prev-compress");
  const statsEl = document.getElementById("compress-stats");

  qSlider?.addEventListener("input", () => { qVal.textContent = qSlider.value; });

  setupDropZone("dz-compress", "file-compress", (file) => {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please select a valid image.", "error"); return;
    }
    _file = file;
    markDropZone("dz-compress", file.name);
    btn.disabled = false;
    prevArea.innerHTML = "";
    statsEl.hidden = true;
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    prevArea.appendChild(img);
  });

  btn?.addEventListener("click", async () => {
    if (!_file) return;
    try {
      btn.disabled = true;
      btn.textContent = "Compressing…";
      const img = await loadImageFromFile(_file);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const quality = parseInt(qSlider.value) / 100;
      const blob = await canvasToBlob(canvas, "image/jpeg", quality);
      const saved = _file.size - blob.size;
      const pct = Math.round((saved / _file.size) * 100);
      statsEl.textContent = `Original: ${formatBytes(_file.size)} → Compressed: ${formatBytes(blob.size)} (${pct > 0 ? "−" : "+"}${Math.abs(pct)}%)`;
      statsEl.hidden = false;
      triggerDownload(URL.createObjectURL(blob), `${basename(_file.name)}_compressed.jpg`);
      showToast("✅ Compressed & downloaded!", "success");
    } catch (e) {
      showToast("Compression failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Compress & Download";
    }
  });
})();

/* ============================================================
   11. Merge Images
   ============================================================ */
(function () {
  let _files = [];
  const btn = document.getElementById("btn-merge");
  const dirSel = document.getElementById("merge-dir");
  const gapInput = document.getElementById("merge-gap");
  const gapColor = document.getElementById("merge-gap-color");
  const prevArea = document.getElementById("prev-merge");

  setupDropZone("dz-merge", "file-merge", (files) => {
    _files = files.filter((f) => f.type.startsWith("image/"));
    if (_files.length < 2) { showToast("Please select at least 2 images.", "error"); return; }
    markDropZone("dz-merge", `${_files.length} images selected`);
    btn.disabled = false;
    prevArea.innerHTML = "";
    _files.forEach((f) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(f);
      prevArea.appendChild(img);
    });
  }, { multiple: true });

  btn?.addEventListener("click", async () => {
    if (_files.length < 2) return;
    try {
      btn.disabled = true;
      btn.textContent = "Merging…";
      const dir = dirSel?.value || "vertical";
      const gap = parseInt(gapInput?.value) || 0;
      const gColor = gapColor?.value || "#ffffff";
      const images = await Promise.all(_files.map(loadImageFromFile));

      let totalW = 0, totalH = 0;
      if (dir === "vertical") {
        totalW = Math.max(...images.map((i) => i.naturalWidth));
        totalH = images.reduce((sum, i) => sum + i.naturalHeight, 0) + gap * (images.length - 1);
      } else {
        totalW = images.reduce((sum, i) => sum + i.naturalWidth, 0) + gap * (images.length - 1);
        totalH = Math.max(...images.map((i) => i.naturalHeight));
      }

      const canvas = document.createElement("canvas");
      canvas.width = totalW; canvas.height = totalH;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = gColor;
      ctx.fillRect(0, 0, totalW, totalH);

      let offset = 0;
      images.forEach((img) => {
        if (dir === "vertical") {
          ctx.drawImage(img, 0, offset);
          offset += img.naturalHeight + gap;
        } else {
          ctx.drawImage(img, offset, 0);
          offset += img.naturalWidth + gap;
        }
      });

      const blob = await canvasToBlob(canvas, "image/png");
      triggerDownload(URL.createObjectURL(blob), "merged_image.png");
      showToast("✅ Merged image downloaded!", "success");
    } catch (e) {
      showToast("Merge failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Merge & Download PNG";
    }
  });
})();

/* ============================================================
   DRAG-OVER GLOBAL (prevent browser default)
   ============================================================ */
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());

/* ============================================================
   SHARED UTILITY: Target-size binary search
   Renders all PDF pages at a given JPEG quality → returns jsPDF blob size in bytes
   ============================================================ */

async function renderPdfToJsPDF(pdfDoc, targetWmm, targetHmm, scale, jpegQuality) {
  const { jsPDF } = jspdf;
  const MM_TO_PX = 3.7795275591;
  const targetWpx = targetWmm * MM_TO_PX;
  const targetHpx = targetHmm * MM_TO_PX;
  const total = pdfDoc.numPages;
  let pdf = null;

  for (let i = 1; i <= total; i++) {
    const page = await pdfDoc.getPage(i);
    const origVP = page.getViewport({ scale: 1 });
    const scaleX = targetWpx / origVP.width;
    const scaleY = targetHpx / origVP.height;
    const renderScale = scale * Math.min(scaleX, scaleY);
    const viewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement("canvas");
    canvas.width  = Math.round(targetWpx);
    canvas.height = Math.round(targetHpx);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const offsetX = (canvas.width  - viewport.width)  / 2;
    const offsetY = (canvas.height - viewport.height) / 2;
    await page.render({ canvasContext: ctx, viewport, transform: [1,0,0,1,offsetX,offsetY] }).promise;

    const imgData = canvas.toDataURL("image/jpeg", jpegQuality);
    const orient = targetWmm > targetHmm ? "l" : "p";
    if (i === 1) {
      pdf = new jsPDF({ unit: "mm", format: [targetWmm, targetHmm], orientation: orient });
    } else {
      pdf.addPage([targetWmm, targetHmm], orient);
    }
    pdf.addImage(imgData, "JPEG", 0, 0, targetWmm, targetHmm);
  }
  return pdf;
}

// Binary-search quality to hit targetBytes (±15%)
async function findQualityForSize(pdfDoc, targetWmm, targetHmm, scale, targetBytes, statusCb) {
  let lo = 0.05, hi = 0.95, bestPdf = null, bestDiff = Infinity;
  for (let iter = 0; iter < 9; iter++) {
    const mid = (lo + hi) / 2;
    statusCb && statusCb(`Optimizing quality: ${Math.round(mid * 100)}%… (pass ${iter + 1}/9)`);
    const pdf = await renderPdfToJsPDF(pdfDoc, targetWmm, targetHmm, scale, mid);
    const blob = pdf.output("blob");
    const diff = Math.abs(blob.size - targetBytes);
    if (diff < bestDiff) { bestDiff = diff; bestPdf = pdf; }
    if (blob.size > targetBytes) hi = mid;
    else lo = mid;
    if (diff / targetBytes < 0.08) break; // within 8% — good enough
  }
  return bestPdf;
}

/* ============================================================
   12. PDF RESIZER (PDF.js render → jsPDF) — with target size
   ============================================================ */
(function () {
  let _file = null;

  const PAGE_SIZES = {
    a4:     [210, 297],
    a3:     [297, 420],
    letter: [215.9, 279.4],
    legal:  [215.9, 355.6],
  };

  const sizeSelect    = document.getElementById("pdfresize-size");
  const orientSelect  = document.getElementById("pdfresize-orient");
  const cwInput       = document.getElementById("pdfresize-cw");
  const chInput       = document.getElementById("pdfresize-ch");
  const cwWrap        = document.getElementById("custom-w-wrap");
  const chWrap        = document.getElementById("custom-h-wrap");
  const fitCB         = document.getElementById("pdfresize-fitcontent");
  const targetEnable  = document.getElementById("pdfresize-targetsize-enable");
  const targetWrap    = document.getElementById("pdfresize-targetsize-wrap");
  const targetKbInput = document.getElementById("pdfresize-targetkb");
  const targetUnit    = document.getElementById("pdfresize-targetunit");
  const infoEl        = document.getElementById("pdfresize-info");
  const progressWrap  = document.getElementById("pdfresize-progress");
  const btn           = document.getElementById("btn-pdfresize");

  sizeSelect?.addEventListener("change", () => {
    const isCustom = sizeSelect.value === "custom";
    cwWrap.style.display = isCustom ? "" : "none";
    chWrap.style.display = isCustom ? "" : "none";
  });
  targetEnable?.addEventListener("change", () => {
    targetWrap.style.display = targetEnable.checked ? "" : "none";
  });

  setupDropZone("dz-pdfresize", "file-pdfresize", (file) => {
    if (!file || file.type !== "application/pdf") { showToast("Please select a PDF file.", "error"); return; }
    _file = file;
    markDropZone("dz-pdfresize", file.name);
    infoEl.textContent = `Selected: ${file.name} · ${formatBytes(file.size)}`;
    infoEl.hidden = false;
    btn.disabled = false;
  });

  btn?.addEventListener("click", async () => {
    if (!_file || typeof pdfjsLib === "undefined" || typeof jspdf === "undefined") {
      showToast("Required libraries not loaded.", "error"); return;
    }
    try {
      btn.disabled = true;
      btn.textContent = "Resizing…";
      progressWrap.hidden = false;

      const sizeKey = sizeSelect?.value || "a4";
      let [tw, th] = sizeKey === "custom"
        ? [parseFloat(cwInput.value) || 210, parseFloat(chInput.value) || 297]
        : PAGE_SIZES[sizeKey];
      if (orientSelect?.value === "landscape" && tw < th) [tw, th] = [th, tw];

      const arrayBuffer = await _file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const scale = fitCB?.checked ? 1 : 1;

      let pdf;
      if (targetEnable?.checked && targetKbInput.value) {
        const unit = targetUnit?.value || "kb";
        const targetBytes = parseFloat(targetKbInput.value) * (unit === "mb" ? 1048576 : 1024);
        setProgress("pdfresize-fill", "pdfresize-status", 10, "Starting quality optimization…");
        pdf = await findQualityForSize(pdfDoc, tw, th, scale, targetBytes,
          (msg) => setProgress("pdfresize-fill", "pdfresize-status", 50, msg));
      } else {
        const total = pdfDoc.numPages;
        for (let i = 1; i <= total; i++) {
          setProgress("pdfresize-fill", "pdfresize-status",
            Math.round((i / total) * 100), `Page ${i}/${total}…`);
        }
        pdf = await renderPdfToJsPDF(pdfDoc, tw, th, scale, 0.92);
      }

      const blob = pdf.output("blob");
      setProgress("pdfresize-fill", "pdfresize-status", 100,
        `Done · Output: ${formatBytes(blob.size)}`);
      triggerDownload(URL.createObjectURL(blob), `${basename(_file.name)}_resized.pdf`);
      showToast(`✅ PDF resized to ${tw}×${th}mm · ${formatBytes(blob.size)}`, "success");
    } catch (e) {
      showToast("PDF resize failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Resize PDF & Download";
      setTimeout(() => { progressWrap.hidden = true; }, 2500);
    }
  });
})();

/* ============================================================
   13. PDF MERGER — with optional target file size
   ============================================================ */
(function () {
  let _files = [];

  const listEl        = document.getElementById("pdfmerge-list");
  const infoEl        = document.getElementById("pdfmerge-info");
  const progressWrap  = document.getElementById("pdfmerge-progress");
  const btn           = document.getElementById("btn-pdfmerge");
  const targetEnable  = document.getElementById("pdfmerge-targetsize-enable");
  const targetWrap    = document.getElementById("pdfmerge-targetsize-wrap");
  const targetKbInput = document.getElementById("pdfmerge-targetkb");
  const targetUnit    = document.getElementById("pdfmerge-targetunit");

  targetEnable?.addEventListener("change", () => {
    targetWrap.style.display = targetEnable.checked ? "" : "none";
  });

  function renderList() {
    listEl.innerHTML = "";
    if (!_files.length) { listEl.hidden = true; infoEl.hidden = true; return; }
    listEl.hidden = false;
    infoEl.textContent = `${_files.length} file(s) · ${formatBytes(_files.reduce((s,f)=>s+f.size,0))} total`;
    infoEl.hidden = false;

    const hint = document.createElement("p");
    hint.className = "merge-list-hint";
    hint.textContent = "☰ Drag rows to reorder · ✕ to remove";
    listEl.appendChild(hint);

    _files.forEach((file, idx) => {
      const item = document.createElement("div");
      item.className = "merge-file-item";
      item.draggable = true;
      item.dataset.idx = idx;
      item.innerHTML = `
        <span class="merge-file-drag-handle">☰</span>
        <span class="merge-file-name" title="${file.name}">📄 ${file.name}</span>
        <span class="merge-file-size">${formatBytes(file.size)}</span>
        <button class="merge-file-remove" title="Remove" data-idx="${idx}">✕</button>`;
      item.querySelector(".merge-file-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        _files.splice(parseInt(e.target.dataset.idx), 1);
        renderList();
        btn.disabled = _files.length < 2;
      });
      let dragSrcIdx = null;
      item.addEventListener("dragstart", (e) => { dragSrcIdx = idx; item.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; });
      item.addEventListener("dragend", () => item.classList.remove("dragging"));
      item.addEventListener("dragover", (e) => { e.preventDefault(); item.classList.add("drag-over"); });
      item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
      item.addEventListener("drop", (e) => {
        e.preventDefault(); item.classList.remove("drag-over");
        if (dragSrcIdx === null || dragSrcIdx === idx) return;
        const moved = _files.splice(dragSrcIdx, 1)[0];
        _files.splice(idx, 0, moved);
        renderList();
      });
      listEl.appendChild(item);
    });
  }

  setupDropZone("dz-pdfmerge", "file-pdfmerge", (files) => {
    const pdfs = files.filter(f => f.type === "application/pdf");
    if (!pdfs.length) { showToast("Please select PDF files only.", "error"); return; }
    _files = [..._files, ...pdfs];
    renderList();
    btn.disabled = _files.length < 2;
    markDropZone("dz-pdfmerge", `${_files.length} PDF(s) selected`);
  }, { multiple: true });

  btn?.addEventListener("click", async () => {
    if (_files.length < 2 || typeof pdfjsLib === "undefined" || typeof jspdf === "undefined") {
      showToast("Need at least 2 PDFs and libraries loaded.", "error"); return;
    }
    try {
      btn.disabled = true; btn.textContent = "Merging…";
      progressWrap.hidden = false;

      // Collect all pages info first
      const allDocs = [];
      for (let fi = 0; fi < _files.length; fi++) {
        setProgress("pdfmerge-fill", "pdfmerge-status",
          Math.round((fi / _files.length) * 50), `Loading ${_files[fi].name}…`);
        const ab = await _files[fi].arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: ab }).promise;
        allDocs.push(doc);
      }

      const useTarget = targetEnable?.checked && targetKbInput.value;
      let quality = 0.88;

      if (useTarget) {
        // Estimate with quality 0.7 first, then binary-search
        const unit = targetUnit?.value || "kb";
        const targetBytes = parseFloat(targetKbInput.value) * (unit === "mb" ? 1048576 : 1024);
        setProgress("pdfmerge-fill", "pdfmerge-status", 55, "Optimizing quality for target size…");

        let lo = 0.05, hi = 0.95, bestPdf = null, bestDiff = Infinity;
        for (let iter = 0; iter < 8; iter++) {
          const mid = (lo + hi) / 2;
          setProgress("pdfmerge-fill", "pdfmerge-status", 55 + iter * 5,
            `Quality pass ${iter+1}/8 — trying ${Math.round(mid*100)}%…`);
          const testPdf = await buildMergedPdf(allDocs, mid);
          const blob = testPdf.output("blob");
          const diff = Math.abs(blob.size - targetBytes);
          if (diff < bestDiff) { bestDiff = diff; bestPdf = testPdf; }
          if (blob.size > targetBytes) hi = mid; else lo = mid;
          if (diff / targetBytes < 0.08) break;
        }
        setProgress("pdfmerge-fill", "pdfmerge-status", 100, "Finalizing…");
        const blob = bestPdf.output("blob");
        triggerDownload(URL.createObjectURL(blob), "merged.pdf");
        showToast(`✅ Merged! Output: ${formatBytes(blob.size)}`, "success");
      } else {
        setProgress("pdfmerge-fill", "pdfmerge-status", 55, "Building merged PDF…");
        const pdf = await buildMergedPdf(allDocs, quality,
          (p, msg) => setProgress("pdfmerge-fill", "pdfmerge-status", 55 + Math.round(p * 40), msg));
        setProgress("pdfmerge-fill", "pdfmerge-status", 100, "Finalizing…");
        const blob = pdf.output("blob");
        triggerDownload(URL.createObjectURL(blob), "merged.pdf");
        showToast(`✅ ${allDocs.reduce((s,d)=>s+d.numPages,0)} pages merged! ${formatBytes(blob.size)}`, "success");
      }
    } catch(e) {
      showToast("PDF merge failed: " + e.message, "error");
    } finally {
      btn.disabled = false; btn.textContent = "Merge PDFs & Download";
      setTimeout(() => { progressWrap.hidden = true; }, 2500);
    }
  });

  async function buildMergedPdf(allDocs, quality, progressCb) {
    const { jsPDF } = jspdf;
    let pdf = null, pageCount = 0;
    const totalPages = allDocs.reduce((s,d) => s + d.numPages, 0);
    for (const doc of allDocs) {
      for (let pi = 1; pi <= doc.numPages; pi++) {
        pageCount++;
        progressCb && progressCb(pageCount / totalPages, `Page ${pageCount}/${totalPages}…`);
        const page = await doc.getPage(pi);
        const vp1 = page.getViewport({ scale: 1 });
        const w_mm = (vp1.width / 72) * 25.4;
        const h_mm = (vp1.height / 72) * 25.4;
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width; canvas.height = vp.height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const orient = w_mm > h_mm ? "l" : "p";
        if (!pdf) pdf = new jsPDF({ unit: "mm", format: [w_mm, h_mm], orientation: orient });
        else pdf.addPage([w_mm, h_mm], orient);
        pdf.addImage(canvas.toDataURL("image/jpeg", quality), "JPEG", 0, 0, w_mm, h_mm);
      }
    }
    return pdf;
  }
})();

/* ============================================================
   14. PDF COMPRESSOR — with preset levels + target size
   ============================================================ */
(function () {
  let _file = null;

  const levelSelect   = document.getElementById("pdfcompress-level");
  const scaleSelect   = document.getElementById("pdfcompress-scale");
  const targetEnable  = document.getElementById("pdfcompress-targetsize-enable");
  const targetWrap    = document.getElementById("pdfcompress-targetsize-wrap");
  const targetKbInput = document.getElementById("pdfcompress-targetkb");
  const targetUnit    = document.getElementById("pdfcompress-targetunit");
  const infoEl        = document.getElementById("pdfcompress-info");
  const progressWrap  = document.getElementById("pdfcompress-progress");
  const btn           = document.getElementById("btn-pdfcompress");

  // Compression level → JPEG quality map
  const LEVEL_QUALITY = { screen: 0.45, ebook: 0.70, printer: 0.88, prepress: 0.95 };

  targetEnable?.addEventListener("change", () => {
    targetWrap.style.display = targetEnable.checked ? "" : "none";
  });

  setupDropZone("dz-pdfcompress", "file-pdfcompress", (file) => {
    if (!file || file.type !== "application/pdf") { showToast("Please select a PDF file.", "error"); return; }
    _file = file;
    markDropZone("dz-pdfcompress", file.name);
    infoEl.textContent = `Original: ${file.name} · ${formatBytes(file.size)}`;
    infoEl.hidden = false;
    btn.disabled = false;
  });

  btn?.addEventListener("click", async () => {
    if (!_file || typeof pdfjsLib === "undefined" || typeof jspdf === "undefined") {
      showToast("Required libraries not loaded.", "error"); return;
    }
    try {
      btn.disabled = true; btn.textContent = "Compressing…";
      progressWrap.hidden = false;

      const renderScale = parseFloat(scaleSelect?.value || "1.0");
      const ab = await _file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: ab }).promise;
      const total = pdfDoc.numPages;

      // Get page dimensions from first page for consistent output
      const firstPage = await pdfDoc.getPage(1);
      const vp1 = firstPage.getViewport({ scale: 1 });
      const w_mm = (vp1.width / 72) * 25.4;
      const h_mm = (vp1.height / 72) * 25.4;

      let pdf;

      if (targetEnable?.checked && targetKbInput.value) {
        const unit = targetUnit?.value || "kb";
        const targetBytes = parseFloat(targetKbInput.value) * (unit === "mb" ? 1048576 : 1024);
        setProgress("pdfcompress-fill", "pdfcompress-status", 5, "Starting binary search…");
        pdf = await findQualityForSizeGeneric(pdfDoc, renderScale, targetBytes,
          (msg) => setProgress("pdfcompress-fill", "pdfcompress-status", 50, msg));
      } else {
        const quality = LEVEL_QUALITY[levelSelect?.value || "ebook"];
        pdf = await compressPdfPages(pdfDoc, renderScale, quality,
          (pct, msg) => setProgress("pdfcompress-fill", "pdfcompress-status", pct, msg));
      }

      const blob = pdf.output("blob");
      const savedBytes = _file.size - blob.size;
      const savedPct = Math.round((savedBytes / _file.size) * 100);
      setProgress("pdfcompress-fill", "pdfcompress-status", 100,
        `Done · ${formatBytes(_file.size)} → ${formatBytes(blob.size)} (${savedPct > 0 ? "−" : "+"}${Math.abs(savedPct)}%)`);
      triggerDownload(URL.createObjectURL(blob), `${basename(_file.name)}_compressed.pdf`);
      showToast(`✅ ${formatBytes(_file.size)} → ${formatBytes(blob.size)} · Saved ${savedPct > 0 ? savedPct : 0}%`, "success");
    } catch(e) {
      showToast("Compression failed: " + e.message, "error");
    } finally {
      btn.disabled = false; btn.textContent = "Compress PDF & Download";
      setTimeout(() => { progressWrap.hidden = true; }, 3000);
    }
  });

  async function compressPdfPages(pdfDoc, renderScale, quality, progressCb) {
    const { jsPDF } = jspdf;
    const total = pdfDoc.numPages;
    let pdf = null;
    for (let i = 1; i <= total; i++) {
      progressCb && progressCb(Math.round((i/total)*90), `Page ${i}/${total}…`);
      const page = await pdfDoc.getPage(i);
      const vp1 = page.getViewport({ scale: 1 });
      const w_mm = (vp1.width / 72) * 25.4;
      const h_mm = (vp1.height / 72) * 25.4;
      const vp = page.getViewport({ scale: renderScale });
      const canvas = document.createElement("canvas");
      canvas.width = vp.width; canvas.height = vp.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const orient = w_mm > h_mm ? "l" : "p";
      if (!pdf) pdf = new jsPDF({ unit: "mm", format: [w_mm, h_mm], orientation: orient });
      else pdf.addPage([w_mm, h_mm], orient);
      pdf.addImage(canvas.toDataURL("image/jpeg", quality), "JPEG", 0, 0, w_mm, h_mm);
    }
    return pdf;
  }

  async function findQualityForSizeGeneric(pdfDoc, renderScale, targetBytes, statusCb) {
    let lo = 0.05, hi = 0.95, bestPdf = null, bestDiff = Infinity;
    for (let iter = 0; iter < 9; iter++) {
      const mid = (lo + hi) / 2;
      statusCb && statusCb(`Pass ${iter+1}/9 — quality ${Math.round(mid*100)}%…`);
      const pdf = await compressPdfPages(pdfDoc, renderScale, mid, null);
      const blob = pdf.output("blob");
      const diff = Math.abs(blob.size - targetBytes);
      if (diff < bestDiff) { bestDiff = diff; bestPdf = pdf; }
      if (blob.size > targetBytes) hi = mid; else lo = mid;
      if (diff / targetBytes < 0.08) break;
    }
    return bestPdf;
  }
})();

/* ============================================================
   15. DOCX → PDF (mammoth.js parse → jsPDF)
   ============================================================ */
(function () {
  let _file = null;

  const infoEl       = document.getElementById("docx2pdf-info");
  const progressWrap = document.getElementById("docx2pdf-progress");
  const btn          = document.getElementById("btn-docx2pdf");
  const pageSelect   = document.getElementById("docx2pdf-page");
  const fontSizeInp  = document.getElementById("docx2pdf-fontsize");

  const PAGE_MM = { a4: [210,297], letter: [215.9,279.4], a3: [297,420] };

  setupDropZone("dz-docx2pdf", "file-docx2pdf", (file) => {
    const ok = file && (file.name.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    if (!ok) { showToast("Please select a .docx file.", "error"); return; }
    _file = file;
    markDropZone("dz-docx2pdf", file.name);
    infoEl.textContent = `Selected: ${file.name} · ${formatBytes(file.size)}`;
    infoEl.hidden = false;
    btn.disabled = false;
  });

  btn?.addEventListener("click", async () => {
    if (!_file) return;
    if (typeof mammoth === "undefined") {
      showToast("Mammoth.js not loaded. Check your connection.", "error"); return;
    }
    if (typeof jspdf === "undefined") {
      showToast("jsPDF not loaded. Check your connection.", "error"); return;
    }
    try {
      btn.disabled = true; btn.textContent = "Converting…";
      progressWrap.hidden = false;
      setProgress("docx2pdf-fill", "docx2pdf-status", 10, "Reading DOCX…");

      const ab = await _file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: ab });
      const text = result.value;

      setProgress("docx2pdf-fill", "docx2pdf-status", 50, "Building PDF…");

      const { jsPDF } = jspdf;
      const pageKey = pageSelect?.value || "a4";
      const [pw, ph] = PAGE_MM[pageKey] || PAGE_MM.a4;
      const fontSize = parseInt(fontSizeInp?.value) || 11;
      const margin = 20;
      const usable = pw - margin * 2;

      const pdf = new jsPDF({ unit: "mm", format: [pw, ph], orientation: pw > ph ? "l" : "p" });
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(20, 20, 20);

      const lineH = fontSize * 0.38 + 1.2;
      let y = margin;
      const lines = pdf.splitTextToSize(text, usable);

      // Try to detect headings (all-caps short lines or lines ending with nothing after)
      lines.forEach((line) => {
        if (y + lineH > ph - margin) { pdf.addPage([pw, ph]); y = margin; }
        const trimmed = line.trim();
        // Heuristic heading detection: short, ends without punctuation, mostly letters
        const isHeading = trimmed.length > 0 && trimmed.length < 60 &&
          !/[.!?,:;]$/.test(trimmed) && /^[A-Z\d]/.test(trimmed) &&
          trimmed === trimmed.toUpperCase() && trimmed.length > 3;
        if (isHeading) {
          pdf.setFontSize(fontSize + 3);
          pdf.setFont("helvetica", "bold");
          pdf.text(trimmed, margin, y);
          pdf.setFontSize(fontSize);
          pdf.setFont("helvetica", "normal");
          y += lineH * 1.6;
        } else {
          pdf.text(line, margin, y);
          y += lineH;
        }
      });

      setProgress("docx2pdf-fill", "docx2pdf-status", 100, "Done!");
      pdf.save(`${basename(_file.name)}.pdf`);
      showToast("✅ DOCX converted to PDF & downloaded!", "success");
    } catch(e) {
      showToast("Conversion failed: " + e.message, "error");
    } finally {
      btn.disabled = false; btn.textContent = "Convert to PDF & Download";
      setTimeout(() => { progressWrap.hidden = true; }, 2000);
    }
  });
})();

/* ============================================================
   16. PDF → DOCX (PDF.js text extraction → .docx via raw XML)
   ============================================================ */
(function () {
  let _file = null;

  const infoEl       = document.getElementById("pdf2docx-info");
  const progressWrap = document.getElementById("pdf2docx-progress");
  const btn          = document.getElementById("btn-pdf2docx");
  const fontSelect   = document.getElementById("pdf2docx-font");
  const fontSizeInp  = document.getElementById("pdf2docx-fontsize");

  setupDropZone("dz-pdf2docx", "file-pdf2docx", (file) => {
    if (!file || file.type !== "application/pdf") { showToast("Please select a PDF file.", "error"); return; }
    _file = file;
    markDropZone("dz-pdf2docx", file.name);
    infoEl.textContent = `Selected: ${file.name} · ${formatBytes(file.size)}`;
    infoEl.hidden = false;
    btn.disabled = false;
  });

  btn?.addEventListener("click", async () => {
    if (!_file || typeof pdfjsLib === "undefined") {
      showToast("PDF.js not loaded.", "error"); return;
    }
    try {
      btn.disabled = true; btn.textContent = "Extracting…";
      progressWrap.hidden = false;

      const font = fontSelect?.value || "Arial";
      const fontSize = parseInt(fontSizeInp?.value) || 11;
      const halfPt = fontSize * 2; // OOXML half-points

      const ab = await _file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: ab }).promise;
      const total = pdfDoc.numPages;

      let allParas = [];
      for (let i = 1; i <= total; i++) {
        setProgress("pdf2docx-fill", "pdf2docx-status",
          Math.round((i / total) * 85), `Extracting page ${i}/${total}…`);
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();

        // Group items into lines by y-position
        const lines = {};
        content.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push(item.str);
        });

        const sortedY = Object.keys(lines).map(Number).sort((a,b) => b - a);
        sortedY.forEach(y => {
          const lineText = lines[y].join(" ").trim();
          if (lineText) allParas.push({ text: lineText, isPageBreak: false });
        });

        if (i < total) allParas.push({ text: "", isPageBreak: true });
      }

      setProgress("pdf2docx-fill", "pdf2docx-status", 90, "Building DOCX…");

      // Build minimal OOXML DOCX in memory (ZIP)
      const docxBlob = await buildDocx(allParas, font, halfPt);
      setProgress("pdf2docx-fill", "pdf2docx-status", 100, "Done!");
      triggerDownload(URL.createObjectURL(docxBlob), `${basename(_file.name)}.docx`);
      showToast("✅ PDF converted to DOCX & downloaded!", "success");
    } catch(e) {
      showToast("Conversion failed: " + e.message, "error");
    } finally {
      btn.disabled = false; btn.textContent = "Convert to DOCX & Download";
      setTimeout(() => { progressWrap.hidden = true; }, 2000);
    }
  });

  function xmlEscape(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
              .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  }

  function buildDocx(paras, font, halfPt) {
    // Build document.xml
    const parasXml = paras.map(p => {
      if (p.isPageBreak) {
        return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
      }
      const text = xmlEscape(p.text);
      // Heuristic: short, no punctuation at end → bold heading
      const isHeading = p.text.length < 80 && p.text.length > 2 &&
        !/[.,:;!?]$/.test(p.text.trim()) && p.text === p.text.toUpperCase() && p.text.trim().length > 3;
      const sz = isHeading ? halfPt + 8 : halfPt;
      const bold = isHeading ? "<w:b/>" : "";
      return `<w:p>
  <w:pPr><w:spacing w:after="120"/></w:pPr>
  <w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>${bold}</w:rPr>
    <w:t xml:space="preserve">${text}</w:t></w:r>
</w:p>`;
    }).join("
");

    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
${parasXml}
<w:sectPr>
  <w:pgSz w:w="12240" w:h="15840"/>
  <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
</w:sectPr>
</w:body>
</w:document>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    // Simple ZIP builder (no external library needed)
    return buildZip([
      { name: "[Content_Types].xml", data: contentTypes },
      { name: "_rels/.rels",         data: relsXml },
      { name: "word/document.xml",   data: docXml },
      { name: "word/_rels/document.xml.rels", data: wordRelsXml },
    ]);
  }

  // Minimal ZIP builder — local file header + central directory
  function buildZip(files) {
    const enc = new TextEncoder();
    const parts = [];
    const centralDir = [];
    let offset = 0;

    files.forEach(f => {
      const nameBytes = enc.encode(f.name);
      const dataBytes = enc.encode(f.data);
      const crc = crc32(dataBytes);
      const localHeader = makeLocalHeader(nameBytes, dataBytes, crc);
      parts.push(localHeader);
      parts.push(dataBytes);
      centralDir.push(makeCentralDir(nameBytes, dataBytes, crc, offset));
      offset += localHeader.byteLength + dataBytes.byteLength;
    });

    const cdBytes = concatU8(centralDir);
    const eocd = makeEOCD(files.length, cdBytes.byteLength, offset);
    const all = concatU8([...parts.map(p => p instanceof Uint8Array ? p : new Uint8Array(p)), cdBytes, eocd]);
    return new Blob([all], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }

  function concatU8(arrays) {
    const total = arrays.reduce((s,a) => s + a.byteLength, 0);
    const out = new Uint8Array(total);
    let off = 0;
    arrays.forEach(a => { out.set(new Uint8Array(a.buffer || a), off); off += a.byteLength; });
    return out;
  }

  function u16le(v) { const a = new Uint8Array(2); new DataView(a.buffer).setUint16(0,v,true); return a; }
  function u32le(v) { const a = new Uint8Array(4); new DataView(a.buffer).setUint32(0,v,true); return a; }

  function makeLocalHeader(name, data, crc) {
    return concatU8([
      new Uint8Array([0x50,0x4B,0x03,0x04]), // sig
      u16le(20), u16le(0), u16le(0),         // version, flags, method(stored)
      u16le(0), u16le(0),                    // mod time, mod date
      u32le(crc), u32le(data.byteLength), u32le(data.byteLength),
      u16le(name.byteLength), u16le(0),
      name,
    ]);
  }

  function makeCentralDir(name, data, crc, offset) {
    return concatU8([
      new Uint8Array([0x50,0x4B,0x01,0x02]),
      u16le(20), u16le(20), u16le(0), u16le(0),
      u16le(0), u16le(0), u16le(0),
      u32le(crc), u32le(data.byteLength), u32le(data.byteLength),
      u16le(name.byteLength), u16le(0), u16le(0),
      u16le(0), u16le(0), u32le(0),
      u32le(offset),
      name,
    ]);
  }

  function makeEOCD(count, cdSize, cdOffset) {
    return concatU8([
      new Uint8Array([0x50,0x4B,0x05,0x06]),
      u16le(0), u16le(0),
      u16le(count), u16le(count),
      u32le(cdSize), u32le(cdOffset),
      u16le(0),
    ]);
  }

  function crc32(data) {
    let crc = 0xFFFFFFFF;
    const table = crc32.table || (crc32.table = (() => {
      const t = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c>>>1) : c>>>1;
        t[i] = c;
      }
      return t;
    })());
    for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xFF] ^ (crc>>>8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
})();

/* ============================================================
   SCROLL REVEAL (lightweight)
   ============================================================ */
(function () {
  if (!("IntersectionObserver" in window)) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll(".feature-card, .faq-item").forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    obs.observe(el);
  });
})();
