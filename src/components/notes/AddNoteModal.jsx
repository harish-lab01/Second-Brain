import { useState } from 'react';
import { X, FileText, FileUp, Link, Loader2, Sparkles, LayoutTemplate, ChevronLeft } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import { useVoice } from '../../hooks/useVoice';
import VoiceButton from '../ui/VoiceButton';
import useStore from '../../store/useStore';
import { TEMPLATES } from '../../utils/templates';

const TABS = [
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'pdf',  label: 'PDF',  icon: FileUp  },
  { id: 'url',  label: 'URL',  icon: Link     },
];

// ── Template picker screen ────────────────────────────────────────────────────
function TemplatePicker({ onSelect, onSkip }) {
  return (
    <div className="px-6 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">Start from a template</p>
          <p className="text-xs text-slate-500 mt-0.5">Or skip to write freely</p>
        </div>
        <button
          onClick={onSkip}
          className="text-xs text-primary-300 hover:underline font-medium"
        >
          Skip →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 max-h-[52vh] overflow-y-auto pr-1">
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className="flex flex-col items-start gap-2 p-3.5 rounded-xl text-left
              border border-white/[0.07] bg-white/[0.03]
              hover:bg-primary/[0.08] hover:border-primary/25
              transition-all group"
          >
            <span className="text-2xl">{t.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                {t.label}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{t.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function AddNoteModal({ userId, onClose, defaultCollection }) {
  const [screen, setScreen]   = useState('template'); // 'template' | 'form'
  const [tab, setTab]         = useState('text');
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [file, setFile]       = useState(null);
  const [url, setUrl]         = useState('');
  const [saving, setSaving]   = useState(false);
  const [voiceTarget, setVoiceTarget] = useState(null);

  const { createNote } = useNotes(userId);
  const showToast = useStore(s => s.showToast);

  const { listening, supported, start, stop, reset } = useVoice({
    continuous: true,
    onResult: (text) => {
      if (voiceTarget === 'title') setTitle(p => p ? p + ' ' + text : text);
      else setContent(p => p ? p + ' ' + text : text);
    },
    onEnd: () => setVoiceTarget(null),
  });

  const startVoice = (target) => {
    if (listening) { stop(); return; }
    setVoiceTarget(target);
    start();
  };
  const stopVoice = () => { stop(); setVoiceTarget(null); reset(); };

  const handleSelectTemplate = (template) => {
    setTitle(template.defaultTitle);
    setContent(template.content);
    setScreen('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (listening) stopVoice();
    setSaving(true);
    try {
      const extra = defaultCollection ? { collectionId: defaultCollection } : {};
      if (tab === 'text') {
        await createNote({ type: 'text', title, content, ...extra });
      } else if (tab === 'pdf') {
        if (!file) { showToast('Please select a PDF file.', 'error'); setSaving(false); return; }
        await createNote({ type: 'pdf', title, file, ...extra });
      } else if (tab === 'url') {
        if (!url.trim()) { showToast('Please enter a URL.', 'error'); setSaving(false); return; }
        await createNote({ type: 'url', title, content, sourceUrl: url, ...extra });
      }
      showToast('Note saved and analyzed by AI!');
      onClose();
    } catch (err) {
      showToast('Failed to save note: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(19,19,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            {screen === 'form' && (
              <button
                onClick={() => setScreen('template')}
                className="p-1 text-slate-500 hover:text-slate-300 rounded-lg transition-all mr-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              {screen === 'template'
                ? <LayoutTemplate className="w-3.5 h-3.5 text-primary-300" />
                : <Sparkles className="w-3.5 h-3.5 text-primary-300" />
              }
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              {screen === 'template' ? 'Add New Note' : 'Write Your Note'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Screen: template picker */}
        {screen === 'template' && (
          <TemplatePicker
            onSelect={handleSelectTemplate}
            onSkip={() => setScreen('form')}
          />
        )}

        {/* Screen: form */}
        {screen === 'form' && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === id
                      ? 'bg-primary/15 text-primary-300 border border-primary/25'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Title *</label>
                  <VoiceButton listening={listening && voiceTarget === 'title'} supported={supported}
                    onStart={() => startVoice('title')} onStop={stopVoice} size="sm" tooltip="Dictate title" />
                </div>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={listening && voiceTarget === 'title' ? '🎙 Listening for title…' : 'Give your note a title...'}
                  required
                  className={`${inputCls} ${listening && voiceTarget === 'title' ? 'border-red-500/30 bg-red-500/5' : ''}`}
                />
              </div>

              {tab === 'text' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Content</label>
                    <VoiceButton listening={listening && voiceTarget === 'content'} supported={supported}
                      onStart={() => startVoice('content')} onStop={stopVoice} size="sm" tooltip="Dictate content" />
                  </div>
                  <textarea value={content} onChange={e => setContent(e.target.value)}
                    placeholder={listening && voiceTarget === 'content' ? '🎙 Listening…' : 'Write your note here...'}
                    rows={8}
                    className={`${inputCls} resize-none font-mono text-xs leading-relaxed ${listening && voiceTarget === 'content' ? 'border-red-500/30 bg-red-500/5' : ''}`}
                  />
                </div>
              )}

              {tab === 'pdf' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Upload PDF</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl cursor-pointer
                    border-2 border-dashed border-white/[0.1] hover:border-primary/40 hover:bg-primary/5 transition-all group">
                    <FileUp className="w-7 h-7 text-slate-600 group-hover:text-primary-300 mb-2 transition-colors" />
                    <span className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">
                      {file ? file.name : 'Click to upload or drag & drop'}
                    </span>
                    <span className="text-xs text-slate-600 mt-1">PDF only</span>
                    <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
                  </label>
                  <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-400 inline-block" />
                    Text extracted locally — no upload to external servers.
                  </p>
                </div>
              )}

              {tab === 'url' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">URL *</label>
                    <input value={url} onChange={e => setUrl(e.target.value)}
                      placeholder="https://example.com/article" type="url" className={inputCls} />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <p className="text-xs text-slate-500">Page content will be automatically fetched and saved.</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Your Notes (optional)</label>
                      <VoiceButton listening={listening && voiceTarget === 'content'} supported={supported}
                        onStart={() => startVoice('content')} onStop={stopVoice} size="sm" tooltip="Dictate your notes" />
                    </div>
                    <textarea value={content} onChange={e => setContent(e.target.value)}
                      placeholder={listening && voiceTarget === 'content' ? '🎙 Listening…' : 'Add your own thoughts...'}
                      rows={3} className={`${inputCls} resize-none ${listening && voiceTarget === 'content' ? 'border-red-500/30 bg-red-500/5' : ''}`}
                    />
                  </div>
                </div>
              )}

              {/* AI notice */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
                <Sparkles className="w-3.5 h-3.5 text-primary-300 flex-shrink-0" />
                <p className="text-xs text-slate-400">AI will automatically generate a summary, tags, and find related notes.</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/[0.08] hover:bg-white/[0.04] hover:text-slate-200 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-semibold
                    hover:from-primary-600 hover:to-primary-800 transition-all shadow-glow-sm
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {tab === 'url' ? 'Fetching & Analyzing…' : 'Analyzing…'}</>
                    : <><Sparkles className="w-4 h-4" /> Save Note</>
                  }
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
