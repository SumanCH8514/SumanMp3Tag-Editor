import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, FileAudio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dropzone = ({ onFilesAdded }) => {
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      onFilesAdded(acceptedFiles);
    }
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg'],
      'video/*': ['.mp4', '.mkv', '.mov', '.flv']
    },
    multiple: true
  });

  return (
    <div 
      {...getRootProps()} 
      className={`relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden
        ${isDragActive 
          ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' 
          : 'border-white/20 hover:border-purple-400/50 hover:bg-white/5'
        }
      `}
    >
      <input {...getInputProps()} />
      
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative py-16 px-6 flex flex-col items-center justify-center text-center gap-4">
        <div className={`p-4 rounded-full bg-white/5 mb-2 transition-transform duration-300 ${isDragActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          {isDragActive ? (
            <Upload className="w-10 h-10 text-purple-400 animate-bounce" />
          ) : (
            <FileAudio className="w-10 h-10 text-white/60 group-hover:text-purple-400 transition-colors" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white group-hover:text-purple-200 transition-colors">
            {isDragActive ? 'Drop files here' : 'Drag & drop your files here'}
          </h3>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Support for MP3, WAV, M4A, MP4, MKV and more. 
            <br />
            <span className="text-purple-400/80">Non-MP3 files will be automatically converted.</span>
          </p>
        </div>

        <button className="mt-4 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 transition-all active:scale-95">
          Browse Files
        </button>
      </div>
    </div>
  );
};

export default Dropzone;
