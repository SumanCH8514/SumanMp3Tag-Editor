# 🎵 SumanMp3Tag Editor

> **A modern, high-performance, and privacy-focused web application for MP3 metadata editing, cover art watermarking, and lyrics synchronization.**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📖 Overview

**SumanMp3Tag Editor** is a state-of-the-art, client-side web application built for music collectors, producers, and audio managers. It provides a seamless, professional environment to inspect, edit, and organize ID3 tags for MP3 audio files—directly in your browser.

By leveraging 100% browser-based audio processing, your files remain completely private and never leave your local device.

---

## ✨ Features

- **⚡ Client-Side Processing**: Fast ID3 tag reading and writing with zero server uploads required.
- **🎨 Fetch Artwork Online**: Dedicated high-definition (600x600) music album cover art retrieval powered by Apple iTunes Store API and Base64 CORS proxying.
- **🔍 Multi-Server Lyrics Engine**: Fetch synced (LRC) and plain text lyrics across **LRCLIB**, **LyricsOVH**, **LrcSearch**, and **Global** search engines.
- **🔤 Dual-Script Prioritization**: Automatically prioritizes English/Romanized lyrics while preserving access to native script versions.
- **✨ Auto Fetch Details**: Instantly retrieves missing track metadata (Artists, Album, Release Year, and Genre) using multi-stage query pipelines with handle sanitization.
- **🖼️ Cover Art Studio & Watermarking**: Upload high-res cover art and apply dynamic, customizable text watermarks with real-time preview.
- **📦 Batch Metadata Editor**: Edit, rename, and process multiple tracks or full albums simultaneously.
- **🏷️ Library Branding & Sanitization**: Enforce consistent tag suffixes and clean OS-compliant file naming.
- **📱 Fully Responsive UI**: Glassmorphic dark theme powered by Tailwind CSS and Framer Motion micro-animations.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) |
| **Build Tooling** | [Vite](https://vitejs.dev/) |
| **Styling & Icons** | [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Metadata Processing** | `browser-id3-writer`, `jsmediatags` |
| **Music APIs** | Apple iTunes Store API, LRCLIB API, Lyrics.ovh API |

---

## 📸 Demo & Preview

![SumanMp3Tag Editor Preview](public/project_poster.png)

---

## 🚀 Installation & Setup

Follow these steps to run **SumanMp3Tag Editor** locally on your machine.

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**

### Step-by-Step Commands

```bash
# 1. Clone the repository
git clone https://github.com/SumanCH8514/SumanMp3Tag-Editor.git

# 2. Navigate to the project directory
cd SumanMp3Tag-Editor

# 3. Install project dependencies
npm install

# 4. Start the development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 💡 Usage

1. **Upload Audio File**: Drag & drop or select an MP3 file on the home screen.
2. **Auto-Fetch Details**: Click **Auto Fetch Details** to populate missing track information from Apple iTunes.
3. **Fetch Artwork Online**: Click **Fetch Artwork Online** to load HD 600x600 album artwork directly into your preview.
4. **Fetch Lyrics**: Use the **Lyrics Panel** to search and toggle between **LRC (Synced)** and **Plain** text lyrics.
5. **Watermark Cover**: Add custom watermarks to your cover artwork with customizable position and color.
6. **Save & Export**: Click **Save & Download** to generate your updated, tagged MP3 file.

---

## 📁 Project Structure

```
mp3-metadata-editor/
├── public/                 # Static assets and project posters
├── src/
│   ├── components/         # Modular React UI components
│   │   ├── BatchMetadataEditor.jsx
│   │   ├── Dropzone.jsx
│   │   ├── FileItem.jsx
│   │   ├── Layout.jsx
│   │   └── MetadataEditor.jsx
│   ├── utils/              # Metadata & API utility engines
│   │   ├── lrclib.js       # Lyrics & iTunes metadata engines
│   │   ├── metadata.js     # ID3 tag reader & writer utilities
│   │   └── watermark.js    # Canvas cover watermarking engine
│   ├── App.jsx             # Main Application Routing & State
│   ├── main.jsx            # React DOM Entrypoint
│   └── index.css           # Tailwind & Glassmorphism styles
├── index.html              # HTML5 Entrypoint & Metadata
├── package.json            # Project dependencies & scripts
└── vite.config.js          # Vite build configuration
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve SumanMp3Tag Editor:

1. Fork the repository (`https://github.com/SumanCH8514/SumanMp3Tag-Editor/fork`).
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author & Contact

**Suman Chakrabortty**
- GitHub: [@SumanCH8514](https://github.com/SumanCH8514)
- Website: [SumanOnline.Com](https://sumanonline.com)
