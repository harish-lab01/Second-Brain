import { useState, useCallback } from 'react';
import { chatWithNotes } from '../services/gemini';
import { saveChat, getUserChats } from '../services/firestore';
import useStore from '../store/useStore';

export function useChat(userId) {
  const { notes } = useStore();
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setMessages(chat.messages || []);
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
  }, []);

  const findRelevantNotes = useCallback((query) => {
    if (!notes.length) return [];

    const q = query.toLowerCase();
    // Split into individual words, filter out common stop words
    const stopWords = new Set(['the','a','an','is','are','was','were','be','been','being',
      'have','has','had','do','does','did','will','would','could','should','may','might',
      'shall','can','need','dare','used','ought','about','from','with','tell','me','my',
      'what','who','where','when','how','why','i','in','on','at','to','of','and','or',
      'for','not','but','by','up','out','so','if','as','into','than','then','that','this']);
    const words = q.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

    const scored = notes.map(note => {
      const titleLower   = note.title?.toLowerCase()   || '';
      const contentLower = note.content?.toLowerCase() || '';
      const summaryLower = note.summary?.toLowerCase() || '';
      const tagsLower    = note.tags?.map(t => t.toLowerCase()).join(' ') || '';
      const typeLower    = note.type?.toLowerCase() || '';

      let score = 0;

      // Full query match (highest weight)
      if (titleLower.includes(q))   score += 10;
      if (tagsLower.includes(q))    score += 8;
      if (summaryLower.includes(q)) score += 5;
      if (contentLower.includes(q)) score += 4;

      // Individual word matches
      words.forEach(word => {
        if (titleLower.includes(word))   score += 6;
        if (tagsLower.includes(word))    score += 4;
        if (summaryLower.includes(word)) score += 3;
        if (contentLower.includes(word)) score += 2;
        if (typeLower.includes(word))    score += 3; // matches 'pdf', 'url', 'text'
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
      const relevantNotes = findRelevantNotes(userMessage);
      const reply = await chatWithNotes(userMessage, relevantNotes, updatedMessages);
      const assistantMsg = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      // Auto-save after first exchange
      if (finalMessages.length >= 2) {
        await saveChat(userId, finalMessages);
        await fetchChats();
      }
    } catch (err) {
      setError(err.message);
      const errMsg = {
        role: 'assistant',
        content: err.message?.includes('401') || err.message?.includes('403') || err.message?.includes('UNAUTHENTICATED')
          ? '⚠️ Gemini API key is invalid or expired. Please update VITE_GEMINI_API_KEY in your .env file with a valid AIzaSy... key from https://aistudio.google.com/app/apikey'
          : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages, userId, findRelevantNotes, fetchChats]);

  return { messages, chatHistory, loading, error, sendMessage, fetchChats, loadChat, startNewChat };
}
