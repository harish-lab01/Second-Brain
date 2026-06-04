import { Mic, MicOff, AlertCircle } from 'lucide-react';

/**
 * Reusable mic button — shows animated ring while recording.
 * Props:
 *   listening   boolean
 *   supported   boolean
 *   onStart     fn
 *   onStop      fn
 *   size        'sm' | 'md'  (default 'md')
 *   tooltip     string
 */
export default function VoiceButton({
  listening,
  supported,
  onStart,
  onStop,
  size = 'md',
  tooltip,
}) {
  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title="Voice input not supported in this browser"
        className="p-2 rounded-xl text-slate-700 cursor-not-allowed"
      >
        <AlertCircle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
    );
  }

  const sizeClasses = size === 'sm'
    ? 'p-1.5 rounded-lg'
    : 'p-2.5 rounded-xl';

  return (
    <button
      type="button"
      onClick={listening ? onStop : onStart}
      title={tooltip || (listening ? 'Stop recording' : 'Voice input')}
      className={`relative flex items-center justify-center transition-all ${sizeClasses} ${
        listening
          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/25'
          : 'bg-white/[0.04] text-slate-500 border border-white/[0.08] hover:text-primary-300 hover:bg-primary/10 hover:border-primary/25'
      }`}
    >
      {/* Animated pulse ring while listening */}
      {listening && (
        <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/20 pointer-events-none" />
      )}
      {listening
        ? <MicOff className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        : <Mic    className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      }
    </button>
  );
}
