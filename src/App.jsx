import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dropzone from './components/Dropzone';
import FileItem from './components/FileItem';
import MetadataEditor from './components/MetadataEditor';
import BatchMetadataEditor from './components/BatchMetadataEditor';
import FileBrowser from './components/FileBrowser';
import MusicPlayerPage from './components/MusicPlayerPage';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Layers, Music, Disc3, ShieldCheck, Tag, ArrowRight, Wand2, FileText, CheckCircle2, FolderOpen, Headphones, ChevronRight } from 'lucide-react';

const getBaseUrl = () => {
  let basePath = window.location.pathname;
  if (basePath.toLowerCase().endsWith('/files') || basePath.toLowerCase().endsWith('/files/')) {
    basePath = basePath.replace(/\/files\/?$/i, '/');
  } else if (basePath.toLowerCase().endsWith('/batch') || basePath.toLowerCase().endsWith('/batch/')) {
    basePath = basePath.replace(/\/batch\/?$/i, '/');
  }
  if (!basePath.endsWith('/')) basePath += '/';
  return window.location.origin + basePath;
};

function App() {
  const [view, setView] = useState('home');
  const [previousView, setPreviousView] = useState('files');
  const [files, setFiles] = useState([]);
  const [editingFileId, setEditingFileId] = useState(null);
  const [sharedSongId, setSharedSongId] = useState(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  
  const previousViewRef = useRef('files');

  useEffect(() => {
    previousViewRef.current = previousView;
  }, [previousView]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const syncUrlView = () => {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const playId = params.get('play') || params.get('id') || params.get('song') || (params.get('title') && params.get('url') ? 'query_song' : null);
      
      if (playId) {
        setSharedSongId(playId);
        setView('player');
      } else if (pathname.endsWith('/files') || pathname.endsWith('/files/')) {
        setSharedSongId(null);
        setView('files');
      } else if (pathname.endsWith('/batch') || pathname.endsWith('/batch/')) {
        setSharedSongId(null);
        setView('batch');
      } else {
        setSharedSongId(null);
        setView('home');
      }
    };

    syncUrlView();
    window.addEventListener('popstate', syncUrlView);
    return () => window.removeEventListener('popstate', syncUrlView);
  }, []);

  const handleFilesAdded = useCallback(async (newFiles) => {
    const newFileItems = newFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      status: 'Ready',
      progress: 0
    }));

    setFiles(prev => {
      if (prev.length === 0 && newFileItems.length === 1) {
        setEditingFileId(newFileItems[0].id);
      }
      return [...prev, ...newFileItems];
    });
  }, []);

  const handleEdit = (fileItem) => {
    if (fileItem.status === 'Ready') {
      setEditingFileId(fileItem.id);
    }
  };

  const handleSave = (newFile) => {
    const url = URL.createObjectURL(newFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = newFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFiles(prev => prev.map(f => f.id === editingFileId ? { ...f, file: newFile } : f));
    setEditingFileId(null);
  };

  const handleRemove = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (editingFileId === id) setEditingFileId(null);
  };

  const handleClearAll = () => {
    setFiles([]);
    setEditingFileId(null);
  };

  const handleOpenPlayer = (songId) => {
    if (view !== 'player') {
      setPreviousView(view);
    }
    if (songId && window.history && window.history.pushState) {
      const newUrl = `${getBaseUrl()}?play=${encodeURIComponent(songId)}`;
      window.history.pushState({ play: songId }, '', newUrl);
    }
    setSharedSongId(songId);
    setView('player');
  };

  const handleNavigate = (newView) => {
    if (window.history && window.history.pushState) {
      let targetUrl = getBaseUrl();
      if (newView === 'files') {
        targetUrl += 'Files';
      } else if (newView === 'batch') {
        targetUrl += 'Batch';
      }
      window.history.pushState(null, '', targetUrl);
    }
    setView(newView);
  };

  const editingItem = files.find(f => f.id === editingFileId);

  return (
    <Layout currentView={view} onNavigate={handleNavigate}>
      <Toaster 
        position={isMobile ? 'top-center' : 'top-right'}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(16px)',
            padding: '10px 14px',
            maxWidth: 'none',
            whiteSpace: 'nowrap'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#0f172a'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0f172a'
            }
          }
        }}
      />
      <div className={`space-y-3 ${editingItem ? 'flex-1 flex flex-col' : ''}`}>
        {view === 'player' ? (
          <MusicPlayerPage 
            songId={sharedSongId}
            onBack={() => {
              const targetView = previousView || 'files';
              const newUrl = targetView === 'files' 
                ? getBaseUrl() + 'Files' 
                : (targetView === 'batch' ? getBaseUrl() + 'Batch' : getBaseUrl());
              if (window.history && window.history.pushState) {
                window.history.pushState(null, '', newUrl);
              }
              setSharedSongId(null);
              setView(targetView);
            }}
          />
        ) : view === 'home' ? (
          <>
            {!editingItem && files.length === 0 && (
              <section className="text-center space-y-4 pt-4 pb-8 max-w-4xl mx-auto">
                <motion.h2 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight"
                >
                  SumanMp3Tag
                </motion.h2>

                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
                >
                  Inspect, edit, and organize ID3 metadata, fetch HD album art from Apple iTunes, synchronize LRC lyrics, and apply studio watermarks — all directly in your browser.
                </motion.p>
              </section>
            )}

            {!editingItem && files.length > 0 && (
              <div className="max-w-5xl mx-auto flex items-center justify-between pb-2 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-400 min-w-0">
                  <span className="hidden sm:inline font-semibold text-white">Audio Workspace</span>
                  <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-600" />
                  <span className="font-semibold text-white sm:font-normal sm:text-slate-400 truncate">Queued Tracks</span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono text-[11px] font-bold flex-shrink-0">
                    {files.length}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleNavigate('batch')}
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Layers className="w-3.5 h-3.5 text-violet-400" />
                    <span><span className="hidden sm:inline">Open in </span>Batch Editor</span>
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {editingItem ? (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col w-full"
                >
                  <MetadataEditor 
                    file={editingItem.file} 
                    onSave={handleSave} 
                    onCancel={() => setEditingFileId(null)} 
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-12"
                >
                  {files.length === 0 ? (
                    <>
                      <Dropzone onFilesAdded={handleFilesAdded} />

                      <section className="pt-4 max-w-5xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 text-center sm:text-left gap-2 sm:gap-0">
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                              Studio Capabilities
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-400">
                              Everything you need for clean, professional audio management
                            </p>
                          </div>
                          
                          <div className="hidden sm:flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleNavigate('batch')}
                              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5 text-violet-400" />
                              <span>Open Batch Editor</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNavigate('files')}
                              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Music className="w-3.5 h-3.5 text-pink-400" />
                              <span>View Library</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="glass-panel p-5 space-y-3 group hover:border-violet-500/40 transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                              <Wand2 className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-bold text-white">Apple Auto-Match</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Instantly retrieve official track title, artist, album, genre, and release year via Apple iTunes API.
                            </p>
                          </div>

                          <div className="glass-panel p-5 space-y-3 group hover:border-pink-500/40 transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                              <Disc3 className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-bold text-white">HD Artwork & Watermark</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Embed crystal-clear 600×600 album artwork or apply customizable canvas text watermarks with live preview.
                            </p>
                          </div>

                          <div className="glass-panel p-5 space-y-3 group hover:border-purple-500/40 transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                              <FileText className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-bold text-white">Synced LRC Lyrics</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Search multiple lyrics engines (LRCLIB, Lyrics.ovh) with real-time synchronized playback highlighting.
                            </p>
                          </div>

                          <div className="glass-panel p-5 space-y-3 group hover:border-emerald-500/40 transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                              <Layers className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-bold text-white">Batch Album Editor</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Process multiple songs or complete discographies at once with auto-sequenced numbering and unified tags.
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">100% In-Browser Privacy</p>
                              <p className="text-[11px] text-slate-400">Your audio files never leave your device. All ID3 tags are written locally using WebAssembly & ArrayBuffers.</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 flex-wrap">
                            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono">ID3v2.3</span>
                            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono">ID3v2.4</span>
                            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono">LRC</span>
                          </div>
                        </div>
                      </section>
                    </>
                  ) : (
                    <div className="glass-panel p-3.5 sm:p-5 md:p-6 overflow-hidden max-w-5xl mx-auto">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5 pb-3.5 sm:pb-4 border-b border-white/[0.08]">
                        <div className="flex items-center justify-between sm:justify-start gap-3">
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 whitespace-nowrap">
                            <span>Ready to Edit</span>
                            <span className="text-xs font-normal text-slate-400">({files.length} {files.length === 1 ? 'file' : 'files'})</span>
                          </h3>

                          <button
                            type="button"
                            onClick={handleClearAll}
                            className="sm:hidden px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-[11px] font-medium text-slate-400 hover:text-red-300 transition-all cursor-pointer whitespace-nowrap"
                          >
                            Clear All
                          </button>
                        </div>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={handleClearAll}
                            className="hidden sm:block px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-xs font-medium text-slate-400 hover:text-red-300 transition-all cursor-pointer whitespace-nowrap"
                          >
                            Clear All
                          </button>

                          <label className="cursor-pointer flex-1 sm:flex-none justify-center px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap">
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Add More Files</span>
                            <input 
                              type="file" 
                              multiple 
                              accept=".mp3,audio/mpeg" 
                              className="hidden" 
                              onChange={(e) => {
                                if (e.target.files?.length) {
                                  handleFilesAdded(Array.from(e.target.files));
                                }
                                e.target.value = null;
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 min-w-0 w-full">
                        {files.map((item) => (
                          <div key={item.id} className="w-full min-w-0">
                            <FileItem 
                              file={item.file}
                              status={item.status}
                              onEdit={() => handleEdit(item)}
                              onRemove={() => handleRemove(item.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : view === 'batch' ? (
          <BatchMetadataEditor />
        ) : (
          <FileBrowser onPlaySong={handleOpenPlayer} onBack={() => handleNavigate('home')} />
        )}
      </div>
    </Layout>
  );
}

export default App;
