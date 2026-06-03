import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import TagChip from '../ui/TagChip';
import { formatDate, truncate, getTypeBadgeClass } from '../../utils/helpers';

export default function NoteCard({ note }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/notes/${note.id}`)}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all group"
    >
      {/* Type badge */}
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${getTypeBadgeClass(note.type)}`}>
        {note.type?.toUpperCase()}
      </span>

      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {note.title}
      </h3>

      {note.summary && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {truncate(note.summary, 100)}
        </p>
      )}

      {/* Tags */}
      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-primary-50 text-primary text-xs rounded-full font-medium">
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Calendar className="w-3.5 h-3.5" />
        {formatDate(note.createdAt)}
      </div>
    </div>
  );
}
