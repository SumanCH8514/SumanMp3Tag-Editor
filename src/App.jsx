import React, { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Dropzone from './components/Dropzone';
import FileItem from './components/FileItem';
import MetadataEditor from './components/MetadataEditor';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [files, setFiles] = useState([]);
  const [editingFileId, setEditingFileId] = useState(null);

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
            Edit tags, change cover art, and add watermarks.
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
                  </h3>
                  <div className="grid gap-4">
                    {files.map((item) => (
                      <FileItem 
                        key={item.id} 
                        file={item.file}
                        status={item.status}
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
