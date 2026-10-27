import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Download, Share2, Music, Volume2, VolumeX, RotateCcw, RotateCw, Repeat, Check, Disc, SunMedium, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getValidCoverUrl, getApiUrl } from '../utils/lrclib';

const formatTime = (timeInSeconds) => {
  if (!timeInSeconds || isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return '0:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const MusicPlayerPage = ({ songId: propSongId, onBack }) => {
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(true);

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const progressFillRef = useRef(null);
  const currentTimeTextRef = useRef(null);
  const durationTextRef = useRef(null);
  const isDraggingRef = useRef(false);

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);

  const titleContainerRef = useRef(null);
  const titleMeasureRef = useRef(null);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);

  useEffect(() => {
    let targetId = propSongId;

    if (!targetId) {
      const urlParams = new URLSearchParams(window.location.search);
      targetId = urlParams.get('play') || urlParams.get('id') || urlParams.get('song');
    }

    if (!targetId) {
      const urlParams = new URLSearchParams(window.location.search);
      const titleParam = urlParams.get('title');
      const urlParam = urlParams.get('url');
      if (titleParam && urlParam) {
        setSong({
          id: 'query_song',
          title: decodeURIComponent(titleParam),
          artist: urlParams.get('artist') ? decodeURIComponent(urlParams.get('artist')) : '',
          album: urlParams.get('album') ? decodeURIComponent(urlParams.get('album')) : '',
          coverUrl: getValidCoverUrl(urlParams.get('cover') ? decodeURIComponent(urlParams.get('cover')) : null),
          url: getValidCoverUrl(decodeURIComponent(urlParam)),
          filename: `${decodeURIComponent(titleParam)}.mp3`
        });
        setLoading(false);
        return;
      }
    }

    if (targetId) {
      fetchSongDetails(targetId);
    } else {
      setError("No song specified in link.");
      setLoading(false);
    }
  }, [propSongId]);

  useEffect(() => {
    const checkOverflow = () => {
      const container = titleContainerRef.current;
      const measure = titleMeasureRef.current;
      if (container && measure) {
        setIsTitleOverflowing(measure.offsetWidth > container.clientWidth);
      }
    };

    const timer = setTimeout(checkOverflow, 80);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [song?.title, song?.filename]);

  const fetchSongDetails = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl(`get_song.php?id=${encodeURIComponent(id)}`));
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.song) {
          const s = data.song;
          s.coverUrl = getValidCoverUrl(s.coverUrl);
          s.url = getValidCoverUrl(s.url);
          setSong(s);
          if (s.id && window.history && window.history.replaceState) {
            const currentParam = new URLSearchParams(window.location.search).get('play');
            if (currentParam !== s.id) {
              const newUrl = `${window.location.origin}${window.location.pathname}?play=${encodeURIComponent(s.id)}`;
              window.history.replaceState({ play: s.id }, '', newUrl);
            }
          }
          setLoading(false);
          return;
        }
      }

      const listRes = await fetch(getApiUrl('list_files.php'));
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.files && Array.isArray(listData.files)) {
          const found = listData.files.find(f => f.id === id || f.filename === id || f.title === id);
          if (found) {
            found.coverUrl = getValidCoverUrl(found.coverUrl);
            found.url = getValidCoverUrl(found.url);
            setSong(found);
            if (found.id && window.history && window.history.replaceState) {
              const currentParam = new URLSearchParams(window.location.search).get('play');
              if (currentParam !== found.id) {
                const newUrl = `${window.location.origin}${window.location.pathname}?play=${encodeURIComponent(found.id)}`;
                window.history.replaceState({ play: found.id }, '', newUrl);
              }
            }
            setLoading(false);
            return;
          }
        }
      }

      setError("Song not found or has been removed.");
    } catch {
      setError("Unable to load song. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const initWebAudio = () => {
    const audio = audioRef.current;
    if (!audio || audioCtxRef.current) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch {
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const grad = ctx.createLinearGradient(0, height, 0, 0);
    grad.addColorStop(0, '#c084fc');
    grad.addColorStop(0.5, '#f472b6');
    grad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = grad;

    const barCount = 32;
    const gap = 3;
    const totalGaps = (barCount - 1) * gap;
    const barWidth = (width - totalGaps) / barCount;

    if (!isPlaying) {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        const y = height - 3;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, 3, [1, 1, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, 3);
        }
        ctx.fill();
      }
      return;
    }

    let phase = 0;
    let animId;

    const drawFrame = () => {
      phase += 0.05;
      ctx.clearRect(0, 0, width, height);

      let dataArray = null;
      if (analyserRef.current) {
        dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < barCount; i++) {
        let barHeight = 3;
        if (dataArray && dataArray[i] > 0) {
          barHeight = Math.max(3, (dataArray[i] / 255) * (height - 2));
        } else {
          const sinVal = Math.sin(phase + i * 0.28);
          barHeight = Math.max(3, Math.abs(sinVal) * (height - 4));
        }

        const x = i * (barWidth + gap);
        const y = height - barHeight;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animId = requestAnimationFrame(drawFrame);
    };

    animId = requestAnimationFrame(drawFrame);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  const updateProgressDirectly = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const cur = audio.currentTime || 0;
    const dur = (audio.duration && isFinite(audio.duration) && audio.duration > 0) ? audio.duration : duration;

    if (dur > 0 && progressFillRef.current) {
      const pct = Math.max(0, Math.min(100, (cur / dur) * 100));
      progressFillRef.current.style.width = `${pct}%`;
    }

    if (currentTimeTextRef.current) {
      currentTimeTextRef.current.textContent = formatTime(cur);
    }
  }, [duration]);

  useEffect(() => {
    if (!isPlaying) return;

    let animId;
    const loop = () => {
      updateProgressDirectly();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, updateProgressDirectly]);

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio && isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
      if (durationTextRef.current) {
        durationTextRef.current.textContent = formatTime(audio.duration);
      }
    }
    updateProgressDirectly();
  };

  const skipSeconds = useCallback((seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    const effectiveDur = duration || (isFinite(audio.duration) ? audio.duration : 0);
    audio.currentTime = Math.max(0, Math.min(effectiveDur, (audio.currentTime || 0) + seconds));
    updateProgressDirectly();
  }, [duration, updateProgressDirectly]);

  useEffect(() => {
    if (!song) return;

    if (song.title) {
      document.title = `${song.title} - ${song.artist || 'SumanMp3Tag Player'}`;
    }

    if ('mediaSession' in navigator) {
      try {
        const artworkArray = song.coverUrl ? [
          { src: song.coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: song.coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: song.coverUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: song.coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: song.coverUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: song.coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ] : [];

        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: song.title || song.filename || 'Untitled Track',
          artist: song.artist || 'Unknown Artist',
          album: song.album || 'SumanMp3Tag',
          artwork: artworkArray
        });

        navigator.mediaSession.setActionHandler('play', () => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        });

        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (audioRef.current && details.seekTime !== undefined) {
            audioRef.current.currentTime = details.seekTime;
            updateProgressDirectly();
          }
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => skipSeconds(-10));
        navigator.mediaSession.setActionHandler('nexttrack', () => skipSeconds(10));
      } catch {
      }
    }

    return () => {
      document.title = "SumanMp3Tag - Online MP3 Tag & Cover Editor";
    };
  }, [song, updateProgressDirectly, skipSeconds]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    initWebAudio();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        updateProgressDirectly();
      }).catch(() => {});
    }
  };

  const seekFromPointer = (e) => {
    const bar = progressBarRef.current;
    const audio = audioRef.current;
    if (!bar || !audio) return;
    const effectiveDur = duration || (isFinite(audio.duration) ? audio.duration : 0);
    if (!effectiveDur) return;

    const rect = bar.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = pct * effectiveDur;
    updateProgressDirectly();
  };

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    seekFromPointer(e);
  };

  const handlePointerMove = (e) => {
    if (isDraggingRef.current) {
      seekFromPointer(e);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = val;
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const handleDownload = () => {
    if (!song || !song.url) return;
    const a = document.createElement('a');
    a.href = song.url;
    a.download = song.filename || `${song.title || 'song'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    let shareUrl = window.location.href;
    if (song && song.id) {
      const baseUrl = window.location.origin + window.location.pathname;
      shareUrl = `${baseUrl}?play=${encodeURIComponent(song.id)}`;
    }

    const titleText = song ? `🎵 Listen to "${song.title || 'Song'}" by ${song.artist || 'Unknown Artist'} on SumanMp3Tag Player` : 'Listen on SumanMp3Tag Player';
    const fullShareMessage = `${titleText}\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: song ? `${song.title} - ${song.artist}` : 'SumanMp3Tag Player',
          text: titleText,
          url: shareUrl
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch {
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullShareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-white/60 font-medium animate-pulse text-sm">Loading shared track...</p>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 glass-panel text-center space-y-5 border border-white/10 rounded-3xl backdrop-blur-xl">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
          <Disc className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Song Not Found</h3>
          <p className="text-xs text-white/50">{error || "The requested song is unavailable or has been removed."}</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            Go to Mp3Tag Editor
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-4xl mx-auto py-2 md:py-6 px-3 relative z-10"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {ambientEnabled && song?.coverUrl && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 md:opacity-40 blur-3xl scale-110 transform-gpu will-change-transform"
            style={{ backgroundImage: `url(${song.coverUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />
        </div>
      )}

      <audio
        ref={audioRef}
        src={song.url}
        loop={isLooping}
        preload="auto"
        crossOrigin="anonymous"
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
      />

      <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-20 gap-2 sm:gap-3">
        <div className="flex-1 h-8 sm:h-10 bg-slate-900/80 rounded-xl sm:rounded-2xl border border-white/10 px-2.5 sm:px-4 flex items-center justify-between overflow-hidden shadow-lg min-w-0">
          <div className="hidden sm:flex items-center gap-2 mr-3 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-pink-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-[11px] font-bold tracking-wider text-purple-200 uppercase">Visualizer</span>
          </div>
          <canvas ref={canvasRef} className="w-full h-6 sm:h-7 cursor-pointer" width={450} height={28} />
        </div>

        <button
          type="button"
          onClick={() => setAmbientEnabled(!ambientEnabled)}
          className={`hidden sm:flex px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-all items-center gap-1.5 cursor-pointer flex-shrink-0 ${
            ambientEnabled
              ? 'bg-purple-500/25 text-purple-200 border-purple-400/40 shadow-lg shadow-purple-500/20'
              : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
          }`}
          title="Toggle Full-Page Ambient Artwork Lighting"
        >
          <SunMedium className={`w-3.5 h-3.5 ${ambientEnabled ? 'text-amber-300 animate-pulse' : 'text-white/40'}`} />
          <span className="whitespace-nowrap">Ambient Mode {ambientEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden bg-slate-900/90 z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-6 md:gap-10 items-center relative z-10">
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/20 group ring-1 ring-white/10">
              {song.coverUrl ? (
                <img
                  src={song.coverUrl}
                  alt={song.title || 'Album Art'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900/50 via-slate-900 to-pink-900/50 flex items-center justify-center">
                  <Music className="w-14 h-14 md:w-20 md:h-20 text-purple-300/40" />
                </div>
              )}

              {isPlaying && (
                <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/80 border border-white/20 text-[10px] sm:text-xs font-semibold text-purple-200 flex items-center gap-1.5 shadow-xl">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Playing
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col justify-between space-y-2.5 sm:space-y-4 min-w-0">
            <div className="space-y-0.5 sm:space-y-1 w-full min-w-0">
              <span
                ref={titleMeasureRef}
                className="absolute invisible whitespace-nowrap pointer-events-none text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight"
                aria-hidden="true"
              >
                {song.title || song.filename || 'Untitled Track'}
              </span>

              <div
                ref={titleContainerRef}
                className={`w-full overflow-hidden relative ${
                  isTitleOverflowing
                    ? '[mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]'
                    : ''
                }`}
              >
                {isTitleOverflowing ? (
                  <div className="animate-title-marquee py-0.5">
                    <span className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md pr-8 whitespace-nowrap">
                      {song.title || song.filename || 'Untitled Track'}
                    </span>
                    <span className="text-white/30 text-xl sm:text-3xl md:text-4xl pr-8">•</span>
                    <span className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md pr-8 whitespace-nowrap">
                      {song.title || song.filename || 'Untitled Track'}
                    </span>
                    <span className="text-white/30 text-xl sm:text-3xl md:text-4xl pr-8">•</span>
                  </div>
                ) : (
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md truncate text-center md:text-left">
                    {song.title || song.filename || 'Untitled Track'}
                  </h2>
                )}
              </div>

              <p className="text-sm sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-rose-300 truncate text-center md:text-left">
                {song.artist || 'Unknown Artist'}
              </p>
              {song.album && (
                <p className="text-[11px] sm:text-sm text-white/50 font-medium truncate text-center md:text-left">
                  {song.album} {song.year ? `• ${song.year}` : ''}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div
                ref={progressBarRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                className="py-2 -my-2 cursor-pointer group"
              >
                <div className="h-2 sm:h-2.5 w-full bg-white/10 group-hover:bg-white/20 rounded-full relative overflow-hidden transition-colors border border-white/5">
                  <div
                    ref={progressFillRef}
                    className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full relative shadow-[0_0_12px_rgba(168,85,247,0.6)] will-change-[width]"
                    style={{ width: '0%' }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9)] scale-100 group-hover:scale-125 transition-transform border border-purple-300" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] sm:text-xs text-white/70 font-mono font-bold tracking-wide">
                <span ref={currentTimeTextRef}>0:00</span>
                <span ref={durationTextRef}>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5 sm:gap-3.5 py-0.5 sm:py-1">
              <button
                type="button"
                onClick={() => setIsLooping(!isLooping)}
                className={`p-2 sm:p-2.5 rounded-full transition-all cursor-pointer ${
                  isLooping
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-md'
                    : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
                title={isLooping ? "Loop On" : "Loop Off"}
              >
                <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => skipSeconds(-10)}
                className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all active:scale-95 cursor-pointer"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 text-white flex items-center justify-center shadow-[0_0_25px_rgba(219,39,119,0.5)] active:scale-95 transition-all cursor-pointer border border-pink-300/40 ring-4 ring-pink-500/20"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-white" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => skipSeconds(10)}
                className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all active:scale-95 cursor-pointer"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className={`p-2 sm:p-2.5 rounded-full transition-all cursor-pointer ${
                  isMuted
                    ? 'text-red-400 bg-red-500/20 border border-red-500/40'
                    : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 flex-shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full accent-pink-500 bg-white/10 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-0.5 sm:pt-1">
              <button
                type="button"
                onClick={handleDownload}
                className="py-2.5 px-3 sm:py-3 sm:px-5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer relative"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />
                <span>Download Song</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="py-2.5 px-3 sm:py-3 sm:px-5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer relative"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    <span className="text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />
                    <span>Share Music</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-3 sm:hidden relative z-20">
        <button
          type="button"
          onClick={() => setAmbientEnabled(!ambientEnabled)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
            ambientEnabled
              ? 'bg-purple-500/25 text-purple-200 border-purple-400/40 shadow-lg shadow-purple-500/20'
              : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
          }`}
          title="Toggle Full-Page Ambient Artwork Lighting"
        >
          <SunMedium className={`w-3.5 h-3.5 ${ambientEnabled ? 'text-amber-300 animate-pulse' : 'text-white/40'}`} />
          <span>Ambient Mode {ambientEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </motion.div>
  );
};

export default MusicPlayerPage;
