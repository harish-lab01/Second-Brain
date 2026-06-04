import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trash2, Edit3, ExternalLink, Sparkles,
  FileText, FileUp, Link as LinkIcon, Calendar,
  Mail, Phone, Globe, MapPin, ChevronRight,
  Share2, Lock, Loader2, Copy, FolderOpen
} from 'lucide-react';
import NoteCard from './NoteCard';
import { formatDate } from '../../utils/helpers';

const typeConfig = {
  text: { label: 'TEXT', icon: FileText,  cls: 'bg-primary/10 text-primary-300 border-primary/25'     },
  pdf:  { label: 'PDF',  icon: FileUp,    cls: 'bg-orange-500/10 text-orange-400 border-orange-500/25' },
  url:  { label: 'URL',  icon: LinkIcon,  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/25'       },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** True if a token looks like a SECTION HEADING (all-caps, 3+ chars, no digits) */
const isSectionHeading = (token) =>
  /^[A-Z][A-Z\s&\/]{2,}$/.test(token.trim()) && token.trim().length >= 3;

/** True if the word looks like a sub-heading date range or location line */
const isMetaLine = (line) =>
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b.*\d{4}/.test(line) ||
  /\b\d{4}\s*[–\-]\s*(Present|\d{4})\b/.test(line);

/** Split raw PDF blob into logical lines by detecting common delimiters */
function tokenizeContent(raw) {
  if (!raw) return [];

  // 1. Split on newlines first (keep real line-breaks)
  let lines = raw.split(/\r?\n/);

  // 2. For lines that are very long (>120 chars) with no real newlines,
  //    try to split them on known section keywords or bullet chars
  const sectionKeywords = [
    'PROFESSIONAL SUMMARY', 'WORK EXPERIENCE', 'EDUCATION', 'PROJECTS',
    'SKILLS', 'CERTIFICATIONS', 'ACHIEVEMENTS', 'CONTACT', 'OBJECTIVE',
    'EXPERIENCE', 'TECHNICAL SKILLS', 'LANGUAGES', 'INTERESTS', 'AWARDS',
    'SUMMARY', 'PROFILE', 'REFERENCES', 'VOLUNTEER', 'PUBLICATIONS',
  ];

  const expanded = [];
  for (const line of lines) {
    if (line.length > 120) {
      // Try to break before known section keywords
      let result = line;
      for (const kw of sectionKeywords) {
        result = result.replace(new RegExp(`(?<![A-Z])${kw}(?![a-z])`, 'g'), `\n${kw}`);
      }
      // Break on bullet-like characters
      result = result.replace(/([►•▪▸])/g, '\n$1');
      // Break before lines that look like month-year
      result = result.replace(
        /\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/g,
        '\n$&'
      );
      expanded.push(...result.split('\n'));
    } else {
      expanded.push(line);
    }
  }

  return expanded.map(l => l.trim()).filter(Boolean);
}

/** Classify each line */
function classifyLine(line) {
  const trimmed = line.trim();

  // Empty
  if (!trimmed) return { type: 'empty' };

  // Bullet variations
  if (/^[►•▪▸\-\*]\s+/.test(trimmed)) return { type: 'bullet', text: trimmed.replace(/^[►•▪▸\-\*]\s+/, '') };

  // Numbered list
  if (/^\d+[\.\)]\s+/.test(trimmed)) return { type: 'numbered', text: trimmed.replace(/^\d+[\.\)]\s+/, '') };

  // Pure section heading (all caps, short-ish)
  if (isSectionHeading(trimmed) && trimmed.length < 60) return { type: 'heading', text: trimmed };

  // Date/meta line (e.g. "Feb 2025 – May 2026 | Chennai, TN")
  if (isMetaLine(trimmed)) return { type: 'meta', text: trimmed };

  // Contact-style line (email | phone | linkedin)
  if (
    /[\|│]/.test(trimmed) &&
    (trimmed.includes('@') || /\+?\d[\d\s\-]{8,}/.test(trimmed) || /linkedin\.com/.test(trimmed))
  ) return { type: 'contact', text: trimmed };

  // Inline bold markers
  return { type: 'paragraph', text: trimmed };
}

