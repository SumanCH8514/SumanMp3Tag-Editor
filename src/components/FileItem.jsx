import React from 'react';
import { Music, Video, Edit2, Trash2, CheckCircle, Sparkles } from 'lucide-react';

const FileItem = ({ file, onEdit, onRemove, status }) => {
  const isVideo = file.type.startsWith('video');
  const sizeMb = (file.size / 1024 / 1024).toFixed(2);
  const ext = file.name.split('.').pop().toUpperCase();

  return (
    <div className="p-4 bg-slate-900/40 hover:bg-slate-900/70 border border-white/10 hover:border-purple-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 group shadow-lg backdrop-blur-xl">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
          {isVideo ? <Video className="w-6 h-6 text-pink-400" /> : <Music className="w-6 h-6 text-purple-400" />}
        </div>
        
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="font-semibold text-sm md:text-base text-white/90 group-hover:text-purple-200 transition-colors truncate">
            {file.name}
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/70 font-mono">
              {sizeMb} MB
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold uppercase">
              {ext}
            </span>
            {status && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Action Buttons on Right Side */}
      <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-auto">
        <button 
          type="button"
          onClick={() => onEdit(file)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs md:text-sm font-semibold shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          title="Edit Metadata & Tag Details"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Tags</span>
        </button>

        <button 
          type="button"
          onClick={() => onRemove(file)}
          className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-white/50 hover:text-red-300 transition-all active:scale-95 cursor-pointer"
          title="Remove File"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FileItem;
