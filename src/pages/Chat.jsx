import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
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
    if (user) {
      fetchNotes();
      fetchChats();
    }
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
    <div className="flex h-[calc(100vh-8rem)] gap-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar: chat history */}
      <div className="w-64 border-r border-gray-100 flex flex-col bg-gray-50">
        <div className="p-3 border-b border-gray-100">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chatHistory.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-6 px-4">
              Your chat history will appear here.
            </p>
          ) : (
            chatHistory.map(chat => (
              <button
                key={chat.id}
                onClick={() => handleLoadChat(chat)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selectedChatId === chat.id
                    ? 'bg-primary-50 text-primary'
                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-xs">{chat.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(chat.createdAt)}
                    </p>
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
