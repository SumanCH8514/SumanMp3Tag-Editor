import React from 'react';
import { Music, Video, Edit2, Trash2, CheckCircle, Loader2, XCircle } from 'lucide-react';

const FileItem = ({ file, onEdit, onRemove, status }) => {
  const isVideo = file.type.startsWith('video');

  return (
    <div className="p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-3 md:gap-4 transition-colors group w-full max-w-full">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-300">
        {isVideo ? <Video className="w-6 h-6" /> : <Music className="w-6 h-6" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate text-white/90">{file.name}</h4>
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          <span>•</span>
          <span className="uppercase">{file.name.split('.').pop()}</span>
          {status && (
            <>
              <span>•</span>
              <span className="text-purple-400 hidden md:inline">{status}</span>
              <span className="text-purple-400 md:hidden block">
                {status === 'Ready' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              </span>
            </>
          )}
          
          <div className="flex items-center gap-1 ml-2">
            <button 
              onClick={() => onEdit(file)}
              className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
              title="Edit Metadata"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button 
              onClick={() => onRemove(file)}
              className="p-1 hover:bg-red-500/20 rounded text-white/70 hover:text-red-400 transition-colors"
              title="Remove File"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileItem;
