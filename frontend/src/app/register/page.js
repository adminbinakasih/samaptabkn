'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', class: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, role: 'student' });
      router.push('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="BKN-Running" className="w-24 h-24 mx-auto mb-2 object-contain" />
          <h1 className="text-3xl font-bold text-orange-500">BKN-Running</h1>
          <p className="text-slate-400 text-sm mt-1">Daftar Akun Baru</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Register</h2>
          {error && <p className="text-red-400 text-sm bg-red-900/30 p-2 rounded-lg">{error}</p>}
          <input
            type="text"
            placeholder="Nama Lengkap"
            className="bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Kelas (contoh: X-IPA-1)"
            className="bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            value={form.class}
            onChange={e => setForm({ ...form, class: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password (min 6 karakter)"
            className="bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
          >
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
          <p className="text-center text-slate-400 text-sm">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-orange-400 hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
