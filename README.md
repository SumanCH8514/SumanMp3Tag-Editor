# 🎵 SumanMp3Tag

> **A modern, high-performance, and privacy-focused web application for client-side MP3 metadata editing, cover art watermarking, synced lyrics, and music sharing.**

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📖 Overview

**SumanMp3Tag** is a studio-grade web application engineered for audiophiles, producers, and music collectors. It enables users to inspect, edit, organize ID3v2 metadata, watermark high-resolution album cover art, and synchronize LRC lyrics directly in the browser with 100% data privacy.

The application operates entirely on the client side using modern Web APIs and WebAssembly. Audio files are processed locally in browser memory without mandatory server uploads, delivering instantaneous performance and absolute security.

---

## ✨ Features

- **⚡ 100% In-Browser Audio Tagging**: Fast, lossless reading and writing of ID3v2 tags (`browser-id3-writer`, `jsmediatags`) without transmitting audio to external servers.
- **🖼️ High-Resolution Cover Art Studio**: Upload custom artwork or retrieve 600×600 HD covers via Apple iTunes Store integration with automated CORS proxying.
- **💧 Dynamic Watermark Overlay**: Embed customizable text watermarks into album art with position (Top, Center, Bottom) and color (Yellow, White, Red, Black) controls.
- **🔍 Multi-Engine Lyrics Studio**: Search, fetch, and synchronize lyrics across **LRCLIB**, **LyricsOVH**, **LrcSearch**, and **Global** engines with Devanagari script detection and English prioritization.
- **🪄 Intelligent Auto-Fill**: One-click track metadata enrichment that automatically pulls missing Artists, Album names, Release Years, and Genres.
- **📦 Batch Processing Studio**: Edit, rename, watermark, and export entire albums or multiple files in a unified batch pipeline.
- **🎧 Interactive Web Music Player**: Shareable music player pages (`?play=ID`) featuring interactive seek controls, 10s skip buttons, responsive volume slider, loop modes, and ambient artwork backlighting.
- **🔒 Studio Audio Vault**: Protected audio repository equipped with a tactile PIN pad and 4-digit security code access.
- **🔔 Non-Intrusive Notifications**: Responsive toast alerts powered by `react-hot-toast` that stay on a single clean line without shifting page layouts.

---

## 🛠️ Tech Stack

### Frontend & Architecture
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Motion & Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

### Audio & Tagging Engines
- **Tag Encoding**: `browser-id3-writer`
- **Tag Parsing**: `jsmediatags`
- **Dropzone**: `react-dropzone`

### Backend & Cloud APIs
- **Backend Handlers**: PHP (`upload.php`, `get_song.php`, `list_files.php`, `delete_file.php`)
- **Metadata APIs**: Apple iTunes Search API, LRCLIB API, Lyrics.ovh API

---

## 📸 Demo & Screenshots

![SumanMp3Tag Application Preview](public/project_poster.png)

---

## 🚀 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher)
- [npm](https://www.npmjs.com/) (version 9.0.0 or higher)

### Step-by-Step Commands

```bash
# 1. Clone the repository
git clone https://github.com/SumanCH8514/mp3-metadata-editor.git

# 2. Navigate to the project directory
cd mp3-metadata-editor

# 3. Install dependencies
npm install

# 4. Start the local development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173/SumanMp3Tag/`.

---

## 💡 Usage Guide

### 1. Tagging a Single Track
1. Drag and drop or select an MP3 file into the **Dropzone**.
2. Click **Auto-Fill** to automatically detect and populate missing fields from online music databases.
3. Click **Fetch Apple HD Artwork** to load original high-res album covers.
4. Select watermark options and click **Apply Watermark**.
5. Fetch and edit LRC synchronized lyrics in the **Lyrics Studio**.
6. Click **Save & Download** to download the tagged MP3, or click **Upload and Share** to generate a public player link.

### 2. Batch Processing
1. Navigate to the **Batch Editor** tab.
2. Select multiple MP3 tracks or entire albums.
3. Define default metadata fields, watermarks, or naming rules.
4. Process all tracks in parallel with real-time progress indicators.

### 3. Managing Stored Audio
1. Navigate to **View Files**.
2. Enter your security PIN on the interactive audio vault keypad.
3. Stream, share, inspect, or manage stored audio files.

---

## 📁 Project Structure

```
mp3-metadata-editor/
├── public/                     # Static assets & PHP storage endpoints
│   ├── delete_file.php         # Secure file deletion handler
│   ├── get_song.php            # Song retrieval for music player
│   ├── list_files.php          # Protected files catalog handler
│   ├── upload.php              # Real-time progress upload handler
│   ├── favicon.png             # Application brand icon
│   └── project_poster.png      # High-res application poster
├── src/
│   ├── components/             # Reusable UI component architecture
│   │   ├── BatchMetadataEditor.jsx  # Multi-track batch tagger & watermark manager
│   │   ├── Dropzone.jsx             # Drag-and-drop audio file importer
│   │   ├── FileBrowser.jsx          # Protected PIN audio vault & file catalog
│   │   ├── FileItem.jsx             # Individual track item display
│   │   ├── Layout.jsx               # Universal application shell, nav & footer
│   │   ├── MetadataEditor.jsx       # Studio single-track tagger & lyrics engine
│   │   └── MusicPlayerPage.jsx      # Standalone shareable web music player
│   ├── utils/                  # Core audio & metadata logic
│   │   ├── lrclib.js           # Multi-engine lyrics & iTunes metadata fetcher
│   │   ├── metadata.js         # Client-side ID3 read/write processing
│   │   └── watermark.js        # HTML5 Canvas cover art watermarking
│   ├── App.jsx                 # Application state, router & toast configuration
│   ├── index.css               # Design system tokens & Tailwind styles
│   └── main.jsx                # React root entrypoint
├── index.html                  # HTML5 template with SEO & OpenGraph tags
├── package.json                # Project dependencies & scripts
├── tailwind.config.js          # Design system theme configuration
└── vite.config.js              # Vite bundling & server configuration
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project: `https://github.com/SumanCH8514/SumanMp3Tag-Editor`
2. Create your Feature Branch: `git checkout -b feature/NewFeature`
3. Commit your Changes: `git commit -m 'Add NewFeature'`
4. Push to the Branch: `git push origin feature/NewFeature`
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👤 Author & Contact

**Suman Chakrabortty**
- GitHub: [@SumanCH8514](https://github.com/SumanCH8514)
- Website: [SumanOnline.Com](https://sumanonline.com)
