import React from 'react';
import { Music, Github } from 'lucide-react';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col text-white">
      <header className="py-6 px-4 md:px-8 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/20">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              SumanMp3Tag Editor
            </h1>
          </div>
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
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>

      <footer className="py-6 border-t border-white/10 bg-black/20 text-center text-white/40 text-sm">
        <p>© {new Date().getFullYear()} SumanMp3Tag Editor. Secure client-side processing.</p>
      </footer>
    </div>
  );
};

export default Layout;
