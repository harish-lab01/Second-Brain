import { useState, useCallback, useRef } from 'react';
import { chatWithNotes } from '../services/gemini';
import { saveChat, getUserChats } from '../services/firestore';
import { hybridSearch, isSemanticSearchAvailable } from '../services/embeddings';
import useStore from '../store/useStore';

export function useChat(userId) {
  const { notes } = useStore();
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track the current session's Firestore doc ID to avoid creating duplicates
  const currentChatIdRef = useRef(null);

  const fetchChats = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getUserChats(userId);
      setChatHistory(data);
    } catch (err) {
      setError(err.message);
    }
  }, [userId]);

  const loadChat = useCallback((chat) => {
    currentChatIdRef.current = chat.id;
    setMessages(chat.messages || []);
  }, []);

  const startNewChat = useCallback(() => {
    currentChatIdRef.current = null;
    setMessages([]);
  }, []);

  const findRelevantNotes = useCallback(async (query) => {
    if (!notes.length) return [];

    // Use hybrid semantic+keyword search when HF key is available,
    // fall back to pure keyword otherwise
    if (isSemanticSearchAvailable()) {
      const results = await hybridSearch(query, notes, 4);
      if (results.length > 0) return results;
    }

    // Pure keyword fallback
    const q = query.toLowerCase();
    const stopWords = new Set([
      'the','a','an','is','are','was','were','be','been','being',
      'have','has','had','do','does','did','will','would','could','should','may','might',
      'shall','can','need','dare','used','ought','about','from','with','tell','me','my',
      'what','who','where','when','how','why','i','in','on','at','to','of','and','or',
      'for','not','but','by','up','out','so','if','as','into','than','then','that','this']);
    const words = q.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

    const scored = notes.map(note => {
      const tl = note.title?.toLowerCase()   || '';
      const cl = note.content?.toLowerCase() || '';
      const sl = note.summary?.toLowerCase() || '';
      const gl = note.tags?.map(t => t.toLowerCase()).join(' ') || '';
      let score = 0;
      if (tl.includes(q)) score += 10;
      if (gl.includes(q)) score += 8;
      if (sl.includes(q)) score += 5;
      if (cl.includes(q)) score += 4;
      words.forEach(w => {
        if (tl.includes(w)) score += 6;
        if (gl.includes(w)) score += 4;
        if (sl.includes(w)) score += 3;
        if (cl.includes(w)) score += 2;
      });
      return { note, score };
    });

    return scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ note }) => note);
  }, [notes]);

  const sendMessage = useCallback(async (userMessage) => {
    const userMsg = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);
    setError(null);

    try {
      const relevantNotes = await findRelevantNotes(userMessage);
      const reply = await chatWithNotes(userMessage, relevantNotes, updatedMessages);
      const assistantMsg = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      // Save/update — upsert using the existing session ID to avoid duplicate docs
      if (finalMessages.length >= 2) {
        const savedId = await saveChat(userId, finalMessages, currentChatIdRef.current);
        if (!currentChatIdRef.current) {
          currentChatIdRef.current = savedId;
        }
        await fetchChats();
      }
    } catch (err) {
      setError(err.message);
      const errMsg = {
        role: 'assistant',
        content: err.message?.includes('401') || err.message?.includes('403') || err.message?.includes('UNAUTHENTICATED')
          ? '⚠️ API key is invalid or expired. Please update VITE_GROQ_API_KEY in your .env file.'
          : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages, userId, findRelevantNotes, fetchChats]);

  return {
    messages,
    chatHistory,
    loading,
    error,
    sendMessage,
    fetchChats,
    loadChat,
    startNewChat,
    currentChatId: currentChatIdRef.current,
  };
}
