import React, { useState, useEffect } from 'react';
import { Search, Music, Download, ExternalLink, Calendar, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const FileBrowser = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('list_files.php');
      const data = await response.json();
      if (data.files) {
        setFiles(data.files);
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
      const response = await fetch('delete_file.php', {
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
    
    // Convert to array to process
    const idsToDelete = Array.from(selectedIds);
    setDeletingId('bulk'); // show loading state
    
    let successCount = 0;
    
    // Process serially or parallel - parallel for speed
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
      // Stagger downloads slightly to avoid browser blocking
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
                  onChange={() => {}} // Handled by div click
                  className="w-5 h-5 rounded border-white/20 bg-black/20 text-purple-600 focus:ring-purple-500/50 cursor-pointer"
                />
              </div>

              <div className="w-16 h-16 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {file.coverUrl ? (
                  <img src={file.coverUrl} alt={file.title} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-8 h-8 md:w-6 md:h-6 text-purple-300" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 space-y-1 text-center md:text-left w-full md:w-auto">
                <h3 className="font-semibold text-white truncate">{file.title || file.filename}</h3>
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

              <div className="w-full md:w-auto flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Get Link
                </a>
                
                <button
                  onClick={() => handleDelete(file.id, file.title || file.filename)}
                  disabled={deletingId === file.id}
                  className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
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
