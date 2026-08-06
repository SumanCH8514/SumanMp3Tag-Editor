import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Share2, Music, Volume2, VolumeX, RotateCcw, RotateCw, Repeat, Check, ArrowLeft, Disc, SunMedium } from 'lucide-react';
import { motion } from 'framer-motion';
import { getValidCoverUrl, getApiUrl } from '../utils/lrclib';

const MusicPlayerPage = ({ songId: propSongId, onBack }) => {
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
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
  const lastStateUpdateRef = useRef(0);

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

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
    } catch (err) {
      console.error("Failed to load song:", err);
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
    } catch (e) {
      console.warn("Web Audio API visualizer setup warning:", e);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let phase = 0;

    const render = () => {
      phase += 0.06;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let dataArray = null;
      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      const barCount = 32;
      const gap = 3;
      const totalGaps = (barCount - 1) * gap;
      const barWidth = (width - totalGaps) / barCount;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 2;
        if (isPlaying) {
          if (dataArray && dataArray[i] > 0) {
            barHeight = (dataArray[i] / 255) * (height - 4);
          } else {
            const sinVal = Math.sin(phase + i * 0.25);
            barHeight = Math.max(3, Math.abs(sinVal) * (height - 4));
          }
        } else {
          barHeight = 2;
        }

        const x = i * (barWidth + gap);
        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#c084fc');
        grad.addColorStop(0.5, '#f472b6');
        grad.addColorStop(1, '#38bdf8');

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const updatePlaybackDOM = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const cur = audio.currentTime || 0;
    const dur = (audio.duration && isFinite(audio.duration) && audio.duration > 0) ? audio.duration : duration;

    if (progressFillRef.current && dur > 0) {
      const pct = Math.max(0, Math.min(100, (cur / dur) * 100));
      progressFillRef.current.style.width = `${pct}%`;
    }

    if (currentTimeTextRef.current) {
      currentTimeTextRef.current.textContent = formatTime(cur);
    }

    if (durationTextRef.current && dur > 0) {
      durationTextRef.current.textContent = formatTime(dur);
    }

    const now = Date.now();
    if (now - lastStateUpdateRef.current > 1000) {
      lastStateUpdateRef.current = now;
      setCurrentTime(cur);
      if (dur > 0 && dur !== duration) setDuration(dur);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncPlayback = () => {
      updatePlaybackDOM();
    };

    syncPlayback();

    audio.addEventListener('timeupdate', syncPlayback);
    audio.addEventListener('loadedmetadata', syncPlayback);
    audio.addEventListener('durationchange', syncPlayback);
    audio.addEventListener('canplay', syncPlayback);
    audio.addEventListener('playing', syncPlayback);

    const timer = setInterval(syncPlayback, 400);

    return () => {
      audio.removeEventListener('timeupdate', syncPlayback);
      audio.removeEventListener('loadedmetadata', syncPlayback);
      audio.removeEventListener('durationchange', syncPlayback);
      audio.removeEventListener('canplay', syncPlayback);
      audio.removeEventListener('playing', syncPlayback);
      clearInterval(timer);
    };
  }, [song?.url, isPlaying, duration]);

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
            updatePlaybackDOM();
          }
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => skipSeconds(-10));
        navigator.mediaSession.setActionHandler('nexttrack', () => skipSeconds(10));
      } catch (e) {
        console.warn("MediaSession API setup error:", e);
      }
    }

    return () => {
      document.title = "SumanMp3Tag Editor - Online MP3 Tag & Cover Editor";
    };
  }, [song]);

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
        updatePlaybackDOM();
      }).catch(err => {
        console.error("Playback error:", err);
      });
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    const effectiveDur = duration || (audio && isFinite(audio.duration) ? audio.duration : 0);
    if (!audio || !bar || !effectiveDur) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * effectiveDur;

    audio.currentTime = newTime;
    updatePlaybackDOM();
  };

  const skipSeconds = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    const effectiveDur = duration || (audio && isFinite(audio.duration) ? audio.duration : 0);
    audio.currentTime = Math.max(0, Math.min(effectiveDur, audio.currentTime + seconds));
    updatePlaybackDOM();
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

  const handleShare = () => {
    let shareUrl = window.location.href;
    if (song && song.id) {
      const baseUrl = window.location.origin + window.location.pathname;
      shareUrl = `${baseUrl}?play=${encodeURIComponent(song.id)}`;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Go to Mp3Tag Editor
          </button>
        )}
      </div>
    );
  }

  const effectiveDuration = duration || (audioRef.current && isFinite(audioRef.current.duration) ? audioRef.current.duration : 0);
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-2 md:py-6 px-3 relative z-10"
    >
      {ambientEnabled && song?.coverUrl && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-opacity duration-1000">
          <div 
            className="absolute -inset-24 bg-cover bg-center opacity-45 md:opacity-55 blur-[110px] md:blur-[160px] scale-125 transition-all duration-1000 transform-gpu"
            style={{ backgroundImage: `url(${song.coverUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/75 to-slate-950/95" />
        </div>
      )}

      <audio 
        ref={audioRef} 
        src={song.url} 
        loop={isLooping} 
        preload="auto"
        crossOrigin="anonymous"
        onTimeUpdate={updatePlaybackDOM}
        onLoadedMetadata={updatePlaybackDOM}
        onDurationChange={updatePlaybackDOM}
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
      />

      {/* Instructed Position: Real-Time Music Visualizer Box + Ambient Mode Switch */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-20 gap-2 sm:gap-3">
        <div className="flex-1 h-8 sm:h-10 bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/10 px-2.5 sm:px-4 flex items-center justify-between overflow-hidden shadow-lg min-w-0">
          <div className="hidden sm:flex items-center gap-2 mr-3 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
            <span className="text-[11px] font-bold tracking-wider text-purple-200 uppercase">Visualizer</span>
          </div>
          <canvas ref={canvasRef} className="w-full h-6 sm:h-7 cursor-pointer" width={450} height={28} />
        </div>

        <button
          type="button"
          onClick={() => setAmbientEnabled(!ambientEnabled)}
          className={`hidden sm:flex px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-all items-center gap-1.5 cursor-pointer backdrop-blur-md flex-shrink-0 ${
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

      <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-3xl relative overflow-hidden bg-slate-900/80 z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-6 md:gap-10 items-center relative z-10">
          
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/20 group ring-1 ring-white/10">
              {song.coverUrl ? (
                <img 
                  src={song.coverUrl} 
                  alt={song.title || 'Album Art'} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900/50 via-slate-900 to-pink-900/50 flex items-center justify-center">
                  <Music className="w-14 h-14 md:w-20 md:h-20 text-purple-300/40" />
                </div>
              )}

              {isPlaying && (
                <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-semibold text-purple-200 flex items-center gap-1.5 shadow-xl">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping" />
                  Playing
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col justify-between space-y-2.5 sm:space-y-4">
            
            <div className="text-center md:text-left space-y-0.5 sm:space-y-1">
              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md truncate">
                {song.title || song.filename || 'Untitled Track'}
              </h2>
              <p className="text-sm sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-rose-300 truncate">
                {song.artist || 'Unknown Artist'}
              </p>
              {song.album && (
                <p className="text-[11px] sm:text-sm text-white/50 font-medium truncate">
                  {song.album} {song.year ? `• ${song.year}` : ''}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div 
                ref={progressBarRef}
                onClick={handleSeek}
                className="h-2 sm:h-2.5 w-full bg-white/10 hover:bg-white/20 rounded-full cursor-pointer relative overflow-hidden group transition-all backdrop-blur-sm border border-white/5"
              >
                <div 
                  ref={progressFillRef}
                  className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full relative transition-all duration-100 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9)] scale-100 group-hover:scale-125 transition-transform border border-purple-300" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] sm:text-xs text-white/70 font-mono font-bold tracking-wide">
                <span ref={currentTimeTextRef}>{formatTime(currentTime)}</span>
                <span ref={durationTextRef}>{formatTime(effectiveDuration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5 sm:gap-3.5 py-0.5 sm:py-1">
              <button 
                onClick={() => setIsLooping(!isLooping)}
                className={`p-2 sm:p-2.5 rounded-full transition-all ${isLooping ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-md' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                title={isLooping ? "Loop On" : "Loop Off"}
              >
                <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button 
                onClick={() => skipSeconds(-10)}
                className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all active:scale-95"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button 
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
                onClick={() => skipSeconds(10)}
                className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all active:scale-95"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button 
                onClick={toggleMute}
                className={`p-2 sm:p-2.5 rounded-full transition-all ${isMuted ? 'text-red-400 bg-red-500/20 border border-red-500/40' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-md">
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
                onClick={handleDownload}
                className="py-2.5 px-3 sm:py-3 sm:px-5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer relative backdrop-blur-md"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />
                <span>Download Song</span>
              </button>

              <button 
                onClick={handleShare}
                className="py-2.5 px-3 sm:py-3 sm:px-5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer relative backdrop-blur-md"
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

      {/* Mobile View Ambient Mode Button (Instructed Position below player card) */}
      <div className="flex justify-center mt-3 sm:hidden relative z-20">
        <button
          type="button"
          onClick={() => setAmbientEnabled(!ambientEnabled)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-lg ${
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
