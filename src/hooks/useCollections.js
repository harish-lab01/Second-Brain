import { useState, useCallback } from 'react';
import {
  getUserCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addNoteToCollection,
  removeNoteFromCollection,
} from '../services/firestore';
import useStore from '../store/useStore';

export function useCollections(userId) {
  const { collections, setCollections } = useStore();
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  const fetchCollections = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserCollections(userId);
      setCollections(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, setCollections]);

  const addCollection = useCallback(async ({ name, color, icon }) => {
    setLoading(true);
    try {
      await createCollection(userId, { name, color, icon });
      await fetchCollections();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, fetchCollections]);

  const editCollection = useCallback(async (id, updates) => {
    try {
      await updateCollection(id, updates);
      await fetchCollections();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchCollections]);

  const removeCollection = useCallback(async (id) => {
    setLoading(true);
    try {
      await deleteCollection(id);
      await fetchCollections();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCollections]);

  const assignNote = useCallback(async (noteId, collectionId) => {
    try {
      if (collectionId) {
        await addNoteToCollection(noteId, collectionId);
      } else {
        await removeNoteFromCollection(noteId);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    collections,
    loading,
    error,
    fetchCollections,
    addCollection,
    editCollection,
    removeCollection,
    assignNote,
  };
}
