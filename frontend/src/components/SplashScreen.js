'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  // phase 0: fade in logo
  // phase 1: show tagline
  // phase 2: progress bar
  // phase 3: fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2400);
    const t4 = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080c14] transition-opacity duration-500 ${phase === 3 ? 'opacity-0' : 'opacity-100'}`}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-orange-600/15 blur-[80px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-amber-500/10 blur-[100px] animate-pulse" style={{animationDelay:'0.5s'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-orange-400/5 blur-[120px] animate-pulse" style={{animationDelay:'1s'}} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'40px 40px'}} />

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div key={i}
            className="absolute w-1 h-1 rounded-full bg-orange-400/40 animate-ping"
            style={{
              left: `${10 + (i * 7.5)}%`,
              top: `${20 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${1.5 + (i % 3) * 0.5}s`,
            }} />
        ))}
      </div>

      {/* Logo */}
      <div className={`relative z-10 flex flex-col items-center transition-all duration-700 ${phase >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>

        {/* Glow ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-2xl scale-150 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-orange-500/20 scale-125 animate-ping" style={{animationDuration:'2s'}} />
          <img
            src="/logo.png"
            alt="BKN-Running"
            className="relative w-28 h-28 object-contain drop-shadow-2xl"
            style={{filter:'drop-shadow(0 0 20px rgba(249,115,22,0.5))'}}
          />
        </div>

        {/* App name */}
        <div className="text-center mb-2">
          <h1 className="text-4xl font-black tracking-tight text-white">
            BKN<span className="text-orange-400">-Running</span>
          </h1>
        </div>

        {/* Tagline */}
        <div className={`transition-all duration-500 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase text-center">
            Platform Kesamaptaan Digital
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`absolute bottom-16 left-0 right-0 px-12 transition-all duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
            style={{
              width: phase >= 2 ? '100%' : '0%',
              transition: 'width 1.2s ease-in-out',
            }}
          />
        </div>
        <p className="text-white/20 text-[10px] text-center mt-3 tracking-widest uppercase">
          Memuat...
        </p>
      </div>

      {/* Bottom credit */}
      <div className={`absolute bottom-6 transition-all duration-500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-white/15 text-[10px] tracking-widest uppercase">
          SMK Bina Kasih Nusantara
        </p>
      </div>
    </div>
  );
}
