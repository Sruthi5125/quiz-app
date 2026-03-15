'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { createQuiz, getQuizzes } from '@/lib/api';

const BG = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
const GRAD_BTN = 'linear-gradient(135deg, #7c3aed, #4f46e5)';

const difficultyStyle: Record<string, string> = {
  easy: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  hard: 'bg-red-500/20 text-red-300 border border-red-500/30',
};
const statusStyle: Record<string, string> = {
  ready: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  failed: 'bg-red-500/20 text-red-300 border border-red-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  generating: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [form, setForm] = useState({ topic: '', difficulty: 'easy', question_count: 5 });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }
    Promise.all([
      api.get('/auth/me/'),
      getQuizzes(),
      api.get('/attempts/history/'),
    ]).then(([userRes, quizzesData, historyRes]) => {
      setUser(userRes.data);
      setQuizzes(quizzesData);
      setRecentAttempts(historyRes.data.slice(0, 3));
    }).catch(() => {
      localStorage.removeItem('access_token');
      router.push('/login');
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const quiz = await createQuiz({ ...form, question_count: Number(form.question_count) });
      setQuizzes(prev => [quiz, ...prev]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create quiz.');
    } finally {
      setCreating(false);
    }
  };

  if (!user) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-purple-300 text-sm">Loading dashboard...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{ background: BG }}>
      {/* Ambient glows */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-700 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-700 rounded-full opacity-10 blur-3xl pointer-events-none" />

      {/* Navbar */}
      <header className="border-b border-white/10 sticky top-0 z-20"
        style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow"
              style={{ background: GRAD_BTN }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg">QuizAI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/50">
              Hi, <span className="text-white font-semibold">{user.username}</span>
            </span>
            <button
              onClick={() => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); router.push('/login'); }}
              className="text-xs text-white/40 hover:text-red-400 transition-colors border border-white/10 px-3 py-1.5 rounded-lg hover:border-red-400/40"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 relative z-10">

        {/* Generate quiz card */}
        <div className="rounded-2xl p-6 mb-8 border border-white/10 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.3)' }}>
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Generate a new quiz</h2>
              <p className="text-white/40 text-xs">Powered by Groq AI</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="sm:col-span-3 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              placeholder="Topic — e.g. Python, Django, Machine Learning"
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
              required
            />
            <select
              className="rounded-xl px-4 py-3 text-sm text-white border border-white/10 focus:outline-none focus:border-purple-400 transition"
              style={{ background: '#1e1a3e' }}
              value={form.difficulty}
              onChange={e => setForm({ ...form, difficulty: e.target.value })}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-purple-400 transition"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              type="number" min={5} max={20}
              placeholder="Questions (5–20)"
              value={form.question_count}
              onChange={e => setForm({ ...form, question_count: Number(e.target.value) })}
            />
            <button
              type="submit" disabled={creating}
              className="py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: GRAD_BTN }}
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : '✨ Generate Quiz'}
            </button>
          </form>
        </div>

        {/* Recent attempts */}
        {recentAttempts.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold">Recent attempts</h2>
              <button onClick={() => router.push('/history')} className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentAttempts.map((attempt: any) => (
                <div
                  key={attempt.id}
                  onClick={() => router.push(`/results/${attempt.id}`)}
                  className="rounded-xl p-4 border border-white/10 cursor-pointer hover:border-purple-400/40 transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <p className="font-semibold text-white text-sm truncate">{attempt.quiz_topic}</p>
                  <p className="text-xs text-white/40 mt-0.5 capitalize">{attempt.quiz_difficulty}</p>
                  <p className={`text-3xl font-extrabold mt-2 ${attempt.percentage >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {attempt.percentage}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz list */}
        <div>
          <h2 className="text-white font-semibold mb-4">Your quizzes</h2>
          {quizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-white/30 text-sm">No quizzes yet. Generate your first one above!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {quizzes.map((quiz: any) => (
                <div
                  key={quiz.id}
                  onClick={() => router.push(`/quiz/${quiz.id}`)}
                  className="rounded-xl p-4 border border-white/10 cursor-pointer hover:border-purple-400/40 transition-all hover:scale-[1.01] group"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white group-hover:text-purple-200 transition-colors">{quiz.topic}</p>
                      <p className="text-xs text-white/40 mt-0.5">{quiz.question_count} questions</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${difficultyStyle[quiz.difficulty] || 'bg-white/10 text-white/50'}`}>
                        {quiz.difficulty}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${statusStyle[quiz.status] || 'bg-white/10 text-white/50'}`}>
                        {quiz.status}
                      </span>
                      <svg className="w-4 h-4 text-white/30 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
