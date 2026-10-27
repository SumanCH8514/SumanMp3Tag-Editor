import React, { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Wand2, Music, Share2, Copy, Check, FileText, Sparkles, Loader2, ChevronLeft, ChevronRight, ArrowLeft, Disc3, CheckCircle2, CloudUpload, X } from 'lucide-react';
import { readTags, writeTags, applyLyricsBranding, getAudioDuration } from '../utils/metadata';
import { addWatermarkToImage } from '../utils/watermark';
import { fetchLyricsByServer, fetchSongMetadata, fetchImageAsBase64, cleanQueryString, SERVERS, getApiUrl } from '../utils/lrclib';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState('');
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [watermarked, setWatermarked] = useState(false);
  const fileInputRef = useRef(null);

  const [audioDuration, setAudioDuration] = useState(null);
  const [activeServer, setActiveServer] = useState('S1');
  const [fetchingLyrics, setFetchingLyrics] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [lyricsMode, setLyricsMode] = useState('synced');
  const [fetchedLyricsData, setFetchedLyricsData] = useState(null);

  const serverBarRef = useRef(null);
  const [isDraggingServerBar, setIsDraggingServerBar] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const [fetchingArtwork, setFetchingArtwork] = useState(false);

  const handleFetchArtworkOnline = async () => {
    let titleToSearch = metadata.title;
    if (!titleToSearch && file && file.name) {
      titleToSearch = cleanQueryString(file.name.replace(/\.[^/.]+$/, ''));
    }
    
    if (!titleToSearch) {
      toast.error('Please enter a song title first to fetch artwork.');
      return;
    }

    setFetchingArtwork(true);
    try {
      let durToPass = audioDuration;
      if (!durToPass) {
        durToPass = await getAudioDuration(file);
        if (durToPass) setAudioDuration(durToPass);
      }

      const res = await fetchSongMetadata({
        title: titleToSearch,
        artist: metadata.artist,
        album: metadata.album,
        duration: durToPass
      });

      if (res.success && res.cover) {
        let finalCover = res.cover;
        if (!finalCover.startsWith('data:')) {
          finalCover = await fetchImageAsBase64(res.cover);
        }

        setMetadata(prev => ({ 
          ...prev, 
          cover: finalCover,
          title: prev.title || res.title || titleToSearch
        }));
        setWatermarked(false);

        try {
          const coverRes = await fetch(finalCover);
          const blob = await coverRes.blob();
          setCoverFile(new File([blob], "online_cover.jpg", { type: blob.type }));
        } catch (e) {
          console.warn("Failed to convert artwork URL to file blob:", e);
        }

        toast.success(`Fetched HD Album Artwork from ${res.source || 'iTunes'}!`);
      } else {
        toast.error(`No album artwork found online for "${titleToSearch}".`);
      }
    } catch (err) {
      console.error("Fetch artwork failed", err);
      toast.error('Failed to fetch album artwork online.');
    } finally {
      setFetchingArtwork(false);
    }
  };

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
      toast.error('Please enter a song title first.');
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
          toast.success(`Auto-filled details from ${res.source || 'Music Database'}: ${updatedFields.join(', ')}`);
        } else {
          toast(`Song details are already up to date! (${res.source || 'iTunes'})`, { icon: '✨' });
        }
      } else {
        toast.error(res.error || 'No missing details found online.');
      }
    } catch (err) {
      console.error("Auto fetch metadata failed", err);
      toast.error('Failed to auto-fetch song details.');
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleFetchLyrics = async (targetServer = activeServer) => {
    if (!metadata.title) {
      toast.error('Please enter a song title first.');
      return;
    }
    setFetchingLyrics(true);
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

        toast.success(`Lyrics loaded from ${result.sourceName || 'Server'} (${defaultMode === 'synced' ? 'LRC Synced' : 'Plain Text'})`);
      } else {
        toast.error(result.error || `No lyrics found on ${targetServer}.`);
      }
    } catch (err) {
      console.error("Fetch lyrics failed", err);
      toast.error(`Failed to fetch lyrics from ${targetServer}.`);
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

    let newFileName = file.name;
    const titleBase = (metadata.title || "Unknown").replace(mainSuffix, "").trim();
    const artistInput = (metadata.artist || "Unknown").trim();
    const firstArtist = artistInput.split(/[,&/]|ft\.|feat\./i)[0].trim();
    
    const constructedName = `${titleBase} - ${firstArtist}${mainSuffix}`;
    const sanitizedName = constructedName.replace(/[/\\?%*:|"<>]/g, '-');
    newFileName = `${sanitizedName}.mp3`;

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
      toast.success(`"${newFile.name}" saved & downloaded!`);
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Failed to save audio tags: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadProgress(0);
    setUploadPhase('encoding');
    setShareUrl(null);
    try {
      const newFile = await prepareFileForSave();
      setUploadPhase('uploading');
      setUploadProgress(5);

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
          console.warn("Cover conversion failed:", e);
        }
      }
      
      const metadataForIndex = {
        title: metadata.title,
        album: metadata.album,
        artist: metadata.artist,
        year: metadata.year
      };
      formData.append('metadata', JSON.stringify(metadataForIndex));

      const uploadUrl = getApiUrl('upload.php');
      
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.min(Math.round((event.loaded / event.total) * 100), 99);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.success) {
                setUploadProgress(100);
                setUploadPhase('completed');
                setShareUrl(data.url);
                toast.success('Track uploaded and shared successfully!');
                resolve(data);
              } else {
                reject(new Error(data.error || 'Upload failed on server'));
              }
            } catch (err) {
              reject(new Error('Invalid server response'));
            }
          } else {
            reject(new Error(`Server error (${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error('Network connection error'));
        xhr.send(formData);
      });
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        <p className="text-xs font-medium">Parsing audio tags...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-3.5 sm:p-5 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-between relative overflow-hidden min-h-[calc(100vh-140px)]"
    >
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Back to queue"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {metadata.title || file.name}
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              ID3v2 Metadata Editor · {file.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoFetchMetadata}
            disabled={fetchingMetadata || !metadata.title}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Auto-fill missing details like Artists, Album, Year from iTunes"
          >
            {fetchingMetadata ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3 text-violet-300" />
            )}
            <span>Auto-Fill</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch flex-1 min-h-0">
        <div className="lg:col-span-3 flex flex-col justify-between gap-2 h-full">
          <div className="relative group flex-shrink-0">
            <div 
              className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-full lg:max-w-[285px] xl:max-w-[310px] aspect-square mx-auto rounded-2xl bg-slate-950/80 border border-white/10 hover:border-violet-500/50 flex items-center justify-center overflow-hidden relative cursor-pointer shadow-xl transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              {metadata.cover ? (
                <img src={metadata.cover} alt="Cover Art" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="text-center p-3 space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto text-slate-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-slate-400 block font-medium">Select Cover</span>
                </div>
              )}
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2 text-center">
                <ImageIcon className="w-5 h-5 text-violet-300" />
                <span className="text-xs font-semibold text-white">Change Artwork</span>
              </div>
            </div>

            {watermarked && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500/90 text-[10px] font-bold text-white shadow-md">
                Watermarked
              </span>
            )}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCoverUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          <div className="space-y-1 p-2 bg-slate-950/60 rounded-xl border border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between pb-0.5">
              <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wider">Watermark</span>
              <span className="text-[8.5px] text-slate-500">SumanOnline.Com</span>
            </div>

            <div className="space-y-1">
              <div>
                <span className="block text-[8.5px] font-semibold text-slate-400 mb-0.5">Position</span>
                <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-black/40 rounded-lg border border-white/[0.06]">
                  {['top', 'center', 'bottom'].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setWatermarkOptions({ ...watermarkOptions, position: pos })}
                      className={`py-0.5 text-[9px] font-semibold rounded capitalize transition-all cursor-pointer ${
                        watermarkOptions.position === pos 
                          ? 'bg-violet-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-[8.5px] font-semibold text-slate-400 mb-0.5">Color</span>
                <div className="flex items-center justify-between gap-0.5 p-0.5 bg-black/40 rounded-lg border border-white/[0.06]">
                  {[
                    { id: 'yellow', label: 'Yellow', bg: 'bg-yellow-400' },
                    { id: 'white', label: 'White', bg: 'bg-white' },
                    { id: 'red', label: 'Red', bg: 'bg-red-500' },
                    { id: 'black', label: 'Black', bg: 'bg-slate-900 border border-white/20' }
                  ].map((colorObj) => (
                    <button
                      key={colorObj.id}
                      type="button"
                      onClick={() => setWatermarkOptions({ ...watermarkOptions, color: colorObj.id })}
                      className={`flex-1 py-0.5 rounded text-[8.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        watermarkOptions.color === colorObj.id
                          ? 'bg-white/[0.15] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${colorObj.bg}`} />
                      <span>{colorObj.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleWatermark}
              disabled={!metadata.cover}
              className="w-full py-1 px-2 rounded-lg text-[10px] font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-violet-500/40 text-slate-200 hover:text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="w-3 h-3 text-violet-300" />
              <span>{watermarked ? 'Update Watermark' : 'Apply Watermark'}</span>
            </button>

            <button 
              type="button"
              onClick={handleFetchArtworkOnline}
              disabled={fetchingArtwork}
              className="w-full py-1 px-2 rounded-lg text-[10px] font-semibold bg-violet-600/20 hover:bg-violet-600/30 text-violet-200 border border-violet-500/40 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Fetch high-resolution music album cover art online"
            >
              {fetchingArtwork ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-violet-300" />
                  <span>Searching Apple HD...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3 h-3 text-violet-300" />
                  <span>Fetch Apple HD Artwork</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3 min-w-0 flex flex-col justify-between h-full">
          <div className="space-y-2.5 sm:space-y-3">
            <div>
              <label htmlFor="title" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Track Title
              </label>
              <input 
                id="title"
                name="title"
                type="text" 
                value={metadata.title}
                onChange={e => setMetadata({...metadata, title: e.target.value})}
                className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition-all"
                placeholder="Song Title"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              <div>
                <label htmlFor="artist" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Artists
                </label>
                <input 
                  id="artist"
                  name="artist"
                  type="text" 
                  value={metadata.artist}
                  onChange={e => setMetadata({...metadata, artist: e.target.value})}
                  className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition-all"
                  placeholder="Artist Name"
                />
              </div>
              <div>
                <label htmlFor="album" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Album
                </label>
                <input 
                  id="album"
                  name="album"
                  type="text" 
                  value={metadata.album}
                  onChange={e => setMetadata({...metadata, album: e.target.value})}
                  className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition-all"
                  placeholder="Album Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              <div>
                <label htmlFor="genre" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Genre
                </label>
                <input 
                  id="genre"
                  name="genre"
                  type="text" 
                  value={metadata.genre}
                  onChange={e => setMetadata({...metadata, genre: e.target.value})}
                  className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition-all"
                  placeholder="Genre"
                />
              </div>
              <div>
                <label htmlFor="year" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Year
                </label>
                <input 
                  id="year"
                  name="year"
                  type="text" 
                  value={metadata.year}
                  onChange={e => setMetadata({...metadata, year: e.target.value})}
                  className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition-all"
                  placeholder="Year"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              <div>
                <label htmlFor="track" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Track No.
                </label>
                <input 
                  id="track"
                  name="track"
                  type="text" 
                  value={metadata.track}
                  onChange={e => setMetadata({...metadata, track: e.target.value})}
                  className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition-all font-mono"
                  placeholder="1/12"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="comment" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Comment
                </label>
                <input 
                  id="comment"
                  name="comment"
                  type="text" 
                  value={metadata.comment}
                  onChange={e => setMetadata({...metadata, comment: e.target.value})}
                  className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition-all"
                  placeholder="Comment"
                />
              </div>
            </div>
          </div>

          {shareUrl && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 shadow-lg backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Shared Link Generated</span>
                  </p>
                  <p className="text-[10px] text-slate-300 truncate font-mono mt-0.5">{shareUrl}</p>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {uploading && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-violet-500/30 shadow-lg backdrop-blur-xl"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                    <span>
                      {uploadPhase === 'encoding' 
                        ? 'Applying ID3 tags & artwork...' 
                        : uploadProgress >= 100 
                        ? 'Finalizing cloud stream...' 
                        : 'Uploading Track to Cloud...'}
                    </span>
                  </span>
                  <span className="font-mono font-bold text-violet-300">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-white/[0.06]">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-400 transition-all duration-150"
                    style={{ width: `${Math.max(uploadProgress, 5)}%` }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button 
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 px-3 rounded-lg font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Encoding...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Download</span>
                </>
              )}
            </button>
            <button 
              onClick={handleUpload}
              disabled={saving || uploading}
              className="px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-400/30 text-white rounded-lg font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-violet-600/20"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-3.5 h-3.5 text-violet-200" />
                  <span>Upload and Share</span>
                </>
              )}
            </button>
            <button 
              onClick={onCancel}
              disabled={saving || uploading}
              className="px-3.5 py-2.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-slate-300 hover:text-white rounded-lg font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-950/60 border border-white/[0.08] rounded-xl p-3 sm:p-3.5 min-h-0 space-y-2.5 shadow-xl backdrop-blur-xl h-full">
          <div className="space-y-2 border-b border-white/[0.08] pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                <span>Lyrics Studio</span>
              </span>

              {metadata.lyrics && (
                <div className="flex bg-black/50 p-0.5 rounded border border-white/10 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleLyricsModeChange('synced')}
                    className={`px-1.5 py-0.5 rounded transition-all font-semibold ${lyricsMode === 'synced' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Synced (LRC)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLyricsModeChange('plain')}
                    className={`px-1.5 py-0.5 rounded transition-all font-semibold ${lyricsMode === 'plain' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Plain
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex items-center bg-black/40 border border-white/[0.06] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => scrollServerBar('left')}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors flex-shrink-0"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1 flex-shrink-0">
                Server:
              </span>

              <div
                ref={serverBarRef}
                onMouseDown={handleServerBarMouseDown}
                onMouseLeave={handleServerBarMouseUpOrLeave}
                onMouseUp={handleServerBarMouseUpOrLeave}
                onMouseMove={handleServerBarMouseMove}
                className={`flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5 flex-nowrap touch-pan-x flex-1 ${
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
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all flex-shrink-0 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
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
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors flex-shrink-0"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col space-y-1.5 min-h-0">
            <div className="relative flex-1 flex flex-col bg-black/50 border border-white/[0.08] focus-within:border-violet-500/50 rounded-lg overflow-hidden transition-all">
              <textarea
                id="lyrics"
                name="lyrics"
                value={metadata.lyrics}
                onChange={e => setMetadata({ ...metadata, lyrics: e.target.value })}
                placeholder="No lyrics loaded. Click 'Fetch Lyrics' to retrieve timestamps or enter plain text..."
                className="w-full flex-1 min-h-[220px] bg-transparent p-3 text-xs text-slate-200 focus:outline-none resize-none font-mono leading-relaxed custom-scrollbar"
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
              <span className="font-mono">{metadata.lyrics ? `${metadata.lyrics.split('\n').length} lines` : '0 lines'}</span>
              {metadata.lyrics && (
                <button
                  type="button"
                  onClick={() => setMetadata({ ...metadata, lyrics: '' })}
                  className="text-slate-400 hover:text-rose-400 font-medium transition-colors cursor-pointer"
                >
                  Clear Lyrics
                </button>
              )}
            </div>
          </div>

          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => handleFetchLyrics(activeServer)}
              disabled={fetchingLyrics || saving || uploading}
              className="w-full py-1.5 px-3 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg font-bold shadow-sm shadow-violet-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {fetchingLyrics ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-violet-200" />
                  <span>Fetch Lyrics ({SERVERS.find(s => s.id === activeServer)?.label || activeServer})</span>
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
