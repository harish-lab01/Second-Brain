import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, FileUp, Link, Sparkles, FolderOpen } from 'lucide-react';
import { formatDate, truncate } from '../../utils/helpers';
import useStore from '../../store/useStore';

const typeConfig = {
  text: { label: 'TEXT', icon: FileText, cls: 'bg-primary/10 text-primary-300 border-primary/25' },
  pdf:  { label: 'PDF',  icon: FileUp,   cls: 'bg-orange-500/10 text-orange-400 border-orange-500/25' },
  url:  { label: 'URL',  icon: Link,     cls: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
};

export default function NoteCard({ note }) {
  const navigate = useNavigate();
  const cfg = typeConfig[note.type] || typeConfig.text;
  const TypeIcon = cfg.icon;

  // Get collection name from global store if note has a collectionId
  const collections = useStore(s => s.collections || []);
  const collection  = note.collectionId
    ? collections.find(c => c.id === note.collectionId)
    : null;

  return (
    <div
      onClick={() => navigate(`/notes/${note.id}`)}
      className="group relative rounded-2xl p-5 border border-white/[0.07] bg-surface-50/60 cursor-pointer
        hover:bg-surface-50/90 hover:border-primary/20 hover:shadow-card-hover
        transition-all duration-300 overflow-hidden animate-fade-in"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(108,99,255,0.06) 0%, transparent 60%)' }} />

      {/* Type badge + sparkle */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.cls}`}>
          <TypeIcon className="w-2.5 h-2.5" />
          {cfg.label}
        </span>
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-3 h-3 text-primary-300" />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-slate-200 mb-2 group-hover:text-white transition-colors line-clamp-2 leading-snug">
        {note.title}
      </h3>

      {/* Summary */}
      {note.summary && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
          {truncate(note.summary, 100)}
        </p>
      )}

      {/* Tags */}
      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary-300 text-[10px] rounded-full font-medium border border-primary/20">
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-white/[0.04] text-slate-500 text-[10px] rounded-full border border-white/[0.08]">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer — date + optional collection badge */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <Calendar className="w-3 h-3" />
          {formatDate(note.createdAt)}
        </div>
        {collection && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border"
            style={{
              color: collection.color,
              background: collection.color + '18',
              borderColor: collection.color + '40',
            }}
          >
            <FolderOpen className="w-2 h-2" />
            {collection.icon} {truncate(collection.name, 12)}
          </span>
        )}
      </div>

      {/* Bottom line indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
