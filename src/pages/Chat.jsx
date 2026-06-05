import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Clock, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import { useChat } from '../hooks/useChat';
import ChatPanel from '../components/chat/ChatPanel';
import useStore from '../store/useStore';
import { formatDate } from '../utils/helpers';

export default function Chat() {
  const { user } = useAuth();
  useNotes(user?.uid); // ensure notes are in store for context retrieval
  const {
    messages, chatHistory, loading,
    sendMessage, fetchChats, loadChat, startNewChat, removeChatFromHistory,
  } = useChat(user?.uid);
  const showToast = useStore(s => s.showToast);

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [historyLoading, setHistoryLoading]  = useState(true);
  const [deletingId, setDeletingId]          = useState(null);

  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    fetchChats().finally(() => setHistoryLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // fetchChats is stable — omit to avoid re-subscribe loop

  const handleLoadChat = (chat) => {
    setSelectedChatId(chat.id);
    loadChat(chat);
  };

  const handleNewChat = () => {
    setSelectedChatId(null);
    startNewChat();
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    setDeletingId(chatId);
    try {
      await removeChatFromHistory(chatId);
      if (selectedChatId === chatId) setSelectedChatId(null);
    } catch {
      showToast('Failed to delete chat.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-white/[0.07] animate-fade-in"
      style={{ background: 'rgba(19,19,26,0.7)', backdropFilter: 'blur(20px)' }}>

      {/* Sidebar */}
      <div className="w-60 border-r border-white/[0.06] flex flex-col bg-surface-100/50">
        <div className="p-3 border-b border-white/[0.06]">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4
              bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-medium
              hover:from-primary-600 hover:to-primary-800 transition-all shadow-glow-sm"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {historyLoading ? (
            // Loading skeleton for chat history
            <div className="space-y-1.5 px-1 pt-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl px-3 py-2.5 animate-pulse">
                  <div className="h-2.5 bg-white/[0.06] rounded w-4/5 mb-1.5" />
                  <div className="h-2 bg-white/[0.04] rounded w-2/5" />
                </div>
              ))}
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Clock className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">Chat history will appear here.</p>
            </div>
          ) : (
            chatHistory.map(chat => (
              <div
                key={chat.id}
                className={`group relative flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  selectedChatId === chat.id
                    ? 'bg-primary/15 text-primary-300 border border-primary/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                }`}
                onClick={() => handleLoadChat(chat)}
              >
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-xs">{chat.title}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{formatDate(chat.createdAt)}</p>
                </div>
                {/* Delete button — appears on hover */}
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  disabled={deletingId === chat.id}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600
                    hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                  title="Delete chat"
                >
                  {deletingId === chat.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Trash2 className="w-3 h-3" />
                  }
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col">
        <ChatPanel messages={messages} loading={loading} onSend={sendMessage} />
      </div>
    </div>
  );
}
