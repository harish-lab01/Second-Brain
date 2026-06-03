import NoteCard from './NoteCard';
import EmptyState from '../ui/EmptyState';

export default function NoteList({ notes, onAddNote }) {
  if (!notes.length) {
    return (
      <EmptyState
        title="No notes found"
        description="Start building your second brain by adding your first note."
        action={
          <button
            onClick={onAddNote}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            Add your first note
          </button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map(note => <NoteCard key={note.id} note={note} />)}
    </div>
  );
}
