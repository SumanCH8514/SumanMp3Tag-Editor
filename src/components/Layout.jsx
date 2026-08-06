import React, { useState } from 'react';
import { Music, Github, Menu, X, Globe, Music2, Film, Layers, Sparkles, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children, onNavigate, currentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const isPlayerView = currentView === 'player';

  return (
    <div className="min-h-screen flex flex-col text-white">
      <header className={`${isPlayerView ? 'py-3 px-3 md:py-5 md:px-8' : 'py-5 px-4 md:px-8'} border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50`}>
        <div className={`max-w-7xl mx-auto flex items-center ${isPlayerView ? 'justify-center text-center' : 'justify-between'}`}>
          <div 
            className="flex items-center gap-3 cursor-pointer z-50 relative" 
            onClick={() => {
              if (onNavigate) onNavigate('home');
              closeMenu();
            }}
          >
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/20">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-white leading-tight">
                  SumanMp3Tag
                </h1>
                {isPlayerView ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white shadow-md shadow-pink-500/20 border border-white/20 tracking-wider flex items-center gap-1 uppercase">
                    <Headphones className="w-3 h-3 text-pink-200 animate-pulse" />
                    Player
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-white/50 hidden sm:inline">Editor</span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs text-white/50 font-medium tracking-wide -mt-0.5">
                a SumanOnline Project
              </span>
            </div>
          </div>
          
          {!isPlayerView && (
            <>
              <div className="hidden md:flex items-center gap-4">
                <button 
                  onClick={() => onNavigate && onNavigate('batch')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    currentView === 'batch'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 border border-purple-400/30 ring-2 ring-purple-500/20'
                      : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                  }`}
                >
                  <Layers className={`w-4 h-4 ${currentView === 'batch' ? 'text-white' : 'text-purple-300'}`} />
                  <span>Batch Editor</span>
                </button>

                <button 
                  onClick={() => onNavigate && onNavigate('files')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    currentView === 'files'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 border border-purple-400/30 ring-2 ring-purple-500/20'
                      : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                  }`}
                >
                  <Music className={`w-4 h-4 ${currentView === 'files' ? 'text-white' : 'text-purple-300'}`} />
                  <span>View Files</span>
                </button>

                <a 
                  href="https://github.com/SumanCH8514" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="View on GitHub"
                >
                  <Github className="w-6 h-6 text-white/70 hover:text-white" />
                </a>
              </div>

              <div className="md:hidden z-50 relative">
                <button 
                  onClick={toggleMenu}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <Menu className="w-6 h-6 text-white" />
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-80 bg-slate-900 border-l border-white/10 shadow-2xl z-[100] md:hidden flex flex-col"
              >
                <div className="py-6 px-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                  <div 
                    className="flex items-center gap-3 cursor-pointer" 
                    onClick={() => {
                      if (onNavigate) onNavigate('home');
                      closeMenu();
                    }}
                  >
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/20">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                      <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        SumanMp3Tag
                      </h1>
                      <span className="text-[10px] text-white/50 font-medium tracking-wide">
                        a SumanOnline Project
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={closeMenu}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                <nav className="p-6 space-y-4">
                  <button 
                    onClick={() => {
                      if (onNavigate) onNavigate('batch');
                      closeMenu();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all cursor-pointer ${
                      currentView === 'batch'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-md border border-purple-400/30'
                        : 'bg-white/5 hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <Layers className="w-5 h-5 text-blue-400" />
                    <span>Batch Editor</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (onNavigate) onNavigate('files');
                      closeMenu();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all cursor-pointer ${
                      currentView === 'files'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-md border border-purple-400/30'
                        : 'bg-white/5 hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <Music className="w-5 h-5 text-purple-400" />
                    <span>View Files</span>
                  </button>
                  
                  <a 
                    href="https://github.com/SumanCH8514" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-medium transition-colors"
                    onClick={closeMenu}
                  >
                    <Github className="w-5 h-5 text-white/70" />
                    GitHub
                  </a>

                  <div className="pt-4 border-t border-white/10 space-y-4">
                    <p className="px-4 text-xs font-semibold text-white/30 uppercase tracking-wider">Services</p>
                    <a 
                      href="https://sumanonline.com/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-medium transition-colors"
                      onClick={closeMenu}
                    >
                      <Globe className="w-5 h-5 text-blue-400" />
                      SumanOnline
                    </a>
                    <a 
                      href="https://songs.sumanonline.com/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-medium transition-colors"
                      onClick={closeMenu}
                    >
                      <Music2 className="w-5 h-5 text-pink-400" />
                      Stream Songs
                    </a>
                    <a 
                      href="https://movies.sumanonline.com/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-medium transition-colors"
                      onClick={closeMenu}
                    >
                      <Film className="w-5 h-5 text-red-400" />
                      Stream Movies
                    </a>
                  </div>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      <main className={`flex-1 max-w-7xl mx-auto w-full ${isPlayerView ? 'p-2 sm:p-4 md:p-8' : 'p-4 md:p-8'}`}>
        {children}
      </main>

      <footer className={`${isPlayerView ? 'py-3 sm:py-4 md:py-6 text-xs md:text-sm' : 'py-6 text-sm'} border-t border-white/10 bg-black/40 backdrop-blur-md text-center text-white/60 relative z-20 flex flex-col items-center justify-center`}>
        <p className="text-center">
          © {new Date().getFullYear()} <a href="https://sumanonline.likesyou.org/SumanMp3Tag/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-medium">SumanMp3Tag Editor</a>.
          <br />
          Powered By <a href="https://sumanonline.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-medium">SumanOnline.com</a> | All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
