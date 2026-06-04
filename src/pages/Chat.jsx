import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import { useChat } from '../hooks/useChat';
import ChatPanel from '../components/chat/ChatPanel';
import { formatDate } from '../utils/helpers';

export default function Chat() {
  const { user } = useAuth();
  const { fetchNotes } = useNotes(user?.uid);
  const { messages, chatHistory, loading, sendMessage, fetchChats, loadChat, startNewChat } = useChat(user?.uid);
  const [selectedChatId, setSelectedChatId] = useState(null);

  useEffect(() => {
    if (user) { fetchNotes(); fetchChats(); }
  }, [user]);

  const handleLoadChat = (chat) => {
    setSelectedChatId(chat.id);
    loadChat(chat);
  };

  const handleNewChat = () => {
    setSelectedChatId(null);
    startNewChat();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-white/[0.07] animate-fade-in"
      style={{ background: 'rgba(19,19,26,0.7)', backdropFilter: 'blur(20px)' }}>

      {/* Chat history sidebar */}
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
          {chatHistory.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Clock className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">
                Your chat history will appear here.
              </p>
            </div>
          ) : (
            chatHistory.map(chat => (
              <button
                key={chat.id}
                onClick={() => handleLoadChat(chat)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  selectedChatId === chat.id
                    ? 'bg-primary/15 text-primary-300 border border-primary/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-xs">{chat.title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{formatDate(chat.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <ChatPanel messages={messages} loading={loading} onSend={sendMessage} />
      </div>
    </div>
  );
}
