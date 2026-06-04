import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import useStore from '../../store/useStore';

export default function Toast() {
  const { toast, clearToast } = useStore();

  useEffect(() => {
    if (toast) {
      const t = setTimeout(clearToast, 3500);
      return () => clearTimeout(t);
    }
  }, [toast, clearToast]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium animate-slide-up
        border backdrop-blur-xl shadow-modal
        ${isSuccess
          ? 'bg-green-500/10 border-green-500/30 text-green-300'
          : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}
    >
      {isSuccess
        ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
        : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      }
      <span className="text-slate-200">{toast.message}</span>
      <button
        onClick={clearToast}
        className="ml-2 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
