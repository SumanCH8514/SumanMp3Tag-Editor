# SumanMp3Tag Editor

A modern, premium, and secure client-side application for editing MP3 metadata, adding watermarks to cover art, and converting audio/video files. Built with React, Vite, and Tailwind CSS.

![SumanMp3Tag Editor](https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=1000&auto=format&fit=crop)

## 🚀 Features

### 🎵 Advanced Metadata Editing
- **Full ID3 Tag Support**: Edit Title, Artist, Album, Genre, Year, Track, Comment, Album Artist, and Copyright.
- **Smart Defaults**: Automatically fills missing tags with `SumanOnline.Com` to ensure consistency.
- **Auto-Suffix**: Automatically appends ` - SumanOnline.Com` to the song title on save.

### 🖼️ Cover Art & Watermarking
- **Cover Art Management**: Upload, replace, or remove album art.
- **Instant Watermarking**: Add a custom watermark to your cover art with a single click.
- **Customization**:
  - **Position**: Top, Center, or Bottom.
  - **Color**: Yellow, White, Red, or Black.

### ⚡ Powerful File Processing
- **Batch Processing**: Drag and drop multiple files to edit them one by one.
- **Format Conversion**: Automatically converts video (MP4, MKV, MOV) and other audio formats (WAV, M4A, FLAC) to MP3 using `ffmpeg.wasm`.
- **Client-Side Security**: All processing happens in your browser. No files are uploaded to any server.

### 🎨 Modern Design
- **Glassmorphism UI**: Sleek, dark-themed interface with blur effects and smooth animations.
- **Responsive**: Works seamlessly on desktop and tablet sizes.

## 🛠️ Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Audio Processing**: 
  - `jsmediatags` for reading tags.
  - `browser-id3-writer` for writing tags.
  - `@ffmpeg/ffmpeg` for file conversion.
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Installation & Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/SumanCH8514/SumanMp3Tag-Editor.git
   cd mp3-metadata-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

## 📝 Usage Guide

1. **Upload Files**: Drag & drop your files or click "Browse Files".
2. **Convert**: If you upload non-MP3 files, wait for the automatic conversion to complete.
3. **Edit**: Click the **Edit** (pencil) icon on any file.
4. **Modify Tags**: Update the song details. Missing fields will default to `SumanOnline.Com`.
5. **Watermark**: Upload a cover image, select your watermark position/color, and click "Add Watermark".
6. **Save**: Click "Save & Download" to get your updated MP3 file.

## 🤝 Contributing

Created by [SumanCH8514](https://github.com/SumanCH8514). Contributions are welcome!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
