import { useEffect, useState } from 'react';
import {
  FolderOpen, Plus, Trash2, Edit3, X, Check,
  FileText, Loader2, Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCollections } from '../hooks/useCollections';
import { useNotes } from '../hooks/useNotes';
import useStore from '../store/useStore';
import AddNoteModal from '../components/notes/AddNoteModal';
import NoteCard from '../components/notes/NoteCard';
import EmptyState from '../components/ui/EmptyState';

const PALETTE = [
  '#6C63FF','#3b82f6','#10b981','#f59e0b',
  '#ef4444','#8b5cf6','#ec4899','#14b8a6',
];

const EMOJIS = ['📁','📚','💡','🔬','💼','🎯','✏️','🧠','🌐','⭐','🎨','📊'];

function CollectionFormModal({ initial, onSave, onClose }) {
  const [name,  setName]  = useState(initial?.name  || '');
  const [color, setColor] = useState(initial?.color || PALETTE[0]);
  const [icon,  setIcon]  = useState(initial?.icon  || '📁');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), color, icon });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-slide-up"
        style={{ background:'rgba(19,19,26,0.97)', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 25px 80px rgba(0,0,0,0.7)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <h2 className="text-base font-semibold text-slate-100">{initial ? 'Edit Collection' : 'New Collection'}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: color + '22', border: `1px solid ${color}44` }}
            >
              {icon}
            </span>
            <span className="text-sm font-semibold text-slate-200">{name || 'Collection name'}</span>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Machine Learning, Book Notes…"
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder:text-slate-600
                bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 transition-all"
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    icon === e
                      ? 'bg-primary/20 border-2 border-primary/50'
                      : 'bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Color</label>
            <div className="flex gap-2">
              {PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/[0.08] hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-semibold
                hover:from-primary-600 transition-all shadow-glow-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {initial ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Collections() {
  const { user } = useAuth();
  const { collections, loading, fetchCollections, addCollection, editCollection, removeCollection } = useCollections(user?.uid);
  const { notes } = useNotes(user?.uid); // real-time subscription, no manual fetch needed
  const showToast = useStore(s => s.showToast);

  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [activeId, setActiveId]       = useState(null);
  const [showAddNote, setShowAddNote] = useState(false);

  useEffect(() => {
    if (user) fetchCollections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleCreate = async (data) => {
    try {
      await addCollection(data);
      showToast(`Collection "${data.name}" created.`);
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  };

  const handleEdit = async (data) => {
    try {
      await editCollection(editTarget.id, data);
      showToast('Collection updated.');
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  };

  const handleDelete = async (col) => {
    if (!window.confirm(`Delete "${col.name}"? Notes inside will not be deleted.`)) return;
    try {
      await removeCollection(col.id);
      if (activeId === col.id) setActiveId(null);
      showToast('Collection deleted.');
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  };

  const activeCol  = collections.find(c => c.id === activeId);
  const colNotes   = activeId ? notes.filter(n => n.collectionId === activeId) : [];
  const uncategorised = notes.filter(n => !n.collectionId);

  if (loading && collections.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary-300" />
            Collections
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {collections.length} collection{collections.length !== 1 ? 's' : ''} · {notes.length} total notes
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-600 transition-all shadow-glow-sm"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Group your notes into collections to stay organised as your knowledge base grows."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-600 transition-all shadow-glow-sm"
            >
              <Plus className="w-4 h-4" />
              Create first collection
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(col => {
            const count = notes.filter(n => n.collectionId === col.id).length;
            const isActive = activeId === col.id;
            return (
              <div
                key={col.id}
                onClick={() => setActiveId(isActive ? null : col.id)}
                className={`group relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 overflow-hidden ${
                  isActive
                    ? 'border-primary/30 bg-primary/[0.08] shadow-card-hover'
                    : 'border-white/[0.07] bg-surface-50/60 hover:bg-surface-50/90 hover:border-white/[0.12]'
                }`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at top left, ${col.color}10 0%, transparent 60%)` }} />

                <div className="flex items-start justify-between mb-4">
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: col.color + '22', border: `1px solid ${col.color}44` }}
                  >
                    {col.icon}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditTarget(col); }}
                      className="p-1.5 text-slate-500 hover:text-primary-300 hover:bg-primary/10 rounded-lg transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(col)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-200 mb-1 leading-snug">{col.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  {count} {count === 1 ? 'note' : 'notes'}
                </p>

                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: col.color }} />
                )}
              </div>
            );
          })}

          {/* Uncategorised card */}
          {uncategorised.length > 0 && (
            <div
              onClick={() => setActiveId(activeId === 'uncategorised' ? null : 'uncategorised')}
              className={`group relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 ${
                activeId === 'uncategorised'
                  ? 'border-slate-500/30 bg-slate-500/[0.08]'
                  : 'border-white/[0.07] bg-surface-50/60 hover:bg-surface-50/90 hover:border-white/[0.12]'
              }`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-4 bg-slate-500/10 border border-slate-500/20">
                📝
              </div>
              <h3 className="font-semibold text-slate-400 mb-1">Uncategorised</h3>
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                {uncategorised.length} {uncategorised.length === 1 ? 'note' : 'notes'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Expanded collection notes */}
      {activeId && (
        <div className="animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full inline-block" style={{ background: activeCol?.color || '#6C63FF' }} />
              {activeId === 'uncategorised' ? 'Uncategorised Notes' : activeCol?.name}
            </h3>
            {activeId !== 'uncategorised' && (
              <button
                onClick={() => setShowAddNote(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-300 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/15 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Note
              </button>
            )}
          </div>

          {(activeId === 'uncategorised' ? uncategorised : colNotes).length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-white/[0.06] bg-surface-50/30">
              <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No notes in this collection yet.</p>
              {activeId !== 'uncategorised' && (
                <button
                  onClick={() => setShowAddNote(true)}
                  className="mt-4 px-4 py-2 bg-primary/10 text-primary-300 border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/15 transition-all"
                >
                  + Add your first note
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeId === 'uncategorised' ? uncategorised : colNotes).map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CollectionFormModal onSave={handleCreate} onClose={() => setShowCreate(false)} />
      )}
      {editTarget && (
        <CollectionFormModal initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />
      )}
      {showAddNote && activeId && activeId !== 'uncategorised' && (
        <AddNoteModal
          userId={user?.uid}
          defaultCollection={activeId}
          onClose={() => setShowAddNote(false)}
        />
      )}
    </div>
  );
}
