import React, { useState } from 'react';
import { Music, Github, Menu, X, Globe, Music2, Film, Layers, Sparkles, Headphones, Disc3, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children, onNavigate, currentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const isPlayerView = currentView === 'player';

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      <header className={`${isPlayerView ? 'py-2 px-3 md:py-2.5 md:px-6' : 'py-2.5 px-4 md:px-6'} border-b border-white/[0.08] bg-slate-950/70 backdrop-blur-2xl sticky top-0 z-50 transition-all`}>
        <div className={`max-w-7xl mx-auto flex items-center ${isPlayerView ? 'justify-center text-center' : 'justify-between'}`}>
          <div 
            className="flex items-center gap-3 cursor-pointer z-50 relative group" 
            onClick={() => {
              if (onNavigate) onNavigate('home');
              closeMenu();
            }}
          >
            <div className="relative p-2.5 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all">
              <Disc3 className="w-5 h-5 text-white animate-[spin_12s_linear_infinite]" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight leading-tight">
                  SumanMp3Tag
                </h1>
                {isPlayerView ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white shadow-md shadow-pink-500/20 border border-white/20 tracking-wider flex items-center gap-1 uppercase">
                    <Headphones className="w-3 h-3 text-pink-200 animate-pulse" />
                    Player
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/10 text-violet-300 border border-violet-500/20 tracking-wider uppercase hidden sm:inline-block">
                    Studio
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide -mt-0.5">
                a SumanOnline Project
              </span>
            </div>
          </div>
          
          {!isPlayerView && (
            <>
              <div className="hidden md:flex items-center gap-2 lg:gap-3">

                <button 
                  onClick={() => onNavigate && onNavigate('home')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentView === 'home'
                      ? 'bg-white/[0.12] text-white shadow-sm border border-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>

                <button 
                  onClick={() => onNavigate && onNavigate('batch')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentView === 'batch'
                      ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold shadow-lg shadow-violet-500/25 border border-violet-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 ${currentView === 'batch' ? 'text-white' : 'text-violet-400'}`} />
                  <span>Batch Editor</span>
                </button>

                <button 
                  onClick={() => onNavigate && onNavigate('files')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentView === 'files'
                      ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold shadow-lg shadow-violet-500/25 border border-violet-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Music2 className={`w-3.5 h-3.5 ${currentView === 'files' ? 'text-white' : 'text-pink-400'}`} />
                  <span>View Files</span>
                </button>

                <div className="w-[1px] h-5 bg-white/10 mx-1" />

                <a 
                  href="https://github.com/SumanCH8514" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                  title="View on GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>

              <div className="md:hidden z-50 relative">
                <button 
                  onClick={toggleMenu}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-slate-300"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      
      {!isPlayerView && (
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeMenu}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[90] md:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-80 bg-slate-950 border-l border-white/[0.08] shadow-2xl z-[100] md:hidden flex flex-col"
              >
                <div className="py-6 px-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                  <div 
                    className="flex items-center gap-3 cursor-pointer" 
                    onClick={() => {
                      if (onNavigate) onNavigate('home');
                      closeMenu();
                    }}
                  >
                    <div className="p-2 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl shadow-lg shadow-violet-500/20">
                      <Disc3 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                      <h1 className="text-xl font-bold text-white">
                        SumanMp3Tag
                      </h1>
                      <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                        a SumanOnline Project
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={closeMenu}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="p-6 space-y-3">
                  <button 
                    onClick={() => {
                      if (onNavigate) onNavigate('home');
                      closeMenu();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all cursor-pointer ${
                      currentView === 'home'
                        ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold shadow-md'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300'
                    }`}
                  >
                    <Music className="w-5 h-5 text-violet-400" />
                    <span>Single Track Editor</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (onNavigate) onNavigate('batch');
                      closeMenu();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all cursor-pointer ${
                      currentView === 'batch'
                        ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold shadow-md'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300'
                    }`}
                  >
                    <Layers className="w-5 h-5 text-purple-400" />
                    <span>Batch Album Editor</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (onNavigate) onNavigate('files');
                      closeMenu();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all cursor-pointer ${
                      currentView === 'files'
                        ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold shadow-md'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300'
                    }`}
                  >
                    <Music2 className="w-5 h-5 text-pink-400" />
                    <span>Uploaded Library</span>
                  </button>
                  
                  <a 
                    href="https://github.com/SumanCH8514" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-left font-medium transition-colors text-slate-300"
                    onClick={closeMenu}
                  >
                    <Github className="w-5 h-5 text-slate-400" />
                    <span>GitHub Repository</span>
                  </a>

                  <div className="pt-4 border-t border-white/[0.08] space-y-2">
                    <p className="px-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ecosystem</p>
                    <a 
                      href="https://sumanonline.com/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-400 hover:text-white transition-colors"
                      onClick={closeMenu}
                    >
                      <Globe className="w-4 h-4 text-violet-400" />
                      <span>SumanOnline.com</span>
                    </a>
                    <a 
                      href="https://songs.sumanonline.com/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-400 hover:text-white transition-colors"
                      onClick={closeMenu}
                    >
                      <Music2 className="w-4 h-4 text-pink-400" />
                      <span>Stream Songs</span>
                    </a>
                    <a 
                      href="https://movies.sumanonline.com/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-400 hover:text-white transition-colors"
                      onClick={closeMenu}
                    >
                      <Film className="w-4 h-4 text-rose-400" />
                      <span>Stream Movies</span>
                    </a>
                  </div>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      <main className={`flex-1 max-w-7xl mx-auto w-full flex flex-col ${isPlayerView ? 'p-2 sm:p-3' : 'px-3 py-2 sm:px-6 sm:py-2.5'}`}>
        {children}
      </main>

      <footer className={`${isPlayerView ? 'py-1.5 text-[11px]' : 'py-2.5 text-xs'} border-t border-white/[0.08] bg-slate-950/80 backdrop-blur-xl text-center text-slate-400 relative z-20 flex flex-col items-center justify-center gap-1 px-3`}>
        <div className="hidden sm:flex items-center justify-center gap-1.5 text-[10.5px] sm:text-[11px] text-slate-500 text-center flex-wrap">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>Lossless In-Browser Tagging · 100% Privacy Preserved · Zero Server Data Storage</span>
        </div>
        <div className="text-center flex flex-col sm:flex-row items-center justify-center sm:gap-1.5 text-slate-400 leading-relaxed">
          <span>
            © {new Date().getFullYear()} <a href="https://sumanonline.likesyou.org/SumanMp3Tag/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-medium">SumanMp3Tag</a> | All Rights Reserved
          </span>
          <span className="hidden sm:inline">·</span>
          <span>
            Powered by <a href="https://sumanonline.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-medium">SumanOnline.com</a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
