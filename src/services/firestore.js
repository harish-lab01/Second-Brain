import { db } from './firebase';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, getDocs,
  serverTimestamp, getDoc
} from 'firebase/firestore';

// NOTES
export async function addNote(userId, noteData) {
  return await addDoc(collection(db, 'notes'), {
    ...noteData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateNote(noteId, updates) {
  await updateDoc(doc(db, 'notes', noteId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(noteId) {
  await deleteDoc(doc(db, 'notes', noteId));
}

export async function getUserNotes(userId) {
  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// CHATS
export async function saveChat(userId, messages, existingChatId = null) {
  // If a chat session already exists, update it in-place instead of creating a new doc
  if (existingChatId) {
    await updateDoc(doc(db, 'chats', existingChatId), {
      messages,
      updatedAt: serverTimestamp(),
    });
    return existingChatId;
  }
  // First message pair — create a new document
  const ref = await addDoc(collection(db, 'chats'), {
    userId,
    title: messages[0]?.content?.slice(0, 60) || 'New chat',
    messages,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserChats(userId) {
  const q = query(
    collection(db, 'chats'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// PUBLIC SHARING
export async function publishNote(noteId, userId) {
  await updateDoc(doc(db, 'notes', noteId), {
    isPublic: true,
    publishedAt: serverTimestamp(),
    userId, // keep for security rules
  });
}

export async function unpublishNote(noteId) {
  await updateDoc(doc(db, 'notes', noteId), {
    isPublic: false,
    publishedAt: null,
  });
}

export async function getPublicNote(noteId) {
  const snap = await getDoc(doc(db, 'notes', noteId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data.isPublic) return null;
  return { id: snap.id, ...data };
}

// SPACED REPETITION
export async function saveReviewLog(userId, noteId, rating, nextReview, interval, repetitions, easeFactor) {
  return await addDoc(collection(db, 'reviews'), {
    userId,
    noteId,
    rating,
    nextReview,
    interval,
    repetitions,
    easeFactor,
    reviewedAt: serverTimestamp(),
  });
}

export async function getUserReviews(userId) {
  const q = query(
    collection(db, 'reviews'),
    where('userId', '==', userId),
    orderBy('reviewedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// NOTE EMBEDDINGS (for semantic search — stored as subcollection field)
export async function updateNoteEmbedding(noteId, embedding) {
  await updateDoc(doc(db, 'notes', noteId), { embedding });
}

// ── COLLECTIONS (Notebooks) ───────────────────────────────────────────────────

export async function createCollection(userId, { name, color, icon }) {
  return await addDoc(collection(db, 'collections'), {
    userId,
    name,
    color: color || '#6C63FF',
    icon: icon || '📁',
    noteCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCollection(collectionId, updates) {
  await updateDoc(doc(db, 'collections', collectionId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCollection(collectionId) {
  await deleteDoc(doc(db, 'collections', collectionId));
}

export async function getUserCollections(userId) {
  const q = query(
    collection(db, 'collections'),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addNoteToCollection(noteId, collectionId) {
  await updateDoc(doc(db, 'notes', noteId), {
    collectionId,
    updatedAt: serverTimestamp(),
  });
}

export async function removeNoteFromCollection(noteId) {
  await updateDoc(doc(db, 'notes', noteId), {
    collectionId: null,
    updatedAt: serverTimestamp(),
  });
}

export async function getNotesByCollection(userId, collectionId) {
  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    where('collectionId', '==', collectionId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
