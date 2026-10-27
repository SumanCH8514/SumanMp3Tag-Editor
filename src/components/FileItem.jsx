import React from 'react';
import { Music, Video, Edit2, Trash2, CheckCircle2, Disc3 } from 'lucide-react';

const FileItem = ({ file, onEdit, onRemove, status }) => {
  const isVideo = file.type.startsWith('video');
  const sizeMb = (file.size / 1024 / 1024).toFixed(2);
  const ext = file.name.split('.').pop().toUpperCase();

  return (
    <div className="p-4 bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-violet-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 group shadow-lg backdrop-blur-xl">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
          {isVideo ? <Video className="w-5 h-5 text-pink-400" /> : <Disc3 className="w-5 h-5 text-violet-400" />}
        </div>
        
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="font-semibold text-sm text-slate-100 group-hover:text-white transition-colors truncate">
            {file.name}
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-400 font-mono text-[11px]">
              {sizeMb} MB
            </span>
            <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 font-semibold uppercase text-[11px]">
              {ext}
            </span>
            {status && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {status}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
        <button 
          type="button"
          onClick={() => onEdit(file)}
          className="flex-1 sm:flex-none justify-center px-4 py-2.5 sm:py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          title="Edit Metadata & Tag Details"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Tags</span>
        </button>

        <button 
          type="button"
          onClick={() => onRemove(file)}
          className="p-2.5 sm:p-2 rounded-xl bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all active:scale-95 cursor-pointer"
          title="Remove File"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FileItem;
