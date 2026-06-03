import { db } from './firebase';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, getDocs,
  serverTimestamp
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
export async function saveChat(userId, messages) {
  return await addDoc(collection(db, 'chats'), {
    userId,
    title: messages[0]?.content?.slice(0, 50) || 'New chat',
    messages,
    createdAt: serverTimestamp(),
  });
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
