import React from 'react';
import { ImageConverter } from './components/ImageConverter';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <LogoIcon />
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">WebP Image Converter</h1>
        </div>
        <p className="text-text-secondary text-lg">
          Resize and convert your images to the next-gen WebP format with ease.
        </p>
      </header>
      <main className="w-full max-w-6xl flex-grow">
        <ImageConverter />
      </main>
      <footer className="w-full max-w-6xl text-center mt-12 text-sm text-text-secondary">
        <p>Built with React and Tailwind CSS.</p>
      </footer>
    </div>
  );
};

export default App;