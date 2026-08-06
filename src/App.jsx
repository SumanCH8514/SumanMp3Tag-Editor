import React, { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dropzone from './components/Dropzone';
import FileItem from './components/FileItem';
import MetadataEditor from './components/MetadataEditor';
import BatchMetadataEditor from './components/BatchMetadataEditor';
import FileBrowser from './components/FileBrowser';
import MusicPlayerPage from './components/MusicPlayerPage';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  const previousViewRef = useRef('files');

  useEffect(() => {
    previousViewRef.current = previousView;
  }, [previousView]);

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

    setFiles(prev => [...prev, ...newFileItems]);
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
      <div className="space-y-8">
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
            {!editingItem && (
              <section className="text-center space-y-4 py-8">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-white to-pink-200"
                >
                  SumanMp3Tag Editor
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-white/60 max-w-2xl mx-auto"
                >
                  Edit tags, change cover art, and add watermarks.
                  <br/>All secure, client-side processing.
                </motion.p>
              </section>
            )}

            <AnimatePresence mode="wait">
              {editingItem ? (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  {files.length === 0 ? (
                    <Dropzone onFilesAdded={handleFilesAdded} />
                  ) : (
                    <div className="glass-panel p-4 md:p-6 overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          Files ({files.length})
                        </h3>
                        <label className="cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors">
                          Add Files
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
                      <div className="flex flex-col gap-4 min-w-0 w-full">
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
          <FileBrowser onPlaySong={handleOpenPlayer} />
        )}
      </div>
    </Layout>
  );
}

export default App;
