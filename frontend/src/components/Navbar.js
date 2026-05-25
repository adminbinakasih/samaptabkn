'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout, getUser, isAdmin } from '@/lib/auth';
import api from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [latihanOpen, setLatihanOpen] = useState(false);
  const [startingRun, setStartingRun] = useState(false);
  const latihanRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const handleClick = (e) => {
      if (latihanRef.current && !latihanRef.current.contains(e.target)) {
        setLatihanOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLink = (href, label) => (
    <Link href={href} onClick={() => setOpen(false)}
      className={'text-sm transition-colors ' + (pathname === href ? 'text-orange-400 font-semibold' : 'text-white/50 hover:text-white')}>
      {label}
    </Link>
  );

  const latihanItems = [
    { href: '/input-activity', label: 'Input Manual', desc: 'Catat lari manual' },
    { href: '/pushup', label: 'Push Up', desc: 'AI counter kamera' },
    { href: '/situp', label: 'Sit Up', desc: 'AI counter kamera' },
    { href: '/pullup', label: 'Pull Up', desc: 'AI counter kamera' },
    { href: '/chinning', label: 'Chinning', desc: 'AI counter kamera' },
  ];

  const handleStartGPS = async () => {
    setStartingRun(true);
    setLatihanOpen(false);
    setOpen(false);
    try {
      const res = await api.post('/activity', { type: 'running' });
      const activityId = res.data?.activity?.id;
      router.push(`/running?id=${activityId}`);
    } catch (err) {
      console.error('Failed to create activity:', err);
      alert('Gagal memulai sesi lari. Coba lagi.');
    } finally {
      setStartingRun(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#080c14]/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.png" alt="logo" className="w-8 h-8 object-contain" />
          <span className="font-black text-lg tracking-tight text-white">BKN<span className="text-orange-400">-Running</span></span>
        </Link>

        {/* Desktop nav */}
        {mounted && (
          <div className="hidden md:flex items-center gap-5">
            {isAdmin() && navLink('/admin', 'Admin')}
            {navLink('/feed', 'Feed')}
            {navLink('/leaderboard', 'Leaderboard')}
            {navLink('/history', 'History')}
            {navLink('/achievements', 'Achievements')}

            {/* Dropdown Latihan */}
            <div className="relative" ref={latihanRef}>
              <button
                onClick={() => setLatihanOpen(!latihanOpen)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-1.5">
                Latihan
                <svg className={'w-3 h-3 transition-transform ' + (latihanOpen ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {latihanOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/10 bg-[#0f1520] shadow-2xl overflow-hidden">
                  <button
                    onClick={handleStartGPS}
                    disabled={startingRun}
                    className={'flex flex-col w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 ' + (startingRun ? 'opacity-50' : '')}>
                    <span className="text-sm font-semibold text-white">{startingRun ? 'Memulai...' : 'Lari GPS'}</span>
                    <span className="text-white/30 text-xs mt-0.5">GPS tracking real-time</span>
                  </button>
                  {latihanItems.map(item => (
                    <Link key={item.href} href={item.href}
                      onClick={() => setLatihanOpen(false)}
                      className={'flex flex-col px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ' + (pathname === item.href ? 'bg-orange-500/10' : '')}>
                      <span className={'text-sm font-semibold ' + (pathname === item.href ? 'text-orange-400' : 'text-white')}>{item.label}</span>
                      <span className="text-white/30 text-xs mt-0.5">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button onClick={logout} className="text-white/30 hover:text-red-400 transition-colors text-sm">Logout</button>
          </div>
        )}

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2 text-white/60 hover:text-white transition-colors">
          <span className={'block w-5 h-0.5 bg-current transition-all ' + (open ? 'rotate-45 translate-y-2' : '')} />
          <span className={'block w-5 h-0.5 bg-current transition-all ' + (open ? 'opacity-0' : '')} />
          <span className={'block w-5 h-0.5 bg-current transition-all ' + (open ? '-rotate-45 -translate-y-2' : '')} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && mounted && (
        <div className="md:hidden border-t border-white/5 bg-[#080c14] px-4 py-4 flex flex-col gap-1">
          {isAdmin() && (
            <Link href="/admin" onClick={() => setOpen(false)}
              className={'px-3 py-2.5 rounded-xl text-sm transition-colors ' + (pathname === '/admin' ? 'bg-orange-500/10 text-orange-400 font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white')}>
              Admin
            </Link>
          )}
          {[
            { href: '/feed', label: 'Feed' },
            { href: '/leaderboard', label: 'Leaderboard' },
            { href: '/history', label: 'History' },
            { href: '/achievements', label: 'Achievements' },
          ].map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={'px-3 py-2.5 rounded-xl text-sm transition-colors ' + (pathname === l.href ? 'bg-orange-500/10 text-orange-400 font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white')}>
              {l.label}
            </Link>
          ))}

          {/* Latihan section mobile */}
          <div className="mt-2 mb-1">
            <p className="text-white/20 text-xs uppercase tracking-widest px-3 mb-1">Latihan</p>
            <button
              onClick={handleStartGPS}
              disabled={startingRun}
              className={'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-colors text-white/60 hover:bg-white/5 hover:text-white ' + (startingRun ? 'opacity-50' : '')}>
              <span>{startingRun ? 'Memulai...' : 'Lari GPS'}</span>
              <span className="text-white/20 text-xs">GPS tracking real-time</span>
            </button>
            {latihanItems.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ' + (pathname === item.href ? 'bg-orange-500/10 text-orange-400 font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white')}>
                <span>{item.label}</span>
                <span className="text-white/20 text-xs">{item.desc}</span>
              </Link>
            ))}
          </div>

          <button onClick={logout} className="mt-1 text-white/30 hover:text-red-400 text-sm py-2 text-left px-3">Logout</button>
        </div>
      )}
    </nav>
  );
}
