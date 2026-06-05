import { useEffect, useState, useRef } from 'react';
import { Plus, Search, Sparkles, X, Loader2, Brain, SlidersHorizontal, Zap, Upload, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import NoteCard from '../components/notes/NoteCard';
import NoteList from '../components/notes/NoteList';
import AddNoteModal from '../components/notes/AddNoteModal';
import ImportModal from '../components/notes/ImportModal';
import NoteConnectionsBanner from '../components/notes/NoteConnectionsBanner';
import TagChip from '../components/ui/TagChip';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { getAllTags } from '../utils/helpers';
import { hybridSearch, isSemanticSearchAvailable } from '../services/embeddings';
import useStore from '../store/useStore';

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Relevance badge ───────────────────────────────────────────────────────────
function RelevanceBadge({ score }) {
  if (!score || score < 0.25) return null;
  const pct = Math.round(score * 100);
  const color =
    score >= 0.75 ? 'text-green-400 bg-green-500/10 border-green-500/20' :
    score >= 0.50 ? 'text-primary-300 bg-primary/10 border-primary/20' :
                   'text-slate-400 bg-white/[0.04] border-white/[0.08]';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${color}`}>
      <Sparkles className="w-2 h-2" />
      {pct}% match
    </span>
  );
}

// ── Semantic note card wrapper ─────────────────────────────────────────────────
function SemanticNoteCard({ note }) {
  return (
    <div className="relative">
      <NoteCard note={note} />
      {note._semanticScore > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <RelevanceBadge score={note._semanticScore} />
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Notes() {
  const { user } = useAuth();
  // real-time subscription via useNotes — no manual fetchNotes needed
  const { notes, loading, backfillEmbeddings, hasMore, loadingMore, loadMore } = useNotes(user?.uid);
  const showToast = useStore(s => s.showToast);

  const [showModal, setShowModal]           = useState(false);
  const [showImport, setShowImport]         = useState(false);
  const [lastSavedNote, setLastSavedNote]   = useState(null);
  const prevNotesLenRef                     = useRef(0);
  const [search, setSearch]                 = useState('');
  const [activeTag, setActiveTag]           = useState('All');
  const [semanticMode, setSemanticMode]     = useState(isSemanticSearchAvailable());
  const [semanticResults, setSemanticResults] = useState(null);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [backfilling, setBackfilling]       = useState(false);
  const [backfillProgress, setBackfillProgress] = useState({ done: 0, total: 0 });
  const [filterOpen, setFilterOpen]         = useState(false);
  const [typeFilter, setTypeFilter]         = useState('all');
  const [sortBy, setSortBy]                 = useState('newest');

  const debouncedSearch = useDebounce(search, 420);
  const abortRef        = useRef(null);

  // Watch for new notes added via real-time subscription
  useEffect(() => {
    const prev = prevNotesLenRef.current;
    if (notes.length > prev && prev > 0) {
      setLastSavedNote(notes[0]);
    }
    prevNotesLenRef.current = notes.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes.length]); // only track length change, not full array reference

  // Semantic search
  useEffect(() => {
    if (!debouncedSearch.trim() || !semanticMode) {
      setSemanticResults(null);
      return;
    }
    abortRef.current = {};
    const token = abortRef.current;
    setSemanticLoading(true);
    hybridSearch(debouncedSearch, notes, 20)
      .then(results => {
        if (token !== abortRef.current) return;
        setSemanticResults(results);
      })
      .catch(() => setSemanticResults(null))
      .finally(() => { if (token === abortRef.current) setSemanticLoading(false); });
  }, [debouncedSearch, semanticMode, notes]);

  const handleBackfill = async () => {
    const missing = notes.filter(n => !n.embedding || n.embedding.length === 0);
    if (!missing.length) { showToast('All notes already have embeddings!'); return; }
    setBackfilling(true);
    setBackfillProgress({ done: 0, total: missing.length });
    try {
      const done = await backfillEmbeddings((d, t) => setBackfillProgress({ done: d, total: t }));
      showToast(`Generated embeddings for ${done} note${done !== 1 ? 's' : ''}.`);
    } catch {
      showToast('Backfill failed. Check your HF API key.', 'error');
    } finally {
      setBackfilling(false);
      setBackfillProgress({ done: 0, total: 0 });
    }
  };

  const allTags = ['All', ...getAllTags(notes)];

  // Derive display list
  // If semantic search returned an empty array AND we're searching, fall back to keyword
  let displayNotes = (() => {
    if (semanticResults !== null && semanticMode) {
      if (semanticResults.length > 0) return semanticResults;
      // Semantic returned nothing — fall back to keyword filter so user sees something
      const q = debouncedSearch.toLowerCase();
      return notes.filter(n =>
        n.title?.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q)) ||
        n.summary?.toLowerCase().includes(q)
      );
    }
    return notes;
  })();

  if (activeTag !== 'All') displayNotes = displayNotes.filter(n => n.tags?.includes(activeTag));
  if (typeFilter !== 'all') displayNotes = displayNotes.filter(n => n.type === typeFilter);

  if (search.trim() && (semanticResults === null || !semanticMode)) {
    const q = search.toLowerCase();
    displayNotes = displayNotes.filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.tags?.some(t => t.toLowerCase().includes(q)) ||
      n.summary?.toLowerCase().includes(q)
    );
  }

  if (sortBy === 'newest') {
    displayNotes = [...displayNotes].sort((a, b) => {
      const ta = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const tb = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return tb - ta;
    });
  } else if (sortBy === 'oldest') {
    displayNotes = [...displayNotes].sort((a, b) => {
      const ta = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const tb = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return ta - tb;
    });
  } else if (sortBy === 'title') {
    displayNotes = [...displayNotes].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  const missingEmbeddingCount = notes.filter(n => !n.embedding || n.embedding.length === 0).length;
  const hasSemanticKey = isSemanticSearchAvailable();
  const isSearching    = search.trim().length > 0;
  // True only when semantic ran and returned genuine semantic hits (not keyword fallback)
  const showingSemanticHits = semanticResults !== null && semanticMode && semanticResults.length > 0;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Search bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          {semanticLoading
            ? <Loader2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary-300 animate-spin" />
            : <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          }
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={semanticMode ? 'Semantic search — ask anything…' : 'Search by title or tag…'}
            className="w-full pl-11 pr-10 py-3 rounded-xl text-sm text-slate-200 placeholder:text-slate-600
              bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/35 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hasSemanticKey && (
          <button
            onClick={() => { setSemanticMode(v => !v); setSemanticResults(null); }}
            title={semanticMode ? 'AI search ON' : 'Enable AI search'}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              semanticMode
                ? 'bg-primary/15 border-primary/30 text-primary-300 shadow-glow-sm'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI</span>
          </button>
        )}

        <button
          onClick={() => setFilterOpen(v => !v)}
          className={`p-3 rounded-xl border transition-all ${
            filterOpen || typeFilter !== 'all' || sortBy !== 'newest'
              ? 'bg-primary/15 border-primary/30 text-primary-300'
              : 'border-white/[0.08] bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.07]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="flex flex-wrap gap-4 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] animate-slide-up">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Type</p>
            <div className="flex gap-1.5">
              {['all','text','pdf','url'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    typeFilter === t ? 'bg-primary/15 text-primary-300 border-primary/30' : 'bg-white/[0.03] text-slate-500 border-white/[0.07] hover:text-slate-300'
                  }`}>{t.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sort</p>
            <div className="flex gap-1.5">
              {[['newest','Newest'],['oldest','Oldest'],['title','Title A-Z']].map(([val, label]) => (
                <button key={val} onClick={() => setSortBy(val)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    sortBy === val ? 'bg-primary/15 text-primary-300 border-primary/30' : 'bg-white/[0.03] text-slate-500 border-white/[0.07] hover:text-slate-300'
                  }`}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Embedding backfill banner */}
      {semanticMode && hasSemanticKey && !isSearching && missingEmbeddingCount > 0 && !loading && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Brain className="w-4 h-4 text-primary-300 flex-shrink-0" />
            <p className="text-xs text-slate-400">
              <span className="text-slate-300 font-medium">{missingEmbeddingCount} note{missingEmbeddingCount !== 1 ? 's' : ''}</span>
              {missingEmbeddingCount === notes.length ? ' need embeddings for semantic search.' : " don't have embeddings yet."}
            </p>
          </div>
          {backfilling ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-primary-300 animate-spin" />
              <span className="text-xs text-primary-300">{backfillProgress.done}/{backfillProgress.total}</span>
            </div>
          ) : (
            <button onClick={handleBackfill}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/25 text-primary-300 text-xs font-semibold hover:bg-primary/20 transition-all">
              <Zap className="w-3 h-3" /> Generate Now
            </button>
          )}
        </div>
      )}

      {/* No HF key notice */}
      {!hasSemanticKey && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
          <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            Add <code className="text-yellow-300 bg-yellow-500/10 px-1 rounded">VITE_HF_API_KEY</code> to enable AI semantic search.{' '}
            <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">Get a free key →</a>
          </p>
        </div>
      )}

      {/* Semantic search indicator */}
      {semanticMode && isSearching && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary-300">
            <Sparkles className="w-2.5 h-2.5" />
            {semanticLoading ? 'Searching…' : showingSemanticHits ? 'AI Semantic Search' : 'Keyword fallback'}
          </div>
        </div>
      )}

      {/* Tag filters */}
      {allTags.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allTags.map(tag => (
            <TagChip key={tag} tag={tag} active={activeTag === tag} onClick={() => setActiveTag(tag)} />
          ))}
        </div>
      )}

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-slate-600 font-medium">
          {displayNotes.length} {displayNotes.length === 1 ? 'note' : 'notes'}
          {isSearching ? (showingSemanticHits ? ' matched semantically' : ' found') : ' total'}
        </p>
      )}

      {/* Notes grid */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : showingSemanticHits ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayNotes.map(note => <SemanticNoteCard key={note.id} note={note} />)}
        </div>
      ) : (
        <NoteList notes={displayNotes} onAddNote={() => setShowModal(true)} />
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button onClick={loadMore} disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-all disabled:opacity-50">
            {loadingMore
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
              : <><ChevronDown className="w-4 h-4" /> Load more notes</>
            }
          </button>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-primary-700 text-white rounded-full shadow-glow hover:shadow-glow transition-all hover:scale-105 active:scale-95 flex items-center justify-center z-40"
        title="Add note">
        <Plus className="w-6 h-6" />
      </button>

      {/* Import button */}
      <button onClick={() => setShowImport(true)}
        className="fixed bottom-8 right-28 flex items-center gap-2 px-4 py-3.5 bg-surface-100/90 border border-white/[0.1] text-slate-400 hover:text-slate-200 hover:border-white/[0.2] rounded-full text-sm font-medium shadow-card backdrop-blur-xl transition-all hover:scale-105 active:scale-95 z-40"
        title="Import from Notion / Obsidian">
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">Import</span>
      </button>

      {showModal && <AddNoteModal userId={user?.uid} onClose={() => setShowModal(false)} />}
      {showImport && <ImportModal userId={user?.uid} onClose={() => setShowImport(false)} />}

      {lastSavedNote && (
        <NoteConnectionsBanner
          newNote={lastSavedNote}
          allNotes={notes.filter(n => n.id !== lastSavedNote.id)}
          onClose={() => setLastSavedNote(null)}
        />
      )}
    </div>
  );
}
