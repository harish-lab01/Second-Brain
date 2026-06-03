import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import NoteList from '../components/notes/NoteList';
import AddNoteModal from '../components/notes/AddNoteModal';
import TagChip from '../components/ui/TagChip';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { getAllTags } from '../utils/helpers';

export default function Notes() {
  const { user } = useAuth();
  const { notes, loading, fetchNotes } = useNotes(user?.uid);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('All');

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const allTags = ['All', ...getAllTags(notes)];

  const filtered = notes.filter(note => {
    const matchesSearch =
      !search ||
      note.title?.toLowerCase().includes(search.toLowerCase()) ||
      note.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesTag =
      activeTag === 'All' || note.tags?.includes(activeTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search notes by title or tag…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Tag filters */}
      {allTags.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allTags.map(tag => (
            <TagChip
              key={tag}
              tag={tag}
              active={activeTag === tag}
              onClick={() => setActiveTag(tag)}
            />
          ))}
        </div>
      )}

      {/* Note count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          {filtered.length} {filtered.length === 1 ? 'note' : 'notes'}
          {search || activeTag !== 'All' ? ' found' : ''}
        </p>
      )}

      {/* Notes grid */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : (
        <NoteList notes={filtered} onAddNote={() => setShowModal(true)} />
      )}

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-600 transition-all hover:shadow-xl flex items-center justify-center z-40"
        title="Add note"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showModal && (
        <AddNoteModal
          userId={user?.uid}
          onClose={() => { setShowModal(false); fetchNotes(); }}
        />
      )}
    </div>
  );
}
