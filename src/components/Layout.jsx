import React, { useState } from 'react';
import { Music, Github, History, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col text-white">
      <header className="py-6 px-4 md:px-8 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer z-50 relative" 
            onClick={() => {
              if (onNavigate) onNavigate('home');
              closeMenu();
            }}
          >
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/20">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              SumanMp3Tag Editor
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => onNavigate && onNavigate('files')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Music className="w-4 h-4" />
              View Files
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

          {/* Mobile Menu Button */}
          <div className="md:hidden z-50 relative">
            <button 
              onClick={toggleMenu}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile Sliding Menu */}
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
              {/* Drawer Header */}
              <div className="py-6 px-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div 
                  className="flex items-center gap-3" 
                  onClick={() => {
                    if (onNavigate) onNavigate('home');
                    closeMenu();
                  }}
                >
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/20">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    SumanMp3Tag
                  </h1>
                </div>
                <button 
                  onClick={closeMenu}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Drawer Content */}
              <nav className="p-6 space-y-4">
                <button 
                  onClick={() => {
                    if (onNavigate) onNavigate('files');
                    closeMenu();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-medium transition-colors"
                >
                  <Music className="w-5 h-5 text-purple-400" />
                  View Files
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
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>

      <footer className="py-6 border-t border-white/10 bg-black/20 text-center text-white/40 text-sm">
        <p>
          © {new Date().getFullYear()} <a href="https://plyr.0-0-0.click/SumanMp3Tag/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">SumanMp3Tag Editor</a>. Secure client-side processing Project.
          <br />
          Powered By <a href="https://sumanonline.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">SumanOnline.com</a> | All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
