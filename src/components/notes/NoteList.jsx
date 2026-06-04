import NoteCard from './NoteCard';
import EmptyState from '../ui/EmptyState';
import { Plus } from 'lucide-react';

export default function NoteList({ notes, onAddNote }) {
  if (!notes.length) {
    return (
      <EmptyState
        title="No notes found"
        description="Start building your second brain by adding your first note."
        action={
          <button
            onClick={onAddNote}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-600 hover:to-primary-800 transition-all shadow-glow-sm"
          >
            <Plus className="w-4 h-4" />
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
