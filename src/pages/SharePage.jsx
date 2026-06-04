import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Brain, Sparkles, Calendar, ExternalLink, Lock } from 'lucide-react';
import { getPublicNote } from '../services/firestore';
import { formatDate } from '../utils/helpers';

export default function SharePage() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicNote(id);
        if (!data) setNotFound(true);
        else setNote(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen mesh-bg flex flex-col items-center justify-center gap-4 text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <Lock className="w-8 h-8 text-slate-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-200">Note not found</h1>
        <p className="text-slate-500 text-sm">This note is either private or doesn't exist.</p>
        <Link
          to="/"
          className="mt-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-600 transition-all"
        >
          Open SecondBrain
        </Link>
      </div>
    );
  }

  const typeColors = {
    text: 'bg-primary/10 text-primary-300 border-primary/25',
    pdf:  'bg-orange-500/10 text-orange-400 border-orange-500/25',
    url:  'bg-blue-500/10 text-blue-400 border-blue-500/25',
  };

  return (
    <div className="min-h-screen mesh-bg">
      {/* Nav bar */}
      <header className="border-b border-white/[0.06] bg-surface-100/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-glow-sm">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">SecondBrain</span>
        </Link>
        <Link
          to="/"
          className="text-xs text-primary-300 hover:underline font-medium"
        >
          Build your own →
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-white/[0.08] bg-surface-50/60 backdrop-blur-sm overflow-hidden animate-slide-up">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="p-8">
            {/* Badge + title */}
            <div className="mb-5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border mb-3 ${typeColors[note.type] || typeColors.text}`}>
                {note.type?.toUpperCase()}
              </span>
              <h1 className="text-2xl font-bold text-white leading-tight">{note.title}</h1>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(note.createdAt)}
              </div>
            </div>

            {/* Source URL */}
            {note.sourceUrl && (
              <a
                href={note.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 hover:underline mb-5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {note.sourceUrl}
              </a>
            )}

            {/* AI Summary */}
            {note.summary && (
              <div className="relative rounded-xl p-5 mb-6 bg-primary/5 border border-primary/15 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary-300" />
                  <p className="text-xs font-semibold text-primary-300 uppercase tracking-wider">AI Summary</p>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{note.summary}</p>
              </div>
            )}

            {/* Tags */}
            {note.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {note.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 text-primary-300 text-xs rounded-full font-medium border border-primary/20">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="h-px bg-white/[0.06] mb-6" />

            {/* Content */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Content</h3>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
                <p className="text-sm text-slate-300 leading-7 whitespace-pre-wrap">{note.content}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm mb-3">Created with SecondBrain — your AI-powered knowledge base</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-600 transition-all shadow-glow-sm"
          >
            <Brain className="w-4 h-4" />
            Start your own SecondBrain
          </Link>
        </div>
      </main>
    </div>
  );
}
