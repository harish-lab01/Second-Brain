import { useState, useCallback } from 'react';
import { getUserNotes, addNote, updateNote, deleteNote, updateNoteEmbedding } from '../services/firestore';
import { analyzeNote, findRelatedNotes, fetchUrlContent } from '../services/gemini';
import { getEmbedding, noteToEmbedText } from '../services/embeddings';
import { extractTextFromPDF } from '../utils/pdfParser';
import useStore from '../store/useStore';

export function useNotes(userId) {
  const { notes, setNotes } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserNotes(userId);
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, setNotes]);

  const createNote = useCallback(async ({ type, title, content, file, sourceUrl, collectionId }) => {
    setLoading(true);
    setError(null);
    try {
      let finalContent = content || '';
      let finalTitle = title;

      // Extract text from PDF locally
      if (type === 'pdf' && file) {
        finalContent = await extractTextFromPDF(file);
      }

      // Auto-fetch URL content if URL type and no manual content given
      if (type === 'url' && sourceUrl) {
        const fetched = await fetchUrlContent(sourceUrl);
        // Use fetched title if user didn't provide one
        if (fetched.title && (!title || title.trim() === '')) {
          finalTitle = fetched.title;
        }
        // Combine fetched content with any manual notes the user typed
        const manualNotes = content?.trim() ? `\n\nMy Notes:\n${content.trim()}` : '';
        const fetchedBody = fetched.content
          ? `Page Content:\n${fetched.content}`
          : fetched.description
            ? `Description: ${fetched.description}`
            : '';
        finalContent = (fetchedBody + manualNotes).trim() || content || '';
      }

      // AI analysis — never block saving if AI fails
      let analysis = { summary: '', tags: [] };
      let relatedNoteIds = [];
      try {
        analysis = await analyzeNote(finalContent || finalTitle);
        const otherNotes = notes.filter(n => n.id);
        relatedNoteIds = await findRelatedNotes({ title: finalTitle, tags: analysis.tags }, otherNotes);
      } catch (aiErr) {
        console.warn('AI analysis failed (note will still be saved):', aiErr.message);
      }

      const noteData = {
        title: finalTitle,
        content: finalContent,
        type,
        sourceUrl: sourceUrl || '',
        summary: analysis.summary,
        tags: analysis.tags,
        relatedNoteIds,
        ...(collectionId ? { collectionId } : {}),
      };

      const docRef = await addNote(userId, noteData);
      const newNoteId = docRef.id;

      // Generate and store embedding for semantic search (async, don't block)
      (async () => {
        try {
          const embedText = noteToEmbedText(noteData);
          const embedding = await getEmbedding(embedText);
          if (embedding) {
            await updateNoteEmbedding(newNoteId, Array.from(embedding));
          }
        } catch (embErr) {
          console.warn('Embedding generation failed (non-blocking):', embErr.message);
        }
      })();

      await fetchNotes();
      return newNoteId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, notes, fetchNotes]);

  const editNote = useCallback(async (noteId, updates, reAnalyze = false) => {
    setLoading(true);
    setError(null);
    try {
      let finalUpdates = { ...updates };

      // If content changed, re-run AI analysis
      if (reAnalyze && updates.content) {
        try {
          const analysis = await analyzeNote(updates.content);
          const otherNotes = notes.filter(n => n.id && n.id !== noteId);
          const relatedNoteIds = await findRelatedNotes(
            { title: updates.title || '', tags: analysis.tags },
            otherNotes
          );
          finalUpdates = { ...finalUpdates, summary: analysis.summary, tags: analysis.tags, relatedNoteIds };
        } catch (aiErr) {
          console.warn('AI re-analysis failed on edit:', aiErr.message);
        }
      }

      await updateNote(noteId, finalUpdates);

      // Re-generate embedding if content or title changed
      const needsReEmbed = finalUpdates.content || finalUpdates.title;
      if (needsReEmbed) {
        (async () => {
          try {
            const baseNote = notes.find(n => n.id === noteId) || {};
            const merged   = { ...baseNote, ...finalUpdates };
            const embedText = noteToEmbedText(merged);
            const embedding = await getEmbedding(embedText);
            if (embedding) {
              await updateNoteEmbedding(noteId, Array.from(embedding));
            }
          } catch (embErr) {
            console.warn('Embedding re-generation failed:', embErr.message);
          }
        })();
      }

      await fetchNotes();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notes, fetchNotes]);

  const removeNote = useCallback(async (noteId) => {
    setLoading(true);
    try {
      await deleteNote(noteId);
      await fetchNotes();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  /**
   * Generate embeddings for any notes that don't have one yet.
   * Call once from the Notes page when the user first enables semantic search.
   */
  const backfillEmbeddings = useCallback(async (onProgress) => {
    const missing = notes.filter(n => !n.embedding || n.embedding.length === 0);
    if (!missing.length) return 0;

    let done = 0;
    for (const note of missing) {
      try {
        const embedText = noteToEmbedText(note);
        const embedding = await getEmbedding(embedText);
        if (embedding) {
          await updateNoteEmbedding(note.id, Array.from(embedding));
          done++;
        }
      } catch (err) {
        console.warn(`Embedding backfill failed for ${note.id}:`, err.message);
      }
      onProgress?.(done, missing.length);
      // Small delay to avoid hammering the HF free tier
      await new Promise(r => setTimeout(r, 300));
    }
    await fetchNotes();
    return done;
  }, [notes, fetchNotes]);

  return { notes, loading, error, fetchNotes, createNote, editNote, removeNote, backfillEmbeddings };
}
