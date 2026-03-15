'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login/', form);
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      router.push('/dashboard');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>

      {/* Glowing orbs for visual depth */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-600 rounded-full opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-indigo-600 rounded-full opacity-20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">QuizAI</h1>
          <p className="text-purple-300 mt-1 text-sm">Welcome back! Sign in to continue</p>
        </div>

        {/* Glass card */}
        <div className="rounded-2xl p-8 border border-white/10 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">Username</label>
              <input
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                style={{ background: 'rgba(255,255,255,0.08)' }}
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">Password</label>
              <input
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                style={{ background: 'rgba(255,255,255,0.08)' }}
                placeholder="Enter your password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
              Create one
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
