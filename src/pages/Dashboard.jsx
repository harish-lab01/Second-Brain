import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileUp, Link, Tag, Plus, Loader2, ArrowRight, Brain, TrendingUp, BookOpen, GitFork, FolderOpen } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import NoteCard from '../components/notes/NoteCard';
import AddNoteModal from '../components/notes/AddNoteModal';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import { generateWeeklyDigest } from '../services/gemini';
import { getUserReviews } from '../services/firestore';
import { getAllTags, getRecentNotes } from '../utils/helpers';
import { getDueNotes } from '../utils/sm2';

export default function Dashboard() {
  const { user } = useAuth();
  const { notes, loading } = useNotes(user?.uid); // real-time — no manual fetchNotes needed
  const [showModal, setShowModal]         = useState(false);
  const [digest, setDigest]               = useState('');
  const [digestWeek, setDigestWeek]       = useState(''); // tracks which week the digest was generated
  const [digestLoading, setDigestLoading] = useState(false);
  const [dueCount, setDueCount]           = useState(0);
  const navigate = useNavigate();

  // Digest — regenerate once per week, not once per session
  useEffect(() => {
    if (!notes.length) return;
    // Week key: year + ISO week number
    const now = new Date();
    const weekKey = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}-${user?.uid}`;

    const recentNotes = getRecentNotes(notes, 7).filter(n => n.summary);
    if (recentNotes.length > 0 && weekKey !== digestWeek) {
      setDigestLoading(true);
      generateWeeklyDigest(recentNotes)
        .then(d => { setDigest(d); setDigestWeek(weekKey); })
        .catch(() => setDigest('Could not generate digest.'))
        .finally(() => setDigestLoading(false));
    }
    if (user) {
      getUserReviews(user.uid)
        .then(logs => setDueCount(getDueNotes(notes, logs).length))
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes.length, user?.uid]); // digest regeneration is intentionally week-keyed

  const allTags    = getAllTags(notes);
  const pdfCount   = notes.filter(n => n.type === 'pdf').length;
  const urlCount   = notes.filter(n => n.type === 'url').length;
  const recentNotes = notes.slice(0, 6);

  const stats = [
    { icon: FileText, label: 'Total Notes',    value: notes.length,    color: 'text-primary-300',  bg: 'bg-primary/10',    borderColor: 'border-primary/20'    },
    { icon: FileUp,   label: 'PDFs',           value: pdfCount,        color: 'text-orange-400',   bg: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    { icon: Link,     label: 'URLs',           value: urlCount,        color: 'text-blue-400',     bg: 'bg-blue-500/10',   borderColor: 'border-blue-500/20'   },
    { icon: Tag,      label: 'Unique Tags',    value: allTags.length,  color: 'text-green-400',    bg: 'bg-green-500/10',  borderColor: 'border-green-500/20'  },
    { icon: BookOpen, label: 'Due for Review', value: dueCount,        color: 'text-yellow-400',   bg: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
    { icon: GitFork,  label: 'Connections',    value: notes.reduce((acc, n) => acc + (n.relatedNoteIds?.length || 0), 0), color: 'text-purple-400', bg: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  ];

  const firstName = user?.displayName?.split(' ')[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 lg:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(167,139,250,0.08) 50%, rgba(99,102,241,0.05) 100%)',
          border: '1px solid rgba(108,99,255,0.2)',
        }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Background Brain icon */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <Brain className="w-32 h-32 text-primary" />
        </div>

        <div className="flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">Knowledge base active</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white">
              Welcome back, <span className="gradient-text">{firstName}</span> 👋
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              {notes.length > 0
                ? `You have ${notes.length} note${notes.length > 1 ? 's' : ''} in your knowledge base.`
                : 'Start building your second brain today.'
              }
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl
              font-semibold text-sm hover:from-primary-600 hover:to-primary-800 transition-all shadow-glow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => <StatsCard key={s.label} {...s} />)}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          onClick={() => navigate('/graph')}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/[0.07] bg-surface-50/60 hover:bg-surface-50/90 hover:border-primary/20 transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <GitFork className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">Knowledge Graph</p>
            <p className="text-xs text-slate-500">Visualize connections</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>

        <button
          onClick={() => navigate('/collections')}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/[0.07] bg-surface-50/60 hover:bg-surface-50/90 hover:border-orange-500/20 transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-4 h-4 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">Collections</p>
            <p className="text-xs text-slate-500">Organised notebooks</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>

        <button
          onClick={() => navigate('/review')}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/[0.07] bg-surface-50/60 hover:bg-surface-50/90 hover:border-yellow-500/20 transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">Daily Review</p>
            <p className="text-xs text-slate-500">{dueCount > 0 ? `${dueCount} due today` : 'All caught up!'}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
      </div>

      {/* Weekly Digest */}
      {(digest || digestLoading) && (
        <div className="relative rounded-2xl p-6 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.12) 0%, rgba(126,34,206,0.08) 100%)',
            border: '1px solid rgba(108,99,255,0.2)',
          }}>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary-300" />
            </div>
            <p className="text-xs font-semibold text-primary-300 uppercase tracking-wider">✨ Weekly AI Digest</p>
          </div>

          {digestLoading ? (
            <div className="flex items-center gap-2.5 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-primary-300" />
              <span className="text-sm">Generating your weekly summary…</span>
            </div>
          ) : (
            <p className="text-sm text-slate-300 leading-relaxed">{digest}</p>
          )}
        </div>
      )}

      {/* Recent Notes */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-primary-700 inline-block" />
            Recent Notes
          </h3>
          <button
            onClick={() => navigate('/notes')}
            className="flex items-center gap-1.5 text-sm text-primary-300 hover:text-primary-300/80 font-medium transition-colors group"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 border border-white/[0.06] bg-surface-50/60 animate-pulse">
                <div className="h-4 bg-white/[0.06] rounded-lg w-1/4 mb-4" />
                <div className="h-5 bg-white/[0.05] rounded w-3/4 mb-2" />
                <div className="h-3.5 bg-white/[0.04] rounded w-full mb-1.5" />
                <div className="h-3.5 bg-white/[0.03] rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentNotes.map(note => <NoteCard key={note.id} note={note} />)}
          </div>
        ) : (
          <div className="rounded-2xl p-10 border border-white/[0.06] bg-surface-50/40 text-center">
            <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No notes yet. Add your first one!</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-primary/10 text-primary-300 border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/15 transition-all"
            >
              + Add Note
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AddNoteModal userId={user?.uid} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
