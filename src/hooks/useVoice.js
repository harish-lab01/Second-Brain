/**
 * useVoice — Web Speech API hook
 *
 * Returns:
 *   listening   — boolean, true while mic is active
 *   transcript  — the current interim + final text
 *   supported   — boolean, false if browser doesn't support speech recognition
 *   start()     — begin recording
 *   stop()      — stop recording
 *   reset()     — clear transcript
 */
import { useState, useRef, useCallback, useEffect } from 'react';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

export function useVoice({ onResult, onEnd, continuous = false, language = 'en-US' } = {}) {
  const [listening,  setListening]  = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported]                 = useState(Boolean(SpeechRecognition));
  const recognitionRef              = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition || listening) return;

    const rec = new SpeechRecognition();
    rec.lang              = language;
    rec.continuous        = continuous;
    rec.interimResults    = true;
    rec.maxAlternatives   = 1;
    recognitionRef.current = rec;

    rec.onstart = () => setListening(true);

    rec.onresult = (e) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += text;
        else interim += text;
      }
      const combined = (final || interim).trim();
      setTranscript(combined);
      if (final.trim()) onResult?.(final.trim());
    };

    rec.onerror = (e) => {
      // 'aborted' is expected when we call stop() — not a real error
      if (e.error !== 'aborted') console.warn('Speech recognition error:', e.error);
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      onEnd?.();
    };

    rec.start();
  }, [listening, language, continuous, onResult, onEnd]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
  }, []);

  return { listening, transcript, supported, start, stop, reset };
}
