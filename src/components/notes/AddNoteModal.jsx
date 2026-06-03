import { useState } from 'react';
import { X, FileText, FileUp, Link, Loader2 } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import useStore from '../../store/useStore';

const TABS = [
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'pdf',  label: 'PDF',  icon: FileUp },
  { id: 'url',  label: 'URL',  icon: Link },
];

export default function AddNoteModal({ userId, onClose }) {
  const [tab, setTab] = useState('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const { createNote } = useNotes(userId);
  const showToast = useStore(s => s.showToast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (tab === 'text') {
        await createNote({ type: 'text', title, content });
      } else if (tab === 'pdf') {
        if (!file) { showToast('Please select a PDF file.', 'error'); setSaving(false); return; }
        await createNote({ type: 'pdf', title, file });
      } else if (tab === 'url') {
        if (!url.trim()) { showToast('Please enter a URL.', 'error'); setSaving(false); return; }
        await createNote({ type: 'url', title, content, sourceUrl: url });
      }
      showToast('Note saved and analyzed by AI!');
      onClose();
    } catch (err) {
      showToast('Failed to save note: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Add New Note</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Note title..."
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Tab-specific inputs */}
          {tab === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste your notes, thoughts, or anything you want to remember..."
                rows={6}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          )}

          {tab === 'pdf' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload PDF</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors">
                <FileUp className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  {file ? file.name : 'Click to upload or drag & drop'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => setFile(e.target.files[0])}
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">
                Text will be extracted locally — no file upload required.
              </p>
            </div>
          )}

          {tab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  type="url"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Summary</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Add your thoughts or a summary about this URL..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* AI notice */}
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full" />
            AI will automatically generate a summary, tags, and find related notes.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</> : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
