import { useState } from 'react';
import { X, Loader2, Sparkles, Save, RefreshCw } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import useStore from '../../store/useStore';

export default function EditNoteModal({ note, userId, onClose }) {
  const [title, setTitle]     = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [reAnalyze, setReAnalyze] = useState(false);
  const [saving, setSaving]   = useState(false);

  const { editNote } = useNotes(userId);
  const showToast = useStore(s => s.showToast);

  const hasChanges = title !== note.title || content !== note.content;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !hasChanges) return;
    setSaving(true);
    try {
      await editNote(note.id, { title: title.trim(), content }, reAnalyze && content !== note.content);
      showToast(reAnalyze ? 'Note updated and re-analyzed by AI!' : 'Note updated.');
      onClose();
    } catch (err) {
      showToast('Failed to update note: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(19,19,26,0.97)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-300" />
            </div>
            <h2 className="text-base font-semibold text-slate-100">Edit Note</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Note title..."
              required
              className={inputCls}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Your note content..."
              rows={8}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Re-analyze toggle */}
          {content !== note.content && (
            <button
              type="button"
              onClick={() => setReAnalyze(v => !v)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                reAnalyze
                  ? 'bg-primary/15 border-primary/30 text-primary-300'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-slate-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 flex-shrink-0 ${reAnalyze ? 'text-primary-300' : ''}`} />
              <span>Re-analyze with AI (new summary + tags)</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${reAnalyze ? 'bg-primary/20 text-primary-300' : 'bg-white/[0.05] text-slate-600'}`}>
                {reAnalyze ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/[0.08] hover:bg-white/[0.04] hover:text-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !hasChanges || !title.trim()}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-semibold
                hover:from-primary-600 hover:to-primary-800 transition-all shadow-glow-sm
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
