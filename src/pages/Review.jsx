import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, RotateCcw, Sparkles, BookOpen, Trophy, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import { getUserReviews, saveReviewLog } from '../services/firestore';
import { generateFlashcard } from '../services/gemini';
import { sm2, getDueNotes } from '../utils/sm2';
import useStore from '../store/useStore';

const RATINGS = [
  { value: 1, label: 'Forgot', color: 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25' },
  { value: 3, label: 'Hard',   color: 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25' },
  { value: 4, label: 'Good',   color: 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25' },
  { value: 5, label: 'Easy',   color: 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25' },
];

export default function Review() {
  const { user } = useAuth();
  const { notes } = useNotes(user?.uid); // real-time subscription — no manual fetch needed
  const showToast = useStore(s => s.showToast);

  const [reviewLogs, setReviewLogs]     = useState([]);
  const [dueNotes, setDueNotes]         = useState([]);
  const [current, setCurrent]           = useState(0);
  const [flashcard, setFlashcard]       = useState(null);
  const [revealed, setRevealed]         = useState(false);
  const [loadingCard, setLoadingCard]   = useState(false);
  const [savingRate, setSavingRate]     = useState(false); // prevents double-tap
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [phase, setPhase]               = useState('loading');

  // Load review logs once on mount
  useEffect(() => {
    if (!user) return;
    getUserReviews(user.uid)
      .then(setReviewLogs)
      .catch(() => showToast('Could not load review history.', 'error'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // intentionally omit showToast — stable Zustand selector

  // Derive due notes whenever notes or logs change
  // If user has zero notes, show empty state immediately instead of staying on loading spinner
  useEffect(() => {
    if (notes.length === 0) {
      // Only transition to empty if we've confirmed there are no notes
      // (loading=false means the subscription has fired at least once)
      // We use a small timeout to distinguish "still loading" from "genuinely empty"
      const t = setTimeout(() => {
        setPhase(prev => prev === 'loading' ? 'empty' : prev);
      }, 3000); // 3s grace period for the real-time subscription to fire
      return () => clearTimeout(t);
    }
    const due = getDueNotes(notes, reviewLogs);
    setDueNotes(due);
    setPhase(due.length === 0 ? 'empty' : 'reviewing');
  }, [notes, reviewLogs]);

  const loadCard = useCallback(async (note) => {
    setLoadingCard(true);
    setRevealed(false);
    try {
      const card = await generateFlashcard(note);
      setFlashcard(card);
    } catch {
      setFlashcard({ question: `What is the main idea of "${note.title}"?`, hint: note.summary || '' });
    } finally {
      setLoadingCard(false);
    }
  }, []);

  useEffect(() => {
    if (phase === 'reviewing' && dueNotes.length > 0 && current < dueNotes.length) {
      loadCard(dueNotes[current]);
    }
  }, [current, dueNotes, phase, loadCard]);

  const handleRate = async (rating) => {
    if (!dueNotes[current] || savingRate) return;
    setSavingRate(true);
    const note = dueNotes[current];

    const existing = reviewLogs
      .filter(l => l.noteId === note.id)
      .sort((a, b) =>
        new Date(b.reviewedAt?.toDate?.() || b.reviewedAt) -
        new Date(a.reviewedAt?.toDate?.() || a.reviewedAt)
      )[0];

    const result = sm2(
      rating,
      existing?.repetitions ?? 0,
      existing?.easeFactor ?? 2.5,
      existing?.interval ?? 1
    );

    try {
      await saveReviewLog(
        user.uid, note.id, rating,
        result.nextReview, result.interval, result.repetitions, result.easeFactor
      );
      // Update local log cache so next card's SM-2 calc is accurate
      setReviewLogs(prev => [...prev, {
        noteId: note.id, rating, ...result,
        reviewedAt: new Date().toISOString(),
      }]);
    } catch (err) {
      // HIGH severity — user must know their review wasn't saved
      showToast('Review not saved — please check your connection.', 'error');
      setSavingRate(false);
      return; // Don't advance — let them try again
    }

    setSessionStats(s => ({ reviewed: s.reviewed + 1, correct: s.correct + (rating >= 4 ? 1 : 0) }));
    setSavingRate(false);

    if (current + 1 >= dueNotes.length) {
      setPhase('done');
    } else {
      setCurrent(c => c + 1);
    }
  };

  const restart = () => {
    setCurrent(0);
    setSessionStats({ reviewed: 0, correct: 0 });
    const due = getDueNotes(notes, reviewLogs);
    setDueNotes(due);
    setPhase(due.length === 0 ? 'empty' : 'reviewing');
  };

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // ── EMPTY ─────────────────────────────────────────────────────────────────
  if (phase === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
          <CheckCircle className="w-9 h-9 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">All caught up!</h2>
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
          No notes are due for review today. Come back tomorrow to keep your knowledge fresh.
        </p>
        <div className="mt-6 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
          <p className="text-sm font-medium text-slate-300">{notes.length} notes in your knowledge base</p>
          <p className="text-xs text-slate-600 mt-0.5">New reviews will be scheduled automatically</p>
        </div>
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const score = sessionStats.reviewed > 0
      ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
      : 0;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center mb-5">
          <Trophy className="w-9 h-9 text-primary-300" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
        <p className="text-slate-400 text-sm mb-8">Great job reviewing your knowledge.</p>
        <div className="flex gap-4 mb-8">
          {[
            { label: 'Reviewed', value: sessionStats.reviewed, color: 'text-blue-400' },
            { label: 'Correct',  value: sessionStats.correct,  color: 'text-green-400' },
            { label: 'Score',    value: `${score}%`,            color: score >= 70 ? 'text-green-400' : 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.07] text-center min-w-[80px]">
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={restart}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-600 transition-all shadow-glow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Review Again
        </button>
      </div>
    );
  }

  // ── REVIEWING ─────────────────────────────────────────────────────────────
  const note     = dueNotes[current];
  const progress = (current / dueNotes.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-300" />
            Daily Review
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {dueNotes.length - current} note{dueNotes.length - current !== 1 ? 's' : ''} remaining
          </p>
        </div>
        <p className="text-xs text-slate-500">{current + 1} / {dueNotes.length}</p>
      </div>

      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-300 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-surface-50/60 backdrop-blur-sm overflow-hidden" style={{ minHeight: '320px' }}>
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="p-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs text-slate-500 font-medium px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07]">
              {note.type?.toUpperCase()} NOTE
            </span>
            <span className="text-xs text-slate-600 truncate">{note.title}</span>
          </div>

          {loadingCard ? (
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-primary-300" />
              <span className="text-sm">Generating question…</span>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary-300 flex-shrink-0" />
                  <p className="text-xs font-semibold text-primary-300 uppercase tracking-wider">Question</p>
                </div>
                <p className="text-lg font-semibold text-slate-100 leading-snug">{flashcard?.question}</p>
              </div>

              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary-300 text-sm font-medium hover:bg-primary/15 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                  Show Answer
                </button>
              ) : (
                <div className="space-y-4 animate-slide-up">
                  <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.07]">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Answer / Hint</p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {flashcard?.hint || note.summary || 'Review the full note for the answer.'}
                    </p>
                  </div>
                  {note.content && (
                    <div className="rounded-xl p-4 bg-primary/5 border border-primary/15">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Note Excerpt</p>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                        {note.content.slice(0, 300)}{note.content.length > 300 ? '…' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {revealed && !loadingCard && (
        <div className="animate-slide-up">
          <p className="text-xs text-slate-500 text-center mb-3 font-medium">How well did you remember?</p>
          <div className="grid grid-cols-4 gap-3">
            {RATINGS.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => handleRate(value)}
                disabled={savingRate}
                className={`py-3 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50 ${color}`}
              >
                {savingRate ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : label}
              </button>
            ))}
          </div>
          {savingRate && (
            <p className="text-xs text-slate-500 text-center mt-2 flex items-center justify-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
