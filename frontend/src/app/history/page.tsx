'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const BG = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
const GRAD_BTN = 'linear-gradient(135deg, #7c3aed, #4f46e5)';

export default function HistoryPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }

    api.get('/attempts/history/')
      .then(res => setAttempts(res.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-purple-300 text-sm">Loading history...</p>
      </div>
    </main>
  );

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : 0;
  const bestScore = attempts.length ? Math.max(...attempts.map(a => a.percentage)) : 0;
  const passCount = attempts.filter(a => a.percentage >= 60).length;

  return (
    <main className="min-h-screen pb-16" style={{ background: BG }}>
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-700 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-700 rounded-full opacity-10 blur-3xl pointer-events-none" />

      {/* Navbar */}
      <header className="border-b border-white/10 sticky top-0 z-20"
        style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GRAD_BTN }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg">QuizAI</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1.5 border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 relative z-10">
        <h1 className="text-2xl font-extrabold text-white mb-1">Attempt History</h1>
        <p className="text-white/40 text-sm mb-8">All your past quiz attempts</p>

        {attempts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 p-16 text-center"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-white/40 font-medium mb-1">No attempts yet</p>
            <p className="text-white/25 text-sm mb-6">Take a quiz to see your history here</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: GRAD_BTN }}
            >
              Go to dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { value: attempts.length, label: 'Total attempts', color: 'text-purple-300' },
                { value: `${avgScore}%`, label: 'Average score', color: 'text-emerald-300' },
                { value: `${bestScore}%`, label: 'Best score', color: 'text-amber-300' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-4 text-center border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="text-white/40 text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Pass/fail bar */}
            <div className="rounded-xl p-4 border border-white/10 mb-6"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>Pass rate</span>
                <span>{passCount}/{attempts.length} passed</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-2 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${(passCount / attempts.length) * 100}%` }} />
              </div>
            </div>

            {/* Attempt list */}
            <div className="flex flex-col gap-3">
              {attempts.map((attempt: any) => (
                <div
                  key={attempt.id}
                  onClick={() => router.push(`/results/${attempt.id}`)}
                  className="rounded-xl p-4 border border-white/10 cursor-pointer hover:border-purple-400/40 transition-all hover:scale-[1.01] group"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-white group-hover:text-purple-200 transition-colors">
                        {attempt.quiz_topic}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5 capitalize">
                        {attempt.quiz_difficulty} · {attempt.total_questions} questions
                        {attempt.time_taken_seconds ? ` · ${formatTime(attempt.time_taken_seconds)}` : ''}
                      </p>
                      <p className="text-xs text-white/25 mt-0.5">{formatDate(attempt.submitted_at)}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className={`text-2xl font-extrabold ${attempt.percentage >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {attempt.percentage}%
                      </p>
                      <p className="text-xs text-white/30">{attempt.score}/{attempt.total_questions}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className={`h-1.5 rounded-full transition-all ${attempt.percentage >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${attempt.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
