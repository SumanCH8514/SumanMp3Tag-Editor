import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Music4, Sparkles, ShieldCheck, Tag, Disc3, FolderOpen, Loader2 } from 'lucide-react';

const Dropzone = ({ onFilesAdded }) => {
  const [loadingSample, setLoadingSample] = useState(false);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      onFilesAdded(acceptedFiles);
    }
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3']
    },
    noClick: false,
    multiple: true
  });
  const handleLoadSample = async (e) => {
    e.stopPropagation();
    if (loadingSample) return;
    setLoadingSample(true);
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const samplePath = `${basePath.endsWith('/') ? basePath : basePath + '/'}uploads/mp3/Dil_Luteya_-_Jazzy_B_-_SumanOnline_Com_6a74a8a7dc8d5.mp3`;
      const response = await fetch(samplePath);
      if (!response.ok) throw new Error('Sample not found');
      const blob = await response.blob();
      const sampleFile = new File([blob], 'Dil Luteya - Jazzy B.mp3', { type: 'audio/mpeg' });
      onFilesAdded([sampleFile]);
    } catch (err) {
      console.warn('Sample audio load error:', err);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div 
        {...getRootProps()} 
        className={`relative group cursor-pointer rounded-3xl border transition-all duration-300 overflow-hidden backdrop-blur-2xl ${
          isDragActive 
            ? 'border-violet-400 bg-violet-950/40 shadow-[0_0_60px_rgba(139,92,246,0.35)] scale-[1.01]' 
            : 'border-white/[0.12] hover:border-violet-500/50 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/80 hover:bg-slate-900/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity duration-700 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />

        <div className="relative p-8 sm:p-12 md:p-16 flex flex-col items-center justify-center text-center">
          
          <div className="relative mb-6">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isDragActive 
                ? 'bg-gradient-to-tr from-violet-600 to-pink-500 scale-110 shadow-violet-500/50' 
                : 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 group-hover:border-violet-500/40 group-hover:bg-violet-500/10'
            }`}>
              {isDragActive ? (
                <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce" />
              ) : (
                <div className="relative flex items-center justify-center">
                  <Disc3 className="w-10 h-10 sm:w-12 sm:h-12 text-violet-400 group-hover:text-pink-400 transition-colors duration-300 animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music4 className="w-5 h-5 text-white/90" />
                  </div>
                </div>
              )}
            </div>

            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-violet-600/80 border border-violet-400/40 text-[10px] font-bold tracking-wider uppercase text-white shadow-md">
              MP3
            </div>
          </div>

          <div className="space-y-2 max-w-lg mb-8">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isDragActive ? 'Release to Load Tracks' : 'Drop your MP3 files here'}
            </h3>
            <p className="text-sm sm:text-base text-slate-400 font-normal">
              Drag & drop audio files directly, or browse from your device. Processed locally with 100% privacy.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
            <button
              type="button"
              onClick={open}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-sm shadow-[0_10px_25px_rgba(139,92,246,0.35)] hover:shadow-[0_15px_30px_rgba(139,92,246,0.5)] transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer border border-white/20"
            >
              <FolderOpen className="w-4 h-4 text-violet-200" />
              <span>Browse Files</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-violet-400/40 text-slate-200 hover:text-white font-medium text-sm transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer backdrop-blur-md disabled:opacity-50"
            >
              {loadingSample ? (
                <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>Try Demo Track</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-4 border-t border-white/[0.08] text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Zero Uploads · Local Processing
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <Tag className="w-3.5 h-3.5 text-violet-400" />
              ID3v1 & ID3v2.3 / ID3v2.4
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              HD Covers & Synced Lyrics
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dropzone;
