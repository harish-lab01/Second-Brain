import { useState, useCallback, useEffect, useRef } from 'react';
import {
  addNote, updateNote, deleteNote, updateNoteEmbedding,
  subscribeToNotes,
} from '../services/firestore';
import { analyzeNote, findRelatedNotes, fetchUrlContent } from '../services/gemini';
import { getEmbedding, noteToEmbedText } from '../services/embeddings';
import { checkLimit, consumeLimit } from './useRateLimit';
import { extractTextFromPDF } from '../utils/pdfParser';
import useStore from '../store/useStore';

const PAGE_SIZE = 20;
const ANALYZE_LIMIT  = 60;
const ANALYZE_WINDOW = 60 * 60 * 1000;
const ANALYZE_KEY    = 'analyze';

// ── Singleton subscription tracker ───────────────────────────────────────────
// Ensures only ONE Firestore listener exists at a time, shared across all
// components that call useNotes(). Prevents duplicate reads and race conditions.
let _activeUserId    = null;
let _unsubscribe     = null;
let _subscriberCount = 0;

function acquireSubscription(userId, pageSize, setNotes, setLoading, setError, setHasMore, lastDocRef) {
  _subscriberCount++;
  if (_activeUserId === userId && _unsubscribe) {
    // Already subscribed for this user — reuse existing listener
    return;
  }
  // Tear down stale subscription
  if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
  _activeUserId = userId;
  setLoading(true);
  lastDocRef.current = null;
  _unsubscribe = subscribeToNotes(userId, pageSize, null, (data, lastDoc, more) => {
    setNotes(data);
    lastDocRef.current = lastDoc;
    setHasMore(more);
    setLoading(false);
  }, (err) => {
    setError(err.message);
    setLoading(false);
  });
}

