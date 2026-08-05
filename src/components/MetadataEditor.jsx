import React, { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Wand2, Download, Music, Share2, Copy, Check, FileText, Sparkles, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { readTags, writeTags, applyLyricsBranding, getAudioDuration } from '../utils/metadata';
import { addWatermarkToImage } from '../utils/watermark';
import { fetchLyricsByServer, fetchSongMetadata, SERVERS } from '../utils/lrclib';
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
    lyrics: '',
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

  const [audioDuration, setAudioDuration] = useState(null);
  const [activeServer, setActiveServer] = useState('S1');
  const [fetchingLyrics, setFetchingLyrics] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [lyricsStatus, setLyricsStatus] = useState(null);
  const [lyricsMode, setLyricsMode] = useState('synced');
  const [fetchedLyricsData, setFetchedLyricsData] = useState(null);

  const serverBarRef = useRef(null);
  const [isDraggingServerBar, setIsDraggingServerBar] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const scrollServerBar = (direction) => {
    if (serverBarRef.current) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      serverBarRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleServerBarMouseDown = (e) => {
    if (!serverBarRef.current) return;
    setIsDraggingServerBar(true);
    setDragStartX(e.pageX - serverBarRef.current.offsetLeft);
    setDragScrollLeft(serverBarRef.current.scrollLeft);
  };

  const handleServerBarMouseUpOrLeave = () => {
    setIsDraggingServerBar(false);
  };

  const handleServerBarMouseMove = (e) => {
    if (!isDraggingServerBar || !serverBarRef.current) return;
    e.preventDefault();
    const x = e.pageX - serverBarRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    serverBarRef.current.scrollLeft = dragScrollLeft - walk;
  };

  const handleServerButtonClick = (serverObj, e) => {
    setActiveServer(serverObj.id);
    handleFetchLyrics(serverObj.id);
    if (e.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const [watermarkOptions, setWatermarkOptions] = useState({
    color: 'yellow',
    position: 'bottom'
  });

  useEffect(() => {
    const loadMetadata = async () => {
      setLoading(true);
      try {
        const tags = await readTags(file);
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
          lyrics: tags.lyrics || '',
          cover: tags.cover
        });

        const dur = await getAudioDuration(file);
        if (dur) setAudioDuration(dur);
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

  const handleAutoFetchMetadata = async () => {
    if (!metadata.title) {
      setLyricsStatus({ type: 'error', text: 'Please enter a song title first.' });
      return;
    }
    setFetchingMetadata(true);
    try {
      let durToPass = audioDuration;
      if (!durToPass) {
        durToPass = await getAudioDuration(file);
        if (durToPass) setAudioDuration(durToPass);
      }

      const res = await fetchSongMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        duration: durToPass
      });

      if (res.success) {
        const updatedFields = [];
        setMetadata(prev => {
          const nextState = { ...prev };
          if (res.artist && (!prev.artist || prev.artist === 'Unknown Artist' || prev.artist === 'SumanOnline.Com')) {
            nextState.artist = res.artist;
            updatedFields.push('Artists');
          }
          if (res.album && (!prev.album || prev.album === 'Unknown Album' || prev.album === 'SumanOnline.Com')) {
            nextState.album = res.album;
            updatedFields.push('Album');
          }
          if (res.title && (!prev.title || prev.title === 'Unknown Title')) {
            nextState.title = res.title;
            updatedFields.push('Title');
          }
          if (res.year && (!prev.year || prev.year === '2026')) {
            nextState.year = res.year;
            updatedFields.push('Year');
          }
          if (res.genre && !prev.genre) {
            nextState.genre = res.genre;
            updatedFields.push('Genre');
          }
          if (res.cover && !prev.cover) {
            nextState.cover = res.cover;
            updatedFields.push('Cover Art');
          }
          return nextState;
        });

        if (updatedFields.length > 0) {
          setLyricsStatus({
            type: 'success',
            text: `Auto-filled details from ${res.source || 'Music Database'}: ${updatedFields.join(', ')}`
          });
        } else {
          setLyricsStatus({
            type: 'success',
            text: `Song details are already up to date! (${res.source || 'iTunes'})`
          });
        }
      } else {
        setLyricsStatus({
          type: 'error',
          text: res.error || 'No missing details found online.'
        });
      }
    } catch (err) {
      console.error("Auto fetch metadata failed", err);
      setLyricsStatus({ type: 'error', text: 'Failed to auto-fetch song details.' });
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleFetchLyrics = async (targetServer = activeServer) => {
    if (!metadata.title) {
      setLyricsStatus({ type: 'error', text: 'Please enter a song title first.' });
      return;
    }
    setFetchingLyrics(true);
    setLyricsStatus(null);
    try {
      let durToPass = audioDuration;
      if (!durToPass) {
        durToPass = await getAudioDuration(file);
        if (durToPass) setAudioDuration(durToPass);
      }

      const result = await fetchLyricsByServer({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        duration: durToPass,
        server: targetServer
      });

      if (result.success) {
        setFetchedLyricsData(result);

        // Prefer English/Latin Plain lyrics over Hindi Devanagari Synced lyrics by default if synced is Devanagari
        const preferPlain = result.plainLyrics && !result.plainIsDevanagari && result.syncedIsDevanagari;
        const defaultMode = preferPlain ? 'plain' : (result.syncedLyrics ? 'synced' : 'plain');

        setLyricsMode(defaultMode);

        let textToUse = defaultMode === 'synced'
          ? (result.syncedLyrics || result.plainLyrics || '')
          : (result.plainLyrics || result.syncedLyrics || '');

        if (defaultMode === 'plain' && textToUse) {
          textToUse = textToUse.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s*/g, '').trim();
        }

        const durToUse = result.duration || audioDuration;
        const brandedText = applyLyricsBranding(textToUse, durToUse);
        setMetadata(prev => ({ ...prev, lyrics: brandedText }));

        setLyricsStatus({
          type: 'success',
          text: `Lyrics loaded from ${result.sourceName || 'Server'} (${defaultMode === 'synced' ? 'LRC Synced' : 'Plain Text'})`
        });
      } else {
        setLyricsStatus({ type: 'error', text: result.error || `No lyrics found on ${targetServer}.` });
      }
    } catch (err) {
      console.error("Fetch lyrics failed", err);
      setLyricsStatus({ type: 'error', text: `Failed to fetch lyrics from ${targetServer}.` });
    } finally {
      setFetchingLyrics(false);
    }
  };

  const handleLyricsModeChange = (mode) => {
    setLyricsMode(mode);
    let rawText = '';
    if (fetchedLyricsData) {
      if (mode === 'synced') {
        rawText = fetchedLyricsData.syncedLyrics || fetchedLyricsData.plainLyrics || metadata.lyrics;
      } else {
        rawText = fetchedLyricsData.plainLyrics || fetchedLyricsData.syncedLyrics || metadata.lyrics;
      }
    } else {
      rawText = metadata.lyrics;
    }

    if (rawText) {
      if (mode === 'plain') {
        rawText = rawText.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s*/g, '').trim();
      }
      const durToUse = (fetchedLyricsData && fetchedLyricsData.duration) || audioDuration;
      setMetadata(prev => ({ ...prev, lyrics: applyLyricsBranding(rawText, durToUse) }));
    }
  };

  const prepareFileForSave = async () => {
    const mainSuffix = " - SumanOnline.Com";
    
    // 1. Prepare Metadata for Writing
    let titleToSave = metadata.title || "";
    if (titleToSave && !titleToSave.endsWith(mainSuffix)) {
      titleToSave += mainSuffix;
    }

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
      copyright: metadata.copyright || defaultValue,
      duration: audioDuration,
      lyrics: applyLyricsBranding(metadata.lyrics, audioDuration)
    };

    // 2. Prepare Filename: {Title} - {First Artist} - SumanOnline.Com.mp3
    let newFileName = file.name;
    const titleBase = (metadata.title || "Unknown").replace(mainSuffix, "").trim();
    const artistInput = (metadata.artist || "Unknown").trim();
    const firstArtist = artistInput.split(/[,&/]|ft\.|feat\./i)[0].trim();
    
    const constructedName = `${titleBase} - ${firstArtist}${mainSuffix}`;
    const sanitizedName = constructedName.replace(/[/\\?%*:|"<>]/g, '-');
    newFileName = `${sanitizedName}.mp3`;

    // 3. Handle Cover Art Persistence
    let finalCoverFile = coverFile;
    if (!finalCoverFile && metadata.cover) {
      try {
        const response = await fetch(metadata.cover);
        const blob = await response.blob();
        finalCoverFile = new File([blob], "cover.jpg", { type: blob.type });
      } catch (e) {
        console.warn("Could not retrieve current cover for saving:", e);
      }
    }

    const newBlob = await writeTags(file, metadataToSave, finalCoverFile);
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
      
      const metadataForIndex = {
        title: metadata.title,
        album: metadata.album,
        artist: metadata.artist,
        year: metadata.year
      };
      formData.append('metadata', JSON.stringify(metadataForIndex));

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

  useEffect(() => {
    if (lyricsStatus) {
      const timer = setTimeout(() => {
        setLyricsStatus(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [lyricsStatus]);

  if (loading) {
    return <div className="p-8 text-center text-white/50">Loading metadata...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel pt-16 px-6 md:px-8 pb-6 md:pb-8 max-w-7xl mx-auto relative"
    >
      {/* Top Reserved Slot Notification Banner - Exactly inside instructed white box space */}
      <AnimatePresence>
        {lyricsStatus && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`absolute top-3.5 left-6 right-6 z-30 p-2.5 md:p-3 rounded-xl text-xs md:text-sm font-medium flex items-center justify-between gap-3 border backdrop-blur-md shadow-lg transition-all ${
              lyricsStatus.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-emerald-950/20'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 shadow-amber-950/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 flex-shrink-0 text-pink-400 animate-pulse" />
              <span>{lyricsStatus.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setLyricsStatus(null)}
              className="text-white/60 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cover Art Section - 3 cols */}
        <div className="lg:col-span-3 flex flex-col gap-4">
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
                  className="glass-select !px-2 !py-1 text-sm"
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
                  className="glass-select !px-2 !py-1 text-sm"
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

        {/* Metadata Form Section - 5 cols */}
        <div className="lg:col-span-5 space-y-6 min-w-0 flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="title" className="block text-sm font-medium text-white/60">Title</label>
                <button
                  type="button"
                  onClick={handleAutoFetchMetadata}
                  disabled={fetchingMetadata || !metadata.title}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Auto-fill missing details like Artists, Album, Year from online music database"
                >
                  {fetchingMetadata ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-cyan-200" />
                      Auto Fetch Details
                    </>
                  )}
                </button>
              </div>
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

        {/* Lyrics Section - 4 cols */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-white/5 border border-white/10 rounded-2xl p-5 min-h-[460px] space-y-3.5 shadow-2xl backdrop-blur-xl relative">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-3">
            {/* Row 1: Title & Mode Toggle */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 flex items-center gap-2 uppercase tracking-wider">
                <FileText className="w-5 h-5 text-pink-400" />
                LYRICS
              </h3>

              {/* Mode Toggle (LRC Synced vs Plain) - ALWAYS VISIBLE when lyrics exist */}
              {metadata.lyrics && (
                <div className="flex bg-black/50 p-1 rounded-lg border border-white/10 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleLyricsModeChange('synced')}
                    className={`px-2.5 py-0.5 rounded transition-all font-semibold ${lyricsMode === 'synced' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm' : 'text-white/50 hover:text-white'}`}
                    title="Switch to Synced LRC Lyrics"
                  >
                    LRC (Synced)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLyricsModeChange('plain')}
                    className={`px-2.5 py-0.5 rounded transition-all font-semibold ${lyricsMode === 'plain' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm' : 'text-white/50 hover:text-white'}`}
                    title="Switch to Plain Text Lyrics"
                  >
                    Plain
                  </button>
                </div>
              )}
            </div>

            {/* Row 2: Slidable Dedicated Server Switcher Bar with Scroll Arrows & Mouse Drag */}
            <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => scrollServerBar('left')}
                className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest pl-1 pr-1 flex-shrink-0 select-none">
                Server:
              </span>

              <div
                ref={serverBarRef}
                onMouseDown={handleServerBarMouseDown}
                onMouseLeave={handleServerBarMouseUpOrLeave}
                onMouseUp={handleServerBarMouseUpOrLeave}
                onMouseMove={handleServerBarMouseMove}
                className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 flex-nowrap touch-pan-x flex-1 select-none ${
                  isDraggingServerBar ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              >
                {SERVERS.map((serverObj) => {
                  const isActive = activeServer === serverObj.id;
                  return (
                    <button
                      key={serverObj.id}
                      type="button"
                      onClick={(e) => handleServerButtonClick(serverObj, e)}
                      title={serverObj.desc}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white shadow-md shadow-purple-500/25 border border-white/20 scale-[1.02]'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {serverObj.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollServerBar('right')}
                className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col space-y-2">
            <div className="relative flex-1 flex flex-col bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:border-purple-500/50 transition-all">
              <textarea
                id="lyrics"
                name="lyrics"
                value={metadata.lyrics}
                onChange={e => setMetadata({ ...metadata, lyrics: e.target.value })}
                placeholder="No lyrics loaded. Click 'Fetch Lyrics' to search across servers, or enter lyrics manually..."
                className="w-full flex-1 min-h-[250px] bg-transparent p-3.5 text-xs md:text-sm text-slate-200 focus:outline-none resize-none font-mono leading-relaxed custom-scrollbar"
              />
            </div>
            
            <div className="flex justify-between items-center text-[11px] text-white/50 px-1 pt-0.5">
              <span className="font-mono">{metadata.lyrics ? `${metadata.lyrics.split('\n').length} lines` : '0 lines'}</span>
              {metadata.lyrics && (
                <button
                  type="button"
                  onClick={() => setMetadata({ ...metadata, lyrics: '' })}
                  className="text-slate-400 hover:text-rose-400 font-medium transition-colors"
                >
                  Clear Lyrics
                </button>
              )}
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => handleFetchLyrics(activeServer)}
              disabled={fetchingLyrics || saving || uploading}
              className="w-full px-5 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 text-white text-sm rounded-xl font-bold shadow-xl shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fetchingLyrics ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching Lyrics...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-pink-200" />
                  Fetch Lyrics ({SERVERS.find(s => s.id === activeServer)?.label || activeServer})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MetadataEditor;
