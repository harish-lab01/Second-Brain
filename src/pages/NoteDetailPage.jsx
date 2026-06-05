import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import { useCollections } from '../hooks/useCollections';
import NoteDetail from '../components/notes/NoteDetail';
import EditNoteModal from '../components/notes/EditNoteModal';
import useStore from '../store/useStore';
import { publishNote, unpublishNote } from '../services/firestore';
import { Loader2, X, Check } from 'lucide-react';

// ── Collection picker dropdown ────────────────────────────────────────────────
function CollectionPicker({ note, collections, onAssign, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-xs rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(19,19,26,0.97)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <p className="text-sm font-semibold text-slate-100">Move to Collection</p>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 max-h-64 overflow-y-auto">
          {/* Remove from collection */}
          {note.collectionId && (
            <button
              onClick={() => onAssign(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.04] transition-all text-slate-500 hover:text-slate-300 text-sm"
            >
              <span className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-base">📤</span>
              Remove from collection
            </button>
          )}
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => onAssign(col.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-primary/[0.08] transition-all group"
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ background: col.color + '22', border: `1px solid ${col.color}44` }}
              >
                {col.icon}
              </span>
              <span className={`text-sm flex-1 ${note.collectionId === col.id ? 'text-primary-300 font-medium' : 'text-slate-300'}`}>
                {col.name}
              </span>
              {note.collectionId === col.id && <Check className="w-3.5 h-3.5 text-primary-300 flex-shrink-0" />}
            </button>
          ))}
          {collections.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">No collections yet. Create one first.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NoteDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { notes, fetchNotes, removeNote, editNote } = useNotes(user?.uid);
  const { collections } = useCollections(user?.uid);
  const showToast = useStore(s => s.showToast);
  const navigate = useNavigate();

  const [note, setNote]             = useState(null);
  const [relatedNotes, setRelatedNotes] = useState([]);
  const [showEdit, setShowEdit]     = useState(false);
  const [showCollPicker, setShowCollPicker] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);

  useEffect(() => {
    // notes.length === 0 guard: if navigated directly to this URL,
    // the subscription may not have fired yet — fetchNotes triggers it
    if (user && notes.length === 0) fetchNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    if (notes.length > 0) {
      const found = notes.find(n => n.id === id);
      setNote(found || null);
      if (found?.relatedNoteIds?.length) {
        setRelatedNotes(notes.filter(n => found.relatedNoteIds.includes(n.id)));
      } else {
        setRelatedNotes([]);
      }
    }
  }, [notes, id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      await removeNote(id);
      showToast('Note deleted.');
      navigate('/notes');
    } catch (err) {
      showToast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleTogglePublic = async () => {
    if (!note) return;
    setSharingLoading(true);
    try {
      if (note.isPublic) {
        await unpublishNote(id);
        showToast('Note is now private.');
      } else {
        await publishNote(id, user.uid);
        const shareUrl = `${window.location.origin}/share/${id}`;
        await navigator.clipboard.writeText(shareUrl).catch(() => {});
        showToast('Note published! Link copied to clipboard.');
      }
      await fetchNotes(); // re-trigger subscription after publish toggle — onSnapshot will catch the isPublic change
    } catch (err) {
      showToast('Failed to update sharing: ' + err.message, 'error');
    } finally {
      setSharingLoading(false);
    }
  };

  const handleAssignCollection = async (collectionId) => {
    setShowCollPicker(false);
    try {
      await editNote(id, { collectionId: collectionId || null });
      showToast(collectionId
        ? `Moved to "${collections.find(c => c.id === collectionId)?.name}"`
        : 'Removed from collection.'
      );
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  };

  if (!note && notes.length > 0) {
    return <div className="text-center py-20 text-slate-500">Note not found.</div>;
  }

  if (!note) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <NoteDetail
        note={note}
        relatedNotes={relatedNotes}
        onDelete={handleDelete}
        onEdit={() => setShowEdit(true)}
        onTogglePublic={handleTogglePublic}
        onMoveToCollection={() => setShowCollPicker(true)}
        sharingLoading={sharingLoading}
        collections={collections}
      />

      {showEdit && (
        <EditNoteModal
          note={note}
          userId={user?.uid}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showCollPicker && (
        <CollectionPicker
          note={note}
          collections={collections}
          onAssign={handleAssignCollection}
          onClose={() => setShowCollPicker(false)}
        />
      )}
    </>
  );
}
