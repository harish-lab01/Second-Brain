import { useState, useCallback } from 'react';
import { getUserNotes, addNote, updateNote, deleteNote } from '../services/firestore';
import { analyzeNote, findRelatedNotes } from '../services/gemini';
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

  const createNote = useCallback(async ({ type, title, content, file, sourceUrl }) => {
    setLoading(true);
    setError(null);
    try {
      let finalContent = content || '';

      // Extract text locally — no upload to Storage
      if (type === 'pdf' && file) {
        finalContent = await extractTextFromPDF(file);
      }

      // AI analysis — never block saving if Gemini fails
      let analysis = { summary: '', tags: [] };
      let relatedNoteIds = [];
      try {
        analysis = await analyzeNote(finalContent);
        const otherNotes = notes.filter(n => n.id);
        relatedNoteIds = await findRelatedNotes({ title, tags: analysis.tags }, otherNotes);
      } catch (aiErr) {
        console.warn('AI analysis failed (note will still be saved):', aiErr.message);
      }

      const noteData = {
        title,
        content: finalContent,
        type,
        sourceUrl: sourceUrl || '',
        summary: analysis.summary,
        tags: analysis.tags,
        relatedNoteIds,
      };

      const docRef = await addNote(userId, noteData);
      await fetchNotes();
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, notes, fetchNotes]);

  const editNote = useCallback(async (noteId, updates) => {
    setLoading(true);
    try {
      await updateNote(noteId, updates);
      await fetchNotes();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

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

  return { notes, loading, error, fetchNotes, createNote, editNote, removeNote };
}
