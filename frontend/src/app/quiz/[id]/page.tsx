'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getQuiz } from '@/lib/api';
import api from '@/lib/api';

const BG = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
const GRAD_BTN = 'linear-gradient(135deg, #7c3aed, #4f46e5)';

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }

    getQuiz(Number(params.id)).then(async (data) => {
      setQuiz(data);
      const res = await api.post(`/attempts/quizzes/${params.id}/start/`);
      setAttemptId(res.data.attempt_id);
    }).catch(() => setError('Could not load quiz.'));
  }, []);

  const selectAnswer = (questionId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [String(questionId)]: option }));
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    const unanswered = quiz.questions.filter((q: any) => !answers[String(q.id)]);
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/attempts/${attemptId}/submit/`, { answers });
      router.push(`/results/${attemptId}`);
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !quiz) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="text-center">
        <p className="text-red-400 font-medium mb-4">{error}</p>
        <button onClick={() => router.push('/dashboard')}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
          ← Back to dashboard
        </button>
      </div>
    </main>
  );

  if (!quiz) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-purple-300 text-sm">Loading quiz...</p>
      </div>
    </main>
  );

  const answered = Object.keys(answers).length;
  const total = quiz.questions.length;
  const progress = (answered / total) * 100;

  return (
    <main className="min-h-screen pb-12" style={{ background: BG }}>
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-700 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-700 rounded-full opacity-10 blur-3xl pointer-events-none" />

      {/* Sticky header */}
      <header className="border-b border-white/10 sticky top-0 z-20"
        style={{ background: 'rgba(15,12,41,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="font-bold text-white">{quiz.topic}</h1>
              <p className="text-xs text-white/40 mt-0.5 capitalize">{quiz.difficulty} · {total} questions</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-purple-300">{answered}</span>
              <span className="text-white/30 text-sm">/{total}</span>
              <p className="text-xs text-white/30">answered</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: GRAD_BTN }}
            />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 relative z-10">
        <div className="flex flex-col gap-5">
          {quiz.questions.map((q: any, i: number) => (
            <div key={q.id} className="rounded-2xl p-5 border border-white/10 shadow-xl"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
              <p className="font-semibold text-white mb-4 leading-snug">
                <span className="text-purple-400 mr-2 font-extrabold">{i + 1}.</span>
                {q.question_text}
              </p>
              <div className="flex flex-col gap-2.5">
                {(['a', 'b', 'c', 'd'] as const).map(opt => {
                  const optionKey = opt.toUpperCase();
                  const isSelected = answers[String(q.id)] === optionKey;
                  return (
                    <button
                      key={opt}
                      onClick={() => selectAnswer(q.id, optionKey)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all hover:scale-[1.01]"
                      style={isSelected ? {
                        background: 'rgba(124,58,237,0.25)',
                        borderColor: 'rgba(167,139,250,0.6)',
                        color: 'white',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <span className="w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                        style={isSelected ? {
                          background: GRAD_BTN,
                          borderColor: 'transparent',
                          color: 'white',
                        } : {
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: 'rgba(255,255,255,0.4)',
                        }}>
                        {optionKey}
                      </span>
                      {q[`option_${opt}`]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-5 bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || answered < total}
          className="mt-6 w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: GRAD_BTN }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </span>
          ) : answered < total
            ? `Answer ${total - answered} more question${total - answered > 1 ? 's' : ''} to submit`
            : '🎯 Submit Quiz'}
        </button>
      </div>
    </main>
  );
}
