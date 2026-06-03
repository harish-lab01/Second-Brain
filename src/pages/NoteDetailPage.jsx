import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import NoteDetail from '../components/notes/NoteDetail';
import useStore from '../store/useStore';
import { Loader2 } from 'lucide-react';

export default function NoteDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { notes, fetchNotes, removeNote } = useNotes(user?.uid);
  const showToast = useStore(s => s.showToast);
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [relatedNotes, setRelatedNotes] = useState([]);

  useEffect(() => {
    if (user && notes.length === 0) fetchNotes();
  }, [user]);

  useEffect(() => {
    if (notes.length > 0) {
      const found = notes.find(n => n.id === id);
      setNote(found || null);
      if (found?.relatedNoteIds?.length) {
        const related = notes.filter(n => found.relatedNoteIds.includes(n.id));
        setRelatedNotes(related);
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

  if (!note && notes.length > 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        Note not found.
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <NoteDetail
      note={note}
      relatedNotes={relatedNotes}
      onDelete={handleDelete}
      onEdit={() => navigate('/notes')}
    />
  );
}
