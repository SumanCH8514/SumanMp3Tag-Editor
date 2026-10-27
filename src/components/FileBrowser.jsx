import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Music, Download, ExternalLink, Calendar, Trash2, Share2, Check, Play, Lock, ShieldAlert, KeyRound, ShieldCheck, ArrowLeft, Eye, EyeOff, AlertCircle, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getValidCoverUrl, getApiUrl } from '../utils/lrclib';
import Pagination from './Pagination';

const ENCRYPTED_PIN_HASH = '6bf76be895daa81eecd02713d3fb73d1f5215d48720a139479234c293e88d26a';

const computeSha256 = async (str) => {
  if (!str) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const FileBrowser = ({ onPlaySong, onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('suman_files_pin_auth') === ENCRYPTED_PIN_HASH;
  });
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState(false);
  const inputRefs = useRef([]);

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
    } else {
      inputRefs.current[0]?.focus();
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

  const handleDigitChange = async (index, val) => {
    const cleanChar = val.replace(/[^0-9]/g, '').slice(-1);
    const nextDigits = [...pinDigits];
    nextDigits[index] = cleanChar;
    setPinDigits(nextDigits);
    setPinError(false);

    if (cleanChar && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (cleanChar && index === 3) {
      const fullPin = nextDigits.join('');
      if (fullPin.length === 4) {
        await verifyAndSubmit(fullPin);
      }
    }
  };

  const handleKeyDown = async (index, e) => {
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        const nextDigits = [...pinDigits];
        nextDigits[index - 1] = '';
        setPinDigits(nextDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const nextDigits = [...pinDigits];
        nextDigits[index] = '';
        setPinDigits(nextDigits);
      }
      setPinError(false);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (!pasteData) return;
    const newDigits = ['', '', '', ''];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setPinDigits(newDigits);
    setPinError(false);

    const targetFocus = Math.min(pasteData.length, 3);
    inputRefs.current[targetFocus]?.focus();

    if (pasteData.length === 4) {
      await verifyAndSubmit(pasteData);
    }
  };

  const handleKeypadPress = async (numStr) => {
    const emptyIndex = pinDigits.findIndex(d => d === '');
    if (emptyIndex !== -1) {
      const nextDigits = [...pinDigits];
      nextDigits[emptyIndex] = numStr;
      setPinDigits(nextDigits);
      setPinError(false);

      if (emptyIndex < 3) {
        inputRefs.current[emptyIndex + 1]?.focus();
      } else {
        const fullPin = nextDigits.join('');
        if (fullPin.length === 4) {
          await verifyAndSubmit(fullPin);
        }
      }
    }
  };

  const handleKeypadBackspace = () => {
    let lastFilledIndex = -1;
    for (let i = 3; i >= 0; i--) {
      if (pinDigits[i] !== '') {
        lastFilledIndex = i;
        break;
      }
    }
    if (lastFilledIndex !== -1) {
      const nextDigits = [...pinDigits];
      nextDigits[lastFilledIndex] = '';
      setPinDigits(nextDigits);
      inputRefs.current[lastFilledIndex]?.focus();
      setPinError(false);
    }
  };

  const handleClearPin = () => {
    setPinDigits(['', '', '', '']);
    setPinError(false);
    inputRefs.current[0]?.focus();
  };

  const verifyAndSubmit = async (codeToVerify) => {
    const pin = codeToVerify || pinDigits.join('');
    if (pin.length !== 4) return;
    setIsVerifying(true);
    const success = await handleVerifyPin(pin);
    setIsVerifying(false);
    if (!success) {
      inputRefs.current[3]?.focus();
    }
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

    const titleText = `🎵 Listen to "${fileItem.title || fileItem.filename}" by ${fileItem.artist || 'Unknown Artist'} on SumanMp3Tag Player`;
    const fullShareMessage = `${titleText}\n${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: fileItem.title || fileItem.filename,
        text: titleText,
        url: shareUrl
      }).catch(() => {});
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullShareMessage);
      setCopiedId(fileItem.id);
      toast.success("Share link copied to clipboard!");
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

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedFiles = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredFiles.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredFiles, safeCurrentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    const enteredCount = pinDigits.filter(Boolean).length;
    return (
      <div className="flex flex-col items-center justify-center py-2 sm:py-4 px-4 min-h-[calc(100vh-140px)]">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm sm:max-w-md relative"
        >
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-purple-600/20 blur-xl opacity-60 pointer-events-none" />

          <div className={`relative rounded-3xl bg-slate-900/90 border ${
            pinError ? 'border-rose-500/50 shadow-[0_0_35px_rgba(244,63,94,0.25)]' : 'border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.6)]'
          } backdrop-blur-2xl p-5 sm:p-7 transition-all`}>
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-300 tracking-wider uppercase">
                  Studio Cloud Vault
                </span>
              </div>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>
              )}
            </div>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-violet-500/20 to-indigo-500/10 border border-violet-500/30 flex items-center justify-center mx-auto mb-3 shadow-inner text-violet-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Protected Audio Vault
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Enter your 4-digit security PIN to access cloud audio files and library storage.
              </p>
            </div>

            <div className="space-y-4">
              <div 
                className="flex items-center justify-center gap-2.5 sm:gap-3.5"
                onPaste={handlePaste}
              >
                {[0, 1, 2, 3].map((index) => {
                  const digit = pinDigits[index];
                  const isFilled = digit !== '';
                  return (
                    <div key={index} className="relative">
                      <input
                        ref={(el) => (inputRefs.current[index] = el)}
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl text-center text-xl sm:text-2xl font-mono font-bold transition-all outline-none cursor-pointer ${
                          pinError
                            ? 'bg-rose-500/10 border-2 border-rose-500/70 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                            : isFilled
                            ? 'bg-violet-500/10 border-2 border-violet-500/60 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                            : 'bg-black/30 border border-white/15 text-white focus:border-violet-400 focus:ring-2 focus:ring-violet-500/25'
                        }`}
                      />
                      {!showPin && isFilled && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-violet-300 shadow-sm" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? 'Mask PIN' : 'Reveal PIN'}</span>
                </button>

                {enteredCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <AnimatePresence>
                {pinError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-medium">Incorrect PIN. Access denied.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="h-9 sm:h-10 rounded-lg sm:rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-violet-600/30 border border-white/[0.07] hover:border-white/15 text-white font-mono text-sm sm:text-base font-semibold transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearPin}
                  className="h-9 sm:h-10 rounded-lg sm:rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-slate-400 hover:text-white text-xs font-medium transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-9 sm:h-10 rounded-lg sm:rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-violet-600/30 border border-white/[0.07] hover:border-white/15 text-white font-mono text-sm sm:text-base font-semibold transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="h-9 sm:h-10 rounded-lg sm:rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-slate-400 hover:text-rose-300 text-xs font-medium transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                  aria-label="Delete last digit"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  disabled={enteredCount !== 4 || isVerifying}
                  onClick={() => verifyAndSubmit()}
                  className={`w-full py-2.5 sm:py-3 px-6 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    enteredCount === 4
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25 active:scale-[0.98]'
                      : 'bg-white/[0.05] text-slate-500 border border-white/[0.06] cursor-not-allowed shadow-none'
                  }`}
                >
                  {isVerifying ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>{isVerifying ? 'Verifying...' : 'Unlock Audio Vault'}</span>
                </button>
              </div>

              <div className="pt-1 text-center">
                <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
                  <span>SHA-256 Zero-Knowledge Verification • Session Locked</span>
                </p>
              </div>
            </div>
          </div>
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
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">Uploaded Files</h2>
          {filteredFiles.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold text-purple-200">
              {filteredFiles.length}
            </span>
          )}
        </div>
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
          paginatedFiles.map((file, index) => (
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

              <div className="w-full md:w-auto flex items-center gap-2 flex-wrap md:flex-nowrap justify-center md:justify-end" onClick={e => e.stopPropagation()}>
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

      <Pagination 
        currentPage={safeCurrentPage}
        totalItems={filteredFiles.length}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />
    </motion.div>
  );
};

export default FileBrowser;