/** Render inline bold/italic */
function inlineFormat(text) {
  if (!text) return text;
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith('**'))
      parts.push(<strong key={match.index} className="text-white font-semibold">{match[2]}</strong>);
    else
      parts.push(<em key={match.index} className="text-slate-200">{match[3]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

/** Parse pipe-separated contact info into chips */
function ContactLine({ text }) {
  const parts = text.split(/[\|│]/).map(p => p.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-2 my-3">
      {parts.map((part, i) => {
        let icon = null;
        if (part.includes('@')) icon = <Mail className="w-3 h-3" />;
        else if (/\+?\d[\d\s\-]{6,}/.test(part)) icon = <Phone className="w-3 h-3" />;
        else if (/linkedin\.com|github\.com|portfolio/i.test(part)) icon = <Globe className="w-3 h-3" />;
        else if (/[A-Z]{2,}$/.test(part) || /Chennai|Mumbai|Delhi|Bangalore/i.test(part)) icon = <MapPin className="w-3 h-3" />;

        return (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 bg-white/[0.04] border border-white/[0.07]"
          >
            {icon && <span className="text-slate-500">{icon}</span>}
            {part}
          </span>
        );
      })}
    </div>
  );
}

/** Main smart content renderer */
function SmartContent({ content }) {
  if (!content) return <p className="text-slate-600 italic text-sm">No content available.</p>;

  const lines = tokenizeContent(content);
  const elements = [];
  let bulletBuffer = [];
  let numberedBuffer = [];
  let paraBuffer = [];

  const flushBullets = (key) => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${key}`} className="space-y-2 my-2 ml-1">
        {bulletBuffer.map((b, j) => (
          <li key={j} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
            <ChevronRight className="w-3.5 h-3.5 text-primary-300/70 flex-shrink-0 mt-0.5" />
            <span>{inlineFormat(b)}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  const flushNumbered = (key) => {
    if (numberedBuffer.length === 0) return;
    elements.push(
      <ol key={`ol-${key}`} className="space-y-2 my-2 ml-1 list-decimal list-inside">
        {numberedBuffer.map((b, j) => (
          <li key={j} className="text-sm text-slate-300 leading-relaxed">
            {inlineFormat(b)}
          </li>
        ))}
      </ol>
    );
    numberedBuffer = [];
  };

  const flushParagraphs = (key) => {
    if (paraBuffer.length === 0) return;
    elements.push(
      <p key={`p-${key}`} className="text-sm text-slate-300 leading-7 my-1">
        {inlineFormat(paraBuffer.join(' '))}
      </p>
    );
    paraBuffer = [];
  };

  lines.forEach((line, i) => {
    const { type, text } = classifyLine(line);

    if (type === 'bullet') {
      flushParagraphs(i);
      flushNumbered(i);
      bulletBuffer.push(text);
      return;
    }

    if (type === 'numbered') {
      flushParagraphs(i);
      flushBullets(i);
      numberedBuffer.push(text);
      return;
    }

    // Anything non-bullet flushes bullet buffers
    flushBullets(i);
    flushNumbered(i);

    if (type === 'heading') {
      flushParagraphs(i);
      elements.push(
        <div key={`h-${i}`} className="mt-6 mb-3 first:mt-0">
          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-white/[0.06]" />
            <h4 className="text-[11px] font-bold text-primary-300/80 uppercase tracking-[0.15em] px-2">
              {text}
            </h4>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
        </div>
      );
      return;
    }

    if (type === 'meta') {
      flushParagraphs(i);
      elements.push(
        <p key={`meta-${i}`} className="text-xs text-slate-500 font-medium mt-1 mb-2 flex items-center gap-1.5">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          {text}
        </p>
      );
      return;
    }

    if (type === 'contact') {
      flushParagraphs(i);
      elements.push(<ContactLine key={`contact-${i}`} text={text} />);
      return;
    }

    if (type === 'paragraph') {
      paraBuffer.push(text);
      return;
    }

    // empty
    flushParagraphs(i);
  });

  // Flush any remaining buffers
  flushBullets('end');
  flushNumbered('end');
  flushParagraphs('end');

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function NoteDetail({ note, relatedNotes, onDelete, onEdit, onTogglePublic, onMoveToCollection, sharingLoading, collections }) {
  const navigate = useNavigate();
  if (!note) return null;

  const cfg = typeConfig[note.type] || typeConfig.text;
  const TypeIcon = cfg.icon;

  const collection = collections?.find(c => c.id === note.collectionId);

  const handleCopyShareLink = async () => {
    const url = `${window.location.origin}/share/${note.id}`;
    await navigator.clipboard.writeText(url).catch(() => {});
  };

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      {/* Back */}
      <button
        onClick={() => navigate('/notes')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Notes
      </button>

      <div className="rounded-2xl border border-white/[0.08] bg-surface-50/60 backdrop-blur-sm overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border mb-3 ${cfg.cls}`}>
                <TypeIcon className="w-3 h-3" />
                {cfg.label}
              </span>
              {collection && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border mb-3 ml-2 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: collection.color, background: collection.color + '18', borderColor: collection.color + '40' }}
                  onClick={onMoveToCollection}
                  title="Change collection"
                >
                  <FolderOpen className="w-3 h-3" />
                  {collection.icon} {collection.name}
                </span>
              )}
              <h1 className="text-2xl font-bold text-white leading-tight">{note.title}</h1>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(note.createdAt)}
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              {/* Move to collection */}
              {onMoveToCollection && (
                <button
                  onClick={onMoveToCollection}
                  title="Move to collection"
                  className="p-2.5 text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-all border border-transparent hover:border-yellow-500/20"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              )}
              {onTogglePublic && (
                <>
                  {note.isPublic && (
                    <button
                      onClick={handleCopyShareLink}
                      title="Copy share link"
                      className="p-2.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all border border-transparent hover:border-blue-500/20"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onTogglePublic}
                    disabled={sharingLoading}
                    title={note.isPublic ? 'Make private' : 'Share publicly'}
                    className={`p-2.5 rounded-xl transition-all border ${
                      note.isPublic
                        ? 'text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/15'
                        : 'text-slate-500 hover:text-green-400 hover:bg-green-500/10 border-transparent hover:border-green-500/20'
                    }`}
                  >
                    {sharingLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : note.isPublic
                        ? <Share2 className="w-4 h-4" />
                        : <Lock className="w-4 h-4" />
                    }
                  </button>
                </>
              )}
              <button
                onClick={onEdit}
                className="p-2.5 text-slate-500 hover:text-primary-300 hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
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
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 hover:underline mb-5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {note.sourceUrl}
            </a>
          )}

          {/* AI Summary */}
          {note.summary && (
            <div className="relative rounded-xl p-5 mb-6 bg-primary/5 border border-primary/15 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary-300" />
                <p className="text-xs font-semibold text-primary-300 uppercase tracking-wider">AI Summary</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{note.summary}</p>
            </div>
          )}

          {/* Tags */}
          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {note.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-primary/10 text-primary-300 text-xs rounded-full font-medium border border-primary/20">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/[0.06] mb-6" />

          {/* Content — smart formatted */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">Content</h3>
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
              <SmartContent content={note.content} />
            </div>
          </div>
        </div>
      </div>

      {/* Related Notes */}
      {relatedNotes?.length > 0 && (
        <div className="mt-10">
          <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-primary-700 inline-block" />
            Related Notes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedNotes.map(rn => <NoteCard key={rn.id} note={rn} />)}
          </div>
        </div>
      )}
    </div>
  );
}
