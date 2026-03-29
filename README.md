# ⚡ FileFlux — Free Online File Converter

> **Convert files instantly in your browser. No upload. No server. No signup. 100% Free.**

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?logo=github)](https://avinashwalton.github.io/fileflux/)
[![Made in India](https://img.shields.io/badge/Made%20with%20%E2%9D%A4%EF%B8%8F-India-orange)](https://github.com/AvinashWalton)
[![Tools](https://img.shields.io/badge/Tools-17-brightgreen)](#-17-conversion-tools)
[![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## 🌐 Live Demo

👉 **[avinashwalton.github.io/fileflux](https://avinashwalton.github.io/fileflux/)**

---

## 📸 Preview

![FileFlux Screenshot](https://avinashwalton.github.io/fileflux/preview.png)

---

## ✨ Features

FileFlux is a fully client-side file conversion tool. Everything runs in your browser — your files **never leave your device**.

### 🔄 17 Conversion Tools

| # | Tool | Description |
|---|------|-------------|
| 1 | 🖼️ **PNG → JPG** | Convert PNG to JPG with custom quality & background color for transparency |
| 2 | 🖼️ **JPG → PNG** | Convert JPG/JPEG to lossless PNG |
| 3 | 📄 **PDF → Image** | Export every PDF page as a high-resolution PNG (up to 4x scale) |
| 4 | 🖼️ **Image → PDF** | Combine multiple images into a single PDF document |
| 5 | ✍️ **Text → Image** | Render text on canvas — custom font, color, size & background |
| 6 | 🔍 **Image → Text** | OCR — extract text from images (English, Hindi, French, German, Spanish) |
| 7 | 📑 **PDF → Text** | Extract all text content from a PDF, page by page |
| 8 | 📝 **Text → PDF** | Generate a formatted PDF from plain text with custom styling |
| 9 | 📐 **Image Resizer** | Resize to exact pixels with optional aspect-ratio lock, multiple output formats |
| 10 | 🗜️ **Image Compressor** | Reduce image file size with live before/after stats |
| 11 | 🔗 **Merge Images** | Stitch images vertically or horizontally with custom gap & color |
| 12 | 📏 **PDF Resizer** | Resize all PDF pages to A4, A3, Letter, Legal or custom mm — optionally set a **target KB/MB** output size |
| 13 | 📎 **PDF Merger** | Merge multiple PDFs into one — drag to reorder, optional **target file size** control |
| 14 | 🗜️ **PDF Compressor** | Compress PDF with preset levels (Screen/eBook/Printer/Prepress) or set an **exact target KB/MB** via binary-search quality optimization |
| 15 | 📝 **DOCX → PDF** | Convert Word documents to PDF — headings, paragraphs, lists preserved |
| 16 | 📄 **PDF → DOCX** | Extract text from PDF and save as a structured Word (.docx) file |

> **💡 Target File Size Feature** (Tools 12, 13, 14): Set an exact output size in KB or MB. FileFlux uses a binary-search algorithm to auto-find the optimal JPEG quality level that hits your target (within ±10%). Page layout and structure remain completely unchanged — only image compression quality is adjusted.

### 🛡️ Why FileFlux?

- 🔒 **100% Private** — Files never leave your device or browser
- ⚡ **Blazing Fast** — No upload wait, instant processing
- 🆓 **Always Free** — No limits, no watermarks, no login
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop
- 🌐 **Offline Capable** — Most features work without internet after first load
- ♿ **Accessible** — ARIA labels, keyboard navigation, semantic HTML
- 🔍 **SEO Optimized** — Meta tags, Open Graph, Twitter Card, Schema.org JSON-LD
- 📦 **Zero Dependencies** — No npm, no build step, just open `index.html`

---

## 🛠️ Tech Stack

| Library | Purpose |
|---------|---------|
| [PDF.js](https://mozilla.github.io/pdf.js/) | PDF rendering, page export & text extraction |
| [jsPDF](https://github.com/parallax/jsPDF) | PDF generation — images, text, resize, merge, compress |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | In-browser OCR (image to text, multi-language) |
| [Mammoth.js](https://github.com/mwilliamson/mammoth.js) | DOCX parsing for DOCX → PDF conversion |
| Vanilla HTML/CSS/JS | No framework — pure web, zero build step |

---

## 🚀 Getting Started

### Option 1 — Use it directly
Visit **[avinashwalton.github.io/fileflux](https://avinashwalton.github.io/fileflux/)** — no installation needed.

### Option 2 — Run locally

```bash
# Clone the repository
git clone https://github.com/AvinashWalton/fileflux.git

# Enter the folder
cd fileflux

# Open in browser (no build step needed!)
open index.html
# or: double-click index.html in your file explorer
```

That's it. No `npm install`, no build process, no dependencies to manage.

### Option 3 — Deploy to GitHub Pages

1. Fork this repo
2. Go to **Settings → Pages**
3. Set source to `main` branch, root folder `/`
4. Your live URL: `https://yourusername.github.io/fileflux/`

---

## 📁 Project Structure

```
fileflux/
├── index.html      # Main HTML — all UI, SEO meta tags, structured data
├── style.css       # All styling — responsive, dark theme, animations
├── script.js       # All 17 converter tools — pure vanilla JavaScript
├── LICENSE         # MIT License
└── README.md       # You are here
```

---

## ℹ️ Notes on Specific Features

### Target File Size (PDF Resizer, Merger, Compressor)
FileFlux uses a **binary search algorithm** to hit your requested KB/MB target. It renders each page as a JPEG at varying quality levels (up to 9 iterations) until the output is within ~8% of your target. Page dimensions, layout, and text structure are never changed — only the image compression quality is adjusted.

### PDF → DOCX
Since PDF is not a structured document format, the conversion extracts text line-by-line from each page using PDF.js. Short all-caps lines are auto-detected as headings. For PDFs with complex layouts (multi-column, tables, embedded fonts), the output may need minor manual cleanup in Word.

### DOCX → PDF
Uses Mammoth.js to extract raw text and jsPDF to generate a cleanly formatted PDF. Basic heading detection is applied. Complex DOCX formatting (tables, images, custom styles) is simplified in the output.

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** this repository
2. **Create** a new branch: `git checkout -b feature/amazing-tool`
3. **Commit** your changes: `git commit -m 'Add: new converter tool'`
4. **Push** to your branch: `git push origin feature/amazing-tool`
5. **Open a Pull Request**

### Ideas for contributions
- WebP ↔ PNG/JPG converter
- SVG to PNG export
- GIF to video / video to GIF
- Image color picker / palette extractor
- Batch file processing
- PDF page splitter / extractor
- Dark/light mode toggle
- i18n / Hindi language support

---

## 🐛 Bug Reports

Found a bug? [Open an issue](https://github.com/AvinashWalton/fileflux/issues) with:
- Browser name and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if possible

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

You are free to use, modify, distribute, and even use this commercially. Just keep the license notice.

---

## 👤 Author

**Avinash Walton**

Connect with me:

[![YouTube](https://img.shields.io/badge/YouTube-AvinashWalton-red?logo=youtube)](https://youtube.com/@AvinashWalton)
[![Instagram](https://img.shields.io/badge/Instagram-AvinashWalton-E4405F?logo=instagram&logoColor=white)](https://instagram.com/AvinashWalton)
[![Facebook](https://img.shields.io/badge/Facebook-AvinashWalton-1877F2?logo=facebook&logoColor=white)](https://facebook.com/AvinashWalton)
[![Twitter](https://img.shields.io/badge/Twitter-AvinashWalton-000?logo=x&logoColor=white)](https://twitter.com/AvinashWalton)
[![Threads](https://img.shields.io/badge/Threads-AvinashWalton-000?logo=threads&logoColor=white)](https://threads.net/@AvinashWalton)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-SonuKumarSuman-0A66C2?logo=linkedin&logoColor=white)](https://linkedin.com/in/SonuKumarSuman)

---

## ⭐ Support

If FileFlux helped you, please consider:
- ⭐ **Starring this repository**
- 🔔 **Subscribing on [YouTube](https://youtube.com/@AvinashWalton)** for more projects
- 📢 **Sharing with friends** who need a free file converter

---

<p align="center">Made with ❤️ in India by <strong>Avinash Walton</strong></p>
