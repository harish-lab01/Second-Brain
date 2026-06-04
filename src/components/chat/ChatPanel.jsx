import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Brain, Sparkles } from 'lucide-react';

const suggestions = [
  'Summarize my recent notes',
  'What topics have I been learning about?',
  'Find notes related to AI',
];

export default function ChatPanel({ messages, loading, onSend }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-fade-in">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/10 scale-150 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary-300" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-200 mb-2">Chat with your knowledge</h3>
            <p className="text-slate-500 max-w-sm text-sm leading-relaxed mb-8">
              Ask anything about your saved notes. Your AI assistant will answer using your personal knowledge base.
            </p>

            {/* Quick suggestions */}
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="text-left px-4 py-2.5 rounded-xl text-sm text-slate-400 border border-white/[0.07] bg-white/[0.03]
                    hover:bg-primary/10 hover:border-primary/25 hover:text-primary-300
                    transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-primary-300/60" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-surface-200 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Brain className="w-3.5 h-3.5 text-primary-300" />
            </div>
            <div className="bg-surface-50/80 border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 backdrop-blur-sm">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={onSend} loading={loading} />
    </div>
  );
}
