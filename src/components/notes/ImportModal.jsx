import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import { processMarkdownFiles } from '../../utils/markdownImporter';
import useStore from '../../store/useStore';

export default function ImportModal({ userId, onClose }) {
  const [files, setFiles]         = useState([]); // parsed { title, content, filename }
  const [importing, setImporting] = useState(false);
  const [progress, setProgress]   = useState({ done: 0, total: 0 });
  const [results, setResults]     = useState([]); // { filename, status, title }
  const [dragging, setDragging]   = useState(false);
  const [phase, setPhase]         = useState('drop'); // drop | preview | done
  const inputRef                  = useRef(null);

  const { createNote } = useNotes(userId);
  const showToast = useStore(s => s.showToast);

  const handleFiles = async (fileList) => {
    const mdFiles = Array.from(fileList).filter(f => f.name.match(/\.md$/i));
    if (!mdFiles.length) {
      showToast('No .md files found. Please select Markdown files.', 'error');
      return;
    }
    const parsed = await processMarkdownFiles(mdFiles);
    setFiles(parsed);
    setPhase('preview');
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // handleFiles reads from FileReader — no reactive deps needed

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleImport = async () => {
    if (!files.length) return;
    setImporting(true);
    setProgress({ done: 0, total: files.length });
    const res = [];

    for (let i = 0; i < files.length; i++) {
      const { title, content, filename } = files[i];
      try {
        await createNote({ type: 'text', title, content });
        res.push({ filename, title, status: 'ok' });
      } catch (err) {
        res.push({ filename, title, status: 'error', error: err.message });
      }
      setProgress({ done: i + 1, total: files.length });
      // Small delay to avoid hammering Groq API
      await new Promise(r => setTimeout(r, 400));
    }

    setResults(res);
    setPhase('done');
    setImporting(false);
  };

  const ok    = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(19,19,26,0.97)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 text-primary-300" />
            </div>
            <h2 className="text-base font-semibold text-slate-100">Import Notes</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Phase: drop */}
          {phase === 'drop' && (
            <>
              <p className="text-xs text-slate-400 leading-relaxed">
                Import notes from <strong className="text-slate-300">Notion</strong>, <strong className="text-slate-300">Obsidian</strong>, or any Markdown files.
                Each <code className="text-primary-300 bg-primary/10 px-1 rounded">.md</code> file becomes a separate note with AI analysis.
              </p>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center h-36 rounded-xl cursor-pointer
                  border-2 border-dashed transition-all
                  ${dragging
                    ? 'border-primary/60 bg-primary/10'
                    : 'border-white/[0.1] hover:border-primary/40 hover:bg-primary/5'
                  }`}
              >
                <Upload className={`w-8 h-8 mb-2 transition-colors ${dragging ? 'text-primary-300' : 'text-slate-600'}`} />
                <p className="text-sm text-slate-400 font-medium">Drop .md files here</p>
                <p className="text-xs text-slate-600 mt-1">or click to browse</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".md"
                  multiple
                  className="hidden"
                  onChange={e => handleFiles(e.target.files)}
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <p className="text-xs text-slate-500">
                  Supports Notion exports, Obsidian vaults, and plain Markdown. YAML front matter is automatically stripped.
                </p>
              </div>
            </>
          )}

          {/* Phase: preview */}
          {phase === 'preview' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-200">
                  {files.length} file{files.length !== 1 ? 's' : ''} ready to import
                </p>
                <button
                  onClick={() => { setFiles([]); setPhase('drop'); }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Change files
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <FileText className="w-3.5 h-3.5 text-primary-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{f.title}</p>
                      <p className="text-[10px] text-slate-600 truncate">{f.filename}</p>
                    </div>
                    <span className="text-[10px] text-slate-600">{f.content.length} chars</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/15">
                <Sparkles className="w-3.5 h-3.5 text-primary-300 flex-shrink-0" />
                <p className="text-xs text-slate-400">
                  Each note will be AI-analyzed for summary, tags, and connections.
                  Large imports may take a few minutes.
                </p>
              </div>
            </>
          )}

          {/* Phase: importing progress */}
          {importing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-primary-300 animate-spin" />
                  Importing and analyzing…
                </span>
                <span className="text-primary-300 font-semibold">{progress.done}/{progress.total}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-300 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Phase: done */}
          {phase === 'done' && !importing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-300">Import complete!</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ok} imported successfully{failed > 0 ? `, ${failed} failed` : ''}
                  </p>
                </div>
              </div>

              {failed > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {results.filter(r => r.status === 'error').map((r, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15">
                      <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      <p className="text-xs text-slate-400 truncate">{r.filename}: {r.error}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/[0.08] hover:bg-white/[0.04] hover:text-slate-200 transition-all"
            >
              {phase === 'done' ? 'Close' : 'Cancel'}
            </button>
            {phase === 'preview' && !importing && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl text-sm font-semibold
                  hover:from-primary-600 transition-all shadow-glow-sm flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import {files.length} Note{files.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
