import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit3, ExternalLink } from 'lucide-react';
import TagChip from '../ui/TagChip';
import NoteCard from './NoteCard';
import { formatDate, getTypeBadgeClass } from '../../utils/helpers';

export default function NoteDetail({ note, relatedNotes, onDelete, onEdit }) {
  const navigate = useNavigate();

  if (!note) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/notes')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Notes
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${getTypeBadgeClass(note.type)}`}>
              {note.type?.toUpperCase()}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
            <p className="text-sm text-gray-400 mt-1">{formatDate(note.createdAt)}</p>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source URL */}
        {note.sourceUrl && (
          <a
            href={note.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {note.sourceUrl}
          </a>
        )}

        {/* AI Summary */}
        {note.summary && (
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">AI Summary</p>
            <p className="text-sm text-gray-700">{note.summary}</p>
          </div>
        )}

        {/* Tags */}
        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {note.tags.map(tag => (
              <TagChip key={tag} tag={`#${tag}`} />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-sm max-w-none">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Content</h3>
          <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
            {note.content || <span className="text-gray-400 italic">No content</span>}
          </div>
        </div>
      </div>

      {/* Related Notes */}
      {relatedNotes?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Notes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedNotes.map(rn => <NoteCard key={rn.id} note={rn} />)}
          </div>
        </div>
      )}
    </div>
  );
}
