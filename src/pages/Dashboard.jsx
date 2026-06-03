import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileUp, Link, Tag, Plus, Loader2 } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import NoteCard from '../components/notes/NoteCard';
import AddNoteModal from '../components/notes/AddNoteModal';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import { generateWeeklyDigest } from '../services/gemini';
import { getAllTags, getRecentNotes } from '../utils/helpers';

export default function Dashboard() {
  const { user } = useAuth();
  const { notes, loading, fetchNotes } = useNotes(user?.uid);
  const [showModal, setShowModal] = useState(false);
  const [digest, setDigest] = useState('');
  const [digestLoading, setDigestLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  useEffect(() => {
    if (notes.length > 0) {
      const recentNotes = getRecentNotes(notes, 7).filter(n => n.summary);
      if (recentNotes.length > 0) {
        setDigestLoading(true);
        generateWeeklyDigest(recentNotes)
          .then(setDigest)
          .catch(() => setDigest('Could not generate digest.'))
          .finally(() => setDigestLoading(false));
      }
    }
  }, [notes]);

  const allTags = getAllTags(notes);
  const pdfCount = notes.filter(n => n.type === 'pdf').length;
  const urlCount = notes.filter(n => n.type === 'url').length;
  const recentNotes = notes.slice(0, 5);

  const stats = [
    { icon: FileText, label: 'Total Notes',  value: notes.length, color: 'text-primary',  bg: 'bg-primary-50' },
    { icon: FileUp,   label: 'PDFs',          value: pdfCount,     color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Link,     label: 'URLs',           value: urlCount,     color: 'text-blue-500',   bg: 'bg-blue-50' },
    { icon: Tag,      label: 'Unique Tags',    value: allTags.length, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.displayName?.split(' ')[0]} 👋
          </h2>
          <p className="text-gray-500 mt-1">Here's what's in your second brain.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatsCard key={s.label} {...s} />)}
      </div>

      {/* Weekly Digest */}
      {(digest || digestLoading) && (
        <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">✨ Weekly AI Digest</p>
          {digestLoading ? (
            <div className="flex items-center gap-2 opacity-80">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating your weekly summary…</span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed opacity-90">{digest}</p>
          )}
        </div>
      )}

      {/* Recent Notes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Notes</h3>
          <button
            onClick={() => navigate('/notes')}
            className="text-sm text-primary font-medium hover:underline"
          >
            View all →
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentNotes.map(note => <NoteCard key={note.id} note={note} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
            <p className="text-gray-400 text-sm">No notes yet. Add your first one!</p>
          </div>
        )}
      </div>

      {showModal && <AddNoteModal userId={user?.uid} onClose={() => { setShowModal(false); fetchNotes(); }} />}
    </div>
  );
}