function releaseSubscription() {
  _subscriberCount--;
  if (_subscriberCount <= 0) {
    _subscriberCount = 0;
    _unsubscribe?.();
    _unsubscribe  = null;
    _activeUserId = null;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useNotes(userId) {
  const { notes, setNotes, showToast } = useStore();
  const [loading, setLoading]          = useState(false);
  const [error, setError]              = useState(null);
  const [hasMore, setHasMore]          = useState(false);
  const [loadingMore, setLoadingMore]  = useState(false);
  const lastDocRef                     = useRef(null);

  // Subscribe on mount via singleton, release on unmount
  useEffect(() => {
    if (!userId) return;
    acquireSubscription(userId, PAGE_SIZE, setNotes, setLoading, setError, setHasMore, lastDocRef);
    return releaseSubscription;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Manual re-subscribe (e.g. after publish toggle) — tears down and re-creates
  const fetchNotes = useCallback(() => {
    if (!userId) return;
    _unsubscribe?.();
    _unsubscribe  = null;
    _activeUserId = null;
    acquireSubscription(userId, PAGE_SIZE, setNotes, setLoading, setError, setHasMore, lastDocRef);
  }, [userId, setNotes]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!userId || !hasMore || loadingMore || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const cursor = lastDocRef.current;
      const unsub = subscribeToNotes(userId, PAGE_SIZE, cursor, (data, lastDoc, more) => {
        setNotes(prev => {
          const ids   = new Set(prev.map(n => n.id));
          const fresh = data.filter(n => !ids.has(n.id));
          return [...prev, ...fresh];
        });
        lastDocRef.current = lastDoc;
        setHasMore(more);
        setLoadingMore(false);
        // Replace singleton with this paginated listener
        _unsubscribe?.();
        _unsubscribe = unsub;
      }, (err) => {
        setError(err.message);
        setLoadingMore(false);
      });
    } catch (err) {
      setError(err.message);
      setLoadingMore(false);
    }
  }, [userId, hasMore, loadingMore, setNotes]);

  // Create
  const createNote = useCallback(async ({ type, title, content, file, sourceUrl, collectionId }) => {
    setError(null);
    try {
      let finalContent = content || '';
      let finalTitle   = title;

      if (type === 'pdf' && file) {
        finalContent = await extractTextFromPDF(file);
      }

      if (type === 'url' && sourceUrl) {
        const fetched = await fetchUrlContent(sourceUrl);
        if (fetched.title && (!title || title.trim() === '')) finalTitle = fetched.title;
        const manualNotes  = content?.trim() ? `\n\nMy Notes:\n${content.trim()}` : '';
        const fetchedBody  = fetched.content
          ? `Page Content:\n${fetched.content}`
          : fetched.description ? `Description: ${fetched.description}` : '';
        finalContent = (fetchedBody + manualNotes).trim() || content || '';
      }

      let analysis       = { summary: '', tags: [] };
      let relatedNoteIds = [];
      let aiWarning      = null;
      try {
        if (checkLimit(ANALYZE_KEY, ANALYZE_LIMIT, ANALYZE_WINDOW)) {
          consumeLimit(ANALYZE_KEY, ANALYZE_WINDOW);
          analysis = await analyzeNote(finalContent || finalTitle);
          const otherNotes = notes.filter(n => n.id);
          relatedNoteIds   = await findRelatedNotes({ title: finalTitle, tags: analysis.tags }, otherNotes);
        } else {
          aiWarning = 'AI analysis limit reached for this hour. Note saved without summary.';
        }
      } catch {
        aiWarning = 'AI analysis failed — note saved without summary.';
      }
      if (aiWarning) showToast(aiWarning, 'error');

      const noteData = {
        title: finalTitle, content: finalContent, type,
        sourceUrl: sourceUrl || '',
        summary: analysis.summary, tags: analysis.tags, relatedNoteIds,
        ...(collectionId ? { collectionId } : {}),
      };

      const docRef    = await addNote(userId, noteData);
      const newNoteId = docRef.id;

      // Non-blocking embedding
      (async () => {
        try {
          const embedding = await getEmbedding(noteToEmbedText(noteData));
          if (embedding) await updateNoteEmbedding(newNoteId, Array.from(embedding));
        } catch (e) { console.warn('Embedding skipped:', e.message); }
      })();

      return newNoteId;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, notes]);

  // Edit
  const editNote = useCallback(async (noteId, updates, reAnalyze = false) => {
    setError(null);
    try {
      let finalUpdates = { ...updates };

      if (reAnalyze && updates.content) {
        try {
          const analysis   = await analyzeNote(updates.content);
          const otherNotes = notes.filter(n => n.id && n.id !== noteId);
          const related    = await findRelatedNotes({ title: updates.title || '', tags: analysis.tags }, otherNotes);
          finalUpdates     = { ...finalUpdates, summary: analysis.summary, tags: analysis.tags, relatedNoteIds: related };
        } catch {
          showToast('AI re-analysis failed — other changes saved.', 'error');
        }
      }

      await updateNote(noteId, finalUpdates);

      if (finalUpdates.content || finalUpdates.title) {
        (async () => {
          try {
            const base      = notes.find(n => n.id === noteId) || {};
            const merged    = { ...base, ...finalUpdates };
            const embedding = await getEmbedding(noteToEmbedText(merged));
            if (embedding) await updateNoteEmbedding(noteId, Array.from(embedding));
          } catch (e) { console.warn('Re-embed skipped:', e.message); }
        })();
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  // Delete
  const removeNote = useCallback(async (noteId) => {
    try {
      await deleteNote(noteId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Backfill embeddings
  const backfillEmbeddings = useCallback(async (onProgress) => {
    const missing = notes.filter(n => !n.embedding || n.embedding.length === 0);
    if (!missing.length) return 0;
    let done = 0;
    for (const note of missing) {
      try {
        const embedding = await getEmbedding(noteToEmbedText(note));
        if (embedding) { await updateNoteEmbedding(note.id, Array.from(embedding)); done++; }
      } catch (e) { console.warn(`Backfill skip ${note.id}:`, e.message); }
      onProgress?.(done, missing.length);
      await new Promise(r => setTimeout(r, 300));
    }
    return done;
  }, [notes]);

  return {
    notes, loading, error, hasMore, loadingMore,
    fetchNotes, loadMore, createNote, editNote, removeNote, backfillEmbeddings,
  };
}
