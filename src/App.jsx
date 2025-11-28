import React, { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Dropzone from './components/Dropzone';
import FileItem from './components/FileItem';
import MetadataEditor from './components/MetadataEditor';
import { convertToMp3 } from './utils/ffmpeg';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';

function App() {
  const [files, setFiles] = useState([]);
  const [editingFileId, setEditingFileId] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleFilesAdded = useCallback(async (newFiles) => {
    const newFileItems = newFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      status: f.type === 'audio/mpeg' || f.name.endsWith('.mp3') ? 'Ready' : 'Pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFileItems]);

    // Process non-MP3 files
    for (const item of newFileItems) {
      if (item.status === 'Pending') {
        processFile(item);
      }
    }
  }, []);

  const processFile = async (item) => {
    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'Converting...' } : f));
    
    try {
      const mp3Blob = await convertToMp3(item.file, (progress) => {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: Math.round(progress * 100) } : f));
      });
      
      const mp3File = new File([mp3Blob], item.file.name.replace(/\.[^/.]+$/, "") + ".mp3", { type: 'audio/mpeg' });
      
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, file: mp3File, status: 'Ready', progress: 100 } : f));
    } catch (error) {
      console.error("Conversion failed", error);
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'Error' } : f));
    }
  };

  const handleEdit = (fileItem) => {
    if (fileItem.status === 'Ready') {
      setEditingFileId(fileItem.id);
    }
  };

  const handleSave = (newFile) => {
    // Trigger download
    const url = URL.createObjectURL(newFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = newFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update list
    setFiles(prev => prev.map(f => f.id === editingFileId ? { ...f, file: newFile } : f));
    setEditingFileId(null);
  };

  const handleRemove = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (editingFileId === id) setEditingFileId(null);
  };

  const editingItem = files.find(f => f.id === editingFileId);

  return (
    <Layout>
      <div className="space-y-8">
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
            Edit tags, change cover art, add watermarks, and convert video to audio. 
            <br/>All secure, client-side processing.
          </motion.p>
        </section>

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
              <Dropzone onFilesAdded={handleFilesAdded} />

              {files.length > 0 && (
                <div className="glass-panel p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    Files ({files.length})
                    {files.some(f => f.status === 'Converting...') && (
                      <span className="text-sm font-normal text-purple-300 animate-pulse">
                        Processing...
                      </span>
                    )}
                  </h3>
                  <div className="grid gap-4">
                    {files.map((item) => (
                      <FileItem 
                        key={item.id} 
                        file={item.file}
                        status={item.status === 'Converting...' ? `Converting ${item.progress}%` : item.status}
                        onEdit={() => handleEdit(item)}
                        onRemove={() => handleRemove(item.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

export default App;
