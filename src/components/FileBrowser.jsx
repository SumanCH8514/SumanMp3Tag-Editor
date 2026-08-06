import React, { useState, useEffect } from 'react';
import { Search, Music, Download, ExternalLink, Calendar, Trash2, Share2, Check, Play, Lock, ShieldAlert, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { getValidCoverUrl, getApiUrl } from '../utils/lrclib';

const ENCRYPTED_PIN_HASH = '6bf76be895daa81eecd02713d3fb73d1f5215d48720a139479234c293e88d26a';

const computeSha256 = async (str) => {
  if (!str) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const FileBrowser = ({ onPlaySong }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('suman_files_pin_auth') === ENCRYPTED_PIN_HASH;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated]);

  const handleVerifyPin = async (inputPin) => {
    if (!inputPin || inputPin.length !== 4) return false;
    const computedHash = await computeSha256(inputPin);
    if (computedHash === ENCRYPTED_PIN_HASH) {
      sessionStorage.setItem('suman_files_pin_auth', ENCRYPTED_PIN_HASH);
      setIsAuthenticated(true);
      setPinError(false);
      return true;
    } else {
      setPinError(true);
      return false;
    }
  };

  const handlePinSubmit = async (e) => {
    if (e) e.preventDefault();
    await handleVerifyPin(pinInput);
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(getApiUrl('list_files.php'));
      const data = await response.json();
      if (data.files) {
        const formatted = data.files.map(f => ({
          ...f,
          url: getValidCoverUrl(f.url),
          coverUrl: getValidCoverUrl(f.coverUrl)
        }));
        setFiles(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch files", err);
      setError("Failed to load files. Make sure you are hosting this on a PHP server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    await performDelete(id);
  };

  const performDelete = async (id) => {
    setDeletingId(id);
    try {
      const response = await fetch(getApiUrl('delete_file.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (data.success) {
        setFiles(prev => prev.filter(f => f.id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return true;
      } else {
        console.error('Failed to delete:', data.error);
        return false;
      }
    } catch (err) {
      console.error("Delete failed", err);
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} files?`)) return;
    
    const idsToDelete = Array.from(selectedIds);
    setDeletingId('bulk');
    
    let successCount = 0;
    
    await Promise.all(idsToDelete.map(async (id) => {
        const success = await performDelete(id);
        if (success) successCount++;
    }));
    
    setDeletingId(null);
    if (successCount < idsToDelete.length) {
        alert(`Deleted ${successCount} files. Some files failed to delete.`);
    }
  };

  const handleBulkDownload = () => {
    const filesToDownload = files.filter(f => selectedIds.has(f.id));
    filesToDownload.forEach((file, index) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = file.url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 500);
    });
  };

  const handleShareFile = (fileItem, e) => {
    if (e) e.stopPropagation();
    
    const baseUrl = window.location.origin + window.location.pathname;
    let shareUrl = `${baseUrl}?play=${encodeURIComponent(fileItem.id || fileItem.filename)}`;

    if (!fileItem.id && fileItem.url) {
      const params = new URLSearchParams();
      params.set('title', fileItem.title || fileItem.filename);
      params.set('url', fileItem.url);
      if (fileItem.artist) params.set('artist', fileItem.artist);
      if (fileItem.album) params.set('album', fileItem.album);
      if (fileItem.coverUrl) params.set('cover', fileItem.coverUrl);
      shareUrl = `${baseUrl}?${params.toString()}`;
    }

    if (navigator.share) {
      navigator.share({
        title: fileItem.title || fileItem.filename,
        text: `Listen to ${fileItem.title || fileItem.filename} on SumanMp3Tag Editor!`,
        url: shareUrl
      }).catch(() => {});
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedId(fileItem.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const filteredFiles = files.filter(file => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (file.title && file.title.toLowerCase().includes(searchLower)) ||
      (file.album && file.album.toLowerCase().includes(searchLower)) ||
      (file.artist && file.artist.toLowerCase().includes(searchLower)) ||
      (file.filename && file.filename.toLowerCase().includes(searchLower))
    );
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 min-h-[50vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border ${
            pinError ? 'border-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.35)]' : 'border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.7)]'
          } backdrop-blur-3xl text-center relative overflow-hidden transition-all duration-300`}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/30 border border-white/20">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            Protected Access
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mb-6 font-medium">
            Enter security PIN to access Uploaded Files.
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-5">
            <div className="relative">
              <input 
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={async (e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPinInput(val);
                  setPinError(false);
                  if (val.length === 4) {
                    await handleVerifyPin(val);
                  }
                }}
                placeholder="• • • •"
                className="w-full text-center text-3xl font-mono tracking-[0.6em] py-3.5 px-4 bg-white/5 border border-white/15 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner"
                autoFocus
              />
            </div>

            {pinError && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-bold text-red-400 flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                Invalid PIN. Access Unauthorized.
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Unlock Access</span>
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Uploaded Files</h2>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input 
            type="text" 
            placeholder="Search by Title, Album or Artist..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={selectedIds.size === filteredFiles.length && filteredFiles.length > 0}
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded border-white/20 bg-black/20 text-purple-600 focus:ring-purple-500/50"
            />
            <span className="text-sm font-medium text-purple-200">
              {selectedIds.size} Selected
            </span>
          </div>
          <div className="flex items-center gap-2">
             <button
              onClick={handleBulkDownload}
              className="px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Download Selected"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Download</span>
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deletingId === 'bulk'}
              className="px-3 md:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Delete Selected"
            >
              {deletingId === 'bulk' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span className="hidden md:inline">Delete</span>
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {filteredFiles.length === 0 && !loading && !error ? (
          <div className="text-center py-12 text-white/40">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No files found.</p>
          </div>
        ) : (
          filteredFiles.map((file, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleSelect(file.id)}
              className={`glass-panel p-4 flex flex-col md:flex-row items-center md:items-center gap-4 group transition-colors cursor-pointer relative ${selectedIds.has(file.id) ? 'bg-purple-500/10 border-purple-500/30' : 'hover:bg-white/5'}`}
            >
              <div 
                className="absolute top-3 left-3 md:static flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
              >
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(file.id)}
                  onChange={() => {}}
                  className="w-5 h-5 rounded border-white/20 bg-black/20 text-purple-600 focus:ring-purple-500/50 cursor-pointer"
                />
              </div>

              <div 
                className="w-16 h-16 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden relative group/cover cursor-pointer"
                onClick={(e) => {
                  if (onPlaySong) {
                    e.stopPropagation();
                    onPlaySong(file.id);
                  }
                }}
                title="Click to play song"
              >
                {file.coverUrl ? (
                  <img src={file.coverUrl} alt={file.title} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-8 h-8 md:w-6 md:h-6 text-purple-300" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0 space-y-1 text-center md:text-left w-full md:w-auto">
                <h3 
                  className="font-semibold text-white truncate hover:text-purple-300 transition-colors"
                  onClick={(e) => {
                    if (onPlaySong) {
                      e.stopPropagation();
                      onPlaySong(file.id);
                    }
                  }}
                >
                  {file.title || file.filename}
                </h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-sm text-white/50">
                  {file.artist && (
                    <span className="flex items-center gap-1">
                      <span className="hidden md:block w-1 h-1 rounded-full bg-white/30" />
                      Artist: {file.artist}
                    </span>
                  )}
                  {file.album && (
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      Album: {file.album}
                    </span>
                  )}
                  {file.uploadDate && (
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <Calendar className="w-3 h-3" />
                      {new Date(file.uploadDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full md:w-auto flex items-center gap-2 flex-wrap md:flex-nowrap justify-end" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => handleShareFile(file, e)}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs md:text-sm font-semibold shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-purple-400/30 cursor-pointer"
                  title="Share Music Link & Player"
                >
                  {copiedId === file.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-pink-200" />
                      <span>Share</span>
                    </>
                  )}
                </button>

                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Get Link
                </a>
                
                <button
                  onClick={() => handleDelete(file.id, file.title || file.filename)}
                  disabled={deletingId === file.id}
                  className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                  title="Delete File"
                >
                  {deletingId === file.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default FileBrowser;
