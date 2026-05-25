'use client';
import { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper({ children }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Hanya tampilkan splash saat pertama kali buka (PWA launch)
    const shown = sessionStorage.getItem('splash_shown');
    if (!shown) {
      setShowSplash(true);
    }
  }, []);

  const handleDone = () => {
    sessionStorage.setItem('splash_shown', '1');
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onDone={handleDone} />}
      <div className={showSplash ? 'invisible' : 'visible flex flex-col min-h-screen'}>
        {children}
      </div>
    </>
  );
}
