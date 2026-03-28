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
