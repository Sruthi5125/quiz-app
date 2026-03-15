'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

const BG = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
const GRAD_BTN = 'linear-gradient(135deg, #7c3aed, #4f46e5)';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }
    api.get(`/attempts/${params.attemptId}/results/`)
      .then(res => setAttempt(res.data))
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-purple-300 text-sm">Loading results...</p>
      </div>
    </main>
  );
  if (!attempt) return null;

  const mins = Math.floor((attempt.time_taken_seconds || 0) / 60);
  const secs = (attempt.time_taken_seconds || 0) % 60;
  const passed = attempt.percentage >= 60;
  const scoreGrad = passed
    ? 'linear-gradient(135deg, #059669, #0d9488)'
    : 'linear-gradient(135deg, #dc2626, #e11d48)';

  return (
    <main className="min-h-screen pb-16" style={{ background: BG }}>
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-700 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-700 rounded-full opacity-10 blur-3xl pointer-events-none" />

      {/* Score hero */}
      <div className="relative overflow-hidden" style={{ background: scoreGrad }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-2xl mx-auto px-6 py-12 text-center relative z-10">
          <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-3">
            {attempt.quiz_topic} &nbsp;·&nbsp; <span className="capitalize">{attempt.quiz_difficulty}</span>
          </p>

          <div className="text-8xl font-extrabold text-white mb-2 drop-shadow-lg">
            {attempt.percentage}%
          </div>
          <p className="text-white/90 text-lg font-semibold mb-8">
            {passed ? '🎉 Excellent! You passed!' : '💪 Keep practicing!'}
          </p>

          {/* Stats row */}
          <div className="inline-flex items-center gap-8 bg-white/10 rounded-2xl px-8 py-4 backdrop-blur-sm border border-white/20">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{attempt.score}/{attempt.total_questions}</p>
              <p className="text-white/60 text-xs mt-0.5">Correct</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{mins}m {secs}s</p>
              <p className="text-white/60 text-xs mt-0.5">Time taken</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{attempt.total_questions - attempt.score}</p>
              <p className="text-white/60 text-xs mt-0.5">Wrong</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 mt-8 relative z-10">
        {/* Action buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              if (attempt.percentage >= 80) {
                const confirmed = window.confirm(`You scored ${attempt.percentage}% on this quiz. Retake anyway?`);
                if (!confirmed) return;
              }
              router.push(`/quiz/${attempt.quiz}`);
            }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: GRAD_BTN }}
          >
            🔄 Retake
          </button>
        </div>

        {/* Review section */}
        <h2 className="text-white font-bold text-base mb-4">Review your answers</h2>
        <div className="flex flex-col gap-4">
          {attempt.answers.map((ans: any, i: number) => (
            <div key={ans.id} className="rounded-2xl p-5 border border-white/10"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>

              {/* Question header */}
              <div className="flex items-start gap-3 mb-4">
                <span className={`shrink-0 w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center mt-0.5 ${
                  ans.is_correct
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {ans.is_correct ? '✓' : '✗'}
                </span>
                <p className="font-semibold text-white leading-snug">
                  <span className="text-purple-400 mr-1">{i + 1}.</span>
                  {ans.question_text}
                </p>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2 mb-4">
                {['A', 'B', 'C', 'D'].map(opt => {
                  const isCorrect = opt === ans.correct_option;
                  const isSelected = opt === ans.selected_option;
                  const isWrong = isSelected && !isCorrect;

                  let bg = 'rgba(255,255,255,0.04)';
                  let border = 'rgba(255,255,255,0.08)';
                  let textColor = 'rgba(255,255,255,0.4)';
                  if (isCorrect) { bg = 'rgba(16,185,129,0.15)'; border = 'rgba(52,211,153,0.4)'; textColor = 'rgb(110,231,183)'; }
                  if (isWrong) { bg = 'rgba(239,68,68,0.15)'; border = 'rgba(248,113,113,0.4)'; textColor = 'rgb(252,165,165)'; }

                  return (
                    <div key={opt}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm"
                      style={{ background: bg, borderColor: border, color: textColor }}>
                      <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 border"
                        style={isCorrect
                          ? { background: 'rgb(16,185,129)', borderColor: 'transparent', color: 'white' }
                          : isWrong
                          ? { background: 'rgb(239,68,68)', borderColor: 'transparent', color: 'white' }
                          : { borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.3)' }}>
                        {opt}
                      </span>
                      <span className="flex-1">{ans[`option_${opt.toLowerCase()}`]}</span>
                      {isCorrect && !isSelected && <span className="text-xs text-emerald-400 font-semibold">Correct answer</span>}
                      {isCorrect && isSelected && <span className="text-xs text-emerald-400 font-semibold">Your answer ✓</span>}
                      {isWrong && <span className="text-xs text-red-400 font-semibold">Your answer ✗</span>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="rounded-xl p-3.5 border border-purple-500/20"
                style={{ background: 'rgba(124,58,237,0.12)' }}>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Explanation</p>
                <p className="text-sm text-purple-100/80 leading-relaxed">{ans.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
