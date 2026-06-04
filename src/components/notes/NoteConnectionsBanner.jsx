/**
 * NoteConnectionsBanner
 *
 * Shown after a note is saved. Uses semantic similarity + shared tags
 * to proactively surface "Did you know these connect?" cards.
 *
 * Props:
 *   newNote     — the note just saved
 *   allNotes    — full notes array (excluding newNote)
 *   onClose     — fn to dismiss
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight, Brain, Loader2 } from 'lucide-react';
import { hybridSearch } from '../../services/embeddings';
import { formatDate } from '../../utils/helpers';

function scoreByTags(note, allNotes, topK = 3) {
  if (!note.tags?.length) return [];
  const scored = allNotes
    .filter(n => n.id !== note.id)
    .map(n => {
      const shared = (note.tags || []).filter(t => (n.tags || []).includes(t));
      return { note: n, score: shared.length };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return scored.map(({ note }) => note);
}

export default function NoteConnectionsBanner({ newNote, allNotes, onClose }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!newNote || !allNotes.length) { setLoading(false); return; }

    const others = allNotes.filter(n => n.id !== newNote.id);
    if (!others.length) { setLoading(false); return; }

    // Build query from the new note's title + tags + first line of summary
    const query = [newNote.title, newNote.tags?.join(' '), newNote.summary?.slice(0, 80)]
      .filter(Boolean).join(' ');

    // Try semantic first, fall back to tag-based
    hybridSearch(query, others, 3)
      .then(results => {
        if (results.length > 0) {
          setConnections(results);
        } else {
          // Fallback: tag overlap
          setConnections(scoreByTags(newNote, others, 3));
        }
      })
      .catch(() => {
        setConnections(scoreByTags(newNote, others, 3));
      })
      .finally(() => setLoading(false));
  }, [newNote, allNotes]);

  // Don't render if no connections found
  if (!loading && connections.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-slide-up"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(19,19,26,0.97)',
          border: '1px solid rgba(108,99,255,0.25)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(108,99,255,0.1)',
        }}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="px-5 py-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-primary-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Your knowledge is connecting</p>
                <p className="text-[11px] text-slate-500">
                  {loading ? 'Analysing connections…' : `Found ${connections.length} related note${connections.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] rounded-lg transition-all flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2.5 py-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-primary-300" />
              <span className="text-xs">Finding semantic connections…</span>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map(note => (
                <button
                  key={note.id}
                  onClick={() => { navigate(`/notes/${note.id}`); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                    bg-white/[0.03] border border-white/[0.06]
                    hover:bg-primary/10 hover:border-primary/20 transition-all group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary-300 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                      {note.title}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate">
                      {note.tags?.slice(0, 3).map(t => `#${t}`).join(' ')} · {formatDate(note.createdAt)}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-primary-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {!loading && (
            <p className="text-[10px] text-slate-600 text-center mt-3">
              Powered by semantic + tag analysis · <button onClick={onClose} className="text-primary-300/60 hover:text-primary-300 transition-colors">Dismiss</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
