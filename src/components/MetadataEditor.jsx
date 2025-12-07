import React, { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Wand2, Download, Music, Share2, Copy, Check } from 'lucide-react';
import { readTags, writeTags } from '../utils/metadata';
import { addWatermarkToImage } from '../utils/watermark';
import { motion, AnimatePresence } from 'framer-motion';

const MetadataEditor = ({ file, onSave, onCancel }) => {
  const [metadata, setMetadata] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    year: '',
    track: '',
    comment: '',
    albumArtist: '',
    composer: '',
    copyright: '',
    cover: null
  });
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [watermarked, setWatermarked] = useState(false);
  const fileInputRef = useRef(null);

  const [watermarkOptions, setWatermarkOptions] = useState({
    color: 'yellow',
    position: 'bottom'
  });

  useEffect(() => {
    const loadMetadata = async () => {
      setLoading(true);
      try {
        const tags = await readTags(file);
        // Initialize missing fields with empty strings so they can be controlled
        setMetadata({
          title: tags.title || '',
          artist: tags.artist || '',
          album: tags.album || '',
          genre: tags.genre || '',
          year: tags.year || '',
          track: tags.track || '',
          comment: tags.comment || '',
          albumArtist: tags.albumArtist || '',
          composer: tags.composer || '',
          copyright: tags.copyright || '',
          cover: tags.cover
        });
      } catch (error) {
        console.error("Failed to load tags", error);
      } finally {
        setLoading(false);
      }
    };
    loadMetadata();
  }, [file]);

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const url = URL.createObjectURL(file);
      setMetadata(prev => ({ ...prev, cover: url }));
      setWatermarked(false);
    }
  };

  const handleWatermark = async () => {
    if (!coverFile && !metadata.cover) return;
    
    try {
      let fileToWatermark = coverFile;
      if (!fileToWatermark && metadata.cover) {
        // Convert base64/blob url to blob
        const res = await fetch(metadata.cover);
        const blob = await res.blob();
        fileToWatermark = new File([blob], "cover.jpg", { type: blob.type });
      }

      const watermarkedBlob = await addWatermarkToImage(fileToWatermark, watermarkOptions);
      const watermarkedUrl = URL.createObjectURL(watermarkedBlob);
      
      setCoverFile(new File([watermarkedBlob], "watermarked_cover.jpg", { type: "image/jpeg" }));
      setMetadata(prev => ({ ...prev, cover: watermarkedUrl }));
      setWatermarked(true);
    } catch (err) {
      console.error("Watermark failed", err);
    }
  };

  const prepareFileForSave = async () => {
    // Append suffix to title if not already present
    const suffix = " - SumanOnline.Com";
    let titleToSave = metadata.title || "";
    if (!titleToSave.endsWith(suffix)) {
      titleToSave += suffix;
    }

    // Default value for other fields
    const defaultValue = "SumanOnline.Com";
    const metadataToSave = {
      title: titleToSave,
      artist: metadata.artist || defaultValue,
      album: metadata.album || defaultValue,
      genre: metadata.genre || defaultValue,
      year: metadata.year || defaultValue,
      track: metadata.track || defaultValue,
      comment: metadata.comment || "This mp3 File Is Downloaded From SumanOnline.Com",
      albumArtist: metadata.albumArtist || defaultValue,
      composer: metadata.composer || defaultValue,
      copyright: metadata.copyright || defaultValue
    };

    const newBlob = await writeTags(file, metadataToSave, coverFile);
    
    // Use title as filename if available, otherwise keep original name
    let newFileName = file.name;
    if (metadataToSave.title) {
      // Sanitize filename: remove illegal characters
      const sanitizedTitle = metadataToSave.title.replace(/[/\\?%*:|"<>]/g, '-');
      newFileName = `${sanitizedTitle}.mp3`;
    }
    
    return new File([newBlob], newFileName, { type: file.type });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newFile = await prepareFileForSave();
      onSave(newFile);
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setShareUrl(null);
    try {
      const newFile = await prepareFileForSave();
      const formData = new FormData();
      formData.append('file', newFile);

      // Append cover if available
      if (coverFile) {
        formData.append('cover', coverFile);
      } else if (metadata.cover) {
        try {
          const res = await fetch(metadata.cover);
          const blob = await res.blob();
          formData.append('cover', blob, 'cover.jpg');
        } catch (e) {
          console.error("Failed to fetch cover blob", e);
        }
      }
      
      // Send metadata for indexing
      const metadataForIndex = {
        title: metadata.title,
        album: metadata.album,
        artist: metadata.artist,
        year: metadata.year
      };
      formData.append('metadata', JSON.stringify(metadataForIndex));

      // Determine upload URL - handle subdirectory if needed
      // In production, upload.php should be in the same directory as the app
      const uploadScript = 'upload.php'; 
      
      const response = await fetch(uploadScript, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setShareUrl(data.url);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed: " + error.message + "\nNote: This feature requires a PHP server.");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-white/50">Loading metadata...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 md:p-8 max-w-4xl mx-auto"
    >
      <div className="flex flex-col md:flex-row gap-8">
        {/* Cover Art Section */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div 
            className="aspect-square rounded-xl bg-black/40 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {metadata.cover ? (
              <img src={metadata.cover} alt="Cover Art" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-2" />
                <span className="text-sm text-white/40">Click to upload cover</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-medium">Change Cover</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCoverUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="wm-position" className="block text-xs text-white/50 mb-1">Position</label>
                <select 
                  id="wm-position"
                  name="wm-position"
                  value={watermarkOptions.position}
                  onChange={e => setWatermarkOptions({...watermarkOptions, position: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none"
                >
                  <option value="bottom">Bottom</option>
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                </select>
              </div>
              <div>
                <label htmlFor="wm-color" className="block text-xs text-white/50 mb-1">Color</label>
                <select 
                  id="wm-color"
                  name="wm-color"
                  value={watermarkOptions.color}
                  onChange={e => setWatermarkOptions({...watermarkOptions, color: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none"
                >
                  <option value="yellow">Yellow</option>
                  <option value="white">White</option>
                  <option value="red">Red</option>
                  <option value="black">Black</option>
                </select>
              </div>
            </div>
            <button 
              onClick={handleWatermark}
              disabled={!metadata.cover}
              className="glass-button flex items-center justify-center gap-2 w-full text-sm py-2"
            >
              <Wand2 className="w-4 h-4" />
              {watermarked ? 'Update Watermark' : 'Add Watermark'}
            </button>
            </div>
        </div>

        {/* Metadata Form */}
        <div className="flex-1 space-y-6 min-w-0">
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white/60 mb-1">Title</label>
              <input 
                id="title"
                name="title"
                type="text" 
                value={metadata.title}
                onChange={e => setMetadata({...metadata, title: e.target.value})}
                className="glass-input"
                placeholder="Song Title"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="artist" className="block text-sm font-medium text-white/60 mb-1">Artists</label>
                <input 
                  id="artist"
                  name="artist"
                  type="text" 
                  value={metadata.artist}
                  onChange={e => setMetadata({...metadata, artist: e.target.value})}
                  className="glass-input"
                  placeholder="Artist Name"
                />
              </div>
              <div>
                <label htmlFor="album" className="block text-sm font-medium text-white/60 mb-1">Album</label>
                <input 
                  id="album"
                  name="album"
                  type="text" 
                  value={metadata.album}
                  onChange={e => setMetadata({...metadata, album: e.target.value})}
                  className="glass-input"
                  placeholder="Album Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-white/60 mb-1">Genre</label>
                <input 
                  id="genre"
                  name="genre"
                  type="text" 
                  value={metadata.genre}
                  onChange={e => setMetadata({...metadata, genre: e.target.value})}
                  className="glass-input"
                  placeholder="Genre"
                />
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-white/60 mb-1">Year</label>
                <input 
                  id="year"
                  name="year"
                  type="text" 
                  value={metadata.year}
                  onChange={e => setMetadata({...metadata, year: e.target.value})}
                  className="glass-input"
                  placeholder="Year"
                />
              </div>
            </div>

            <div>
              <label htmlFor="track" className="block text-sm font-medium text-white/60 mb-1">Track</label>
              <input 
                id="track"
                name="track"
                type="text" 
                value={metadata.track}
                onChange={e => setMetadata({...metadata, track: e.target.value})}
                className="glass-input"
                placeholder="Track"
              />
            </div>
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-white/60 mb-1">Comment</label>
              <input 
                id="comment"
                name="comment"
                type="text" 
                value={metadata.comment}
                onChange={e => setMetadata({...metadata, comment: e.target.value})}
                className="glass-input"
                placeholder="Comment"
              />
            </div>
          </div>

          {shareUrl && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-green-400 font-medium mb-1">File Uploaded Successfully!</p>
                  <p className="text-xs text-white/60 truncate">{shareUrl}</p>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-5 h-5" />
                  Save & Download
                </>
              )}
            </button>
            <button 
              onClick={handleUpload}
              disabled={saving || uploading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : (
                <>
                  <Share2 className="w-5 h-5" />
                  Upload & Share
                </>
              )}
            </button>
            <button 
              onClick={onCancel}
              disabled={saving || uploading}
              className="px-6 py-3 glass-button rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MetadataEditor;
