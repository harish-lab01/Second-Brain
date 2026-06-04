import { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import VoiceButton from '../ui/VoiceButton';

export default function ChatInput({ onSend, loading }) {
  const [value, setValue] = useState('');

  const { listening, transcript, supported, start, stop, reset } = useVoice({
    continuous: true,
    onResult: (text) => {
      // Append spoken text to existing value
      setValue(prev => (prev ? prev + ' ' + text : text));
    },
  });

  // When voice stops and there's content, don't auto-send — let the user review
  // But show a visual hint that transcript was captured
  useEffect(() => {
    if (!listening && transcript) reset();
  }, [listening]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    if (listening) stop();
    onSend(value.trim());
    setValue('');
    reset();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-4 border-t border-white/[0.06] bg-surface-100/60 backdrop-blur-xl"
    >
      {/* Voice button */}
      <VoiceButton
        listening={listening}
        supported={supported}
        onStart={start}
        onStop={stop}
        tooltip={listening ? 'Stop — click Send to submit' : 'Speak your question'}
      />

      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={listening ? '🎙 Listening…' : 'Ask anything about your notes…'}
          rows={1}
          className={`w-full resize-none px-4 py-3 pr-12 rounded-xl text-sm text-slate-200 placeholder:text-slate-600
            bg-white/[0.04] border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/35
            transition-all max-h-32 ${
              listening
                ? 'border-red-500/30 bg-red-500/5 placeholder:text-red-400/50'
                : 'border-white/[0.08]'
            }`}
          style={{ overflowY: value.split('\n').length > 3 ? 'auto' : 'hidden' }}
        />
        {!listening && (
          <span className="absolute right-3 bottom-3 text-[10px] text-slate-600">⏎ Send</span>
        )}
        {listening && (
          <span className="absolute right-3 bottom-3 text-[10px] text-red-400 animate-pulse">● REC</span>
        )}
      </div>

      <button
        type="submit"
        disabled={!value.trim() || loading}
        className="p-3 bg-gradient-to-br from-primary to-primary-700 text-white rounded-xl
          hover:from-primary-600 hover:to-primary-800 transition-all shadow-glow-sm
          disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Send className="w-4 h-4" />
        }
      </button>
    </form>
  );
}
