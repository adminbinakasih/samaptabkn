'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
      
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#080c14]">

      {/* Animated orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-orange-600/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-amber-500/15 blur-[140px] animate-pulse" style={{animationDelay:'1s'}} />
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-orange-400/10 blur-[100px] animate-pulse" style={{animationDelay:'2s'}} />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'60px 60px'}} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] mx-4">

        {/* Glow border effect */}
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-orange-500/40 via-transparent to-amber-400/20 blur-sm" />

        <div className="relative rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 p-8 shadow-2xl">

          {/* Logo & brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-xl scale-150" />
              <img src="/logo.png" alt="BKN-Running" className="relative w-20 h-20 object-contain drop-shadow-2xl" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">BKN<span className="text-orange-400">-Running</span></h1>
            <p className="text-white/40 text-xs mt-1 tracking-widest uppercase">Kesamaptaan Digital</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-white/30 text-xs tracking-widest uppercase">Masuk Akun</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="group">
              <label className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-2 block">Email</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="email@sekolah.id"
                  className="w-full bg-white/5 border border-white/10 group-focus-within:border-orange-500/60 rounded-2xl px-4 py-3.5 text-sm outline-none transition-all duration-300 text-white placeholder-white/20 focus:bg-white/8"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 group-focus-within:border-orange-500/60 rounded-2xl px-4 py-3.5 pr-12 text-sm outline-none transition-all duration-300 text-white placeholder-white/20"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-orange-400 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative mt-2 overflow-hidden rounded-2xl py-4 font-bold text-sm tracking-wide text-white transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
              style={{background:'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)', boxShadow:'0 8px 32px rgba(249,115,22,0.35)'}}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Masuk Sekarang
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-6">
            Belum punya akun?{' '}
            <Link href="/register" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
