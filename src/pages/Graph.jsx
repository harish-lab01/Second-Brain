import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import KnowledgeGraph from '../components/graph/KnowledgeGraph';
import { GitFork, Info } from 'lucide-react';

export default function Graph() {
  const { user } = useAuth();
  // useNotes auto-subscribes on mount — no manual fetchNotes needed
  const { notes, loading } = useNotes(user?.uid);

  return (
    <div className="space-y-4 animate-fade-in" style={{ height: 'calc(100vh - 10rem)' }}>
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-primary-300" />
            Knowledge Graph
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visual map of your notes and their connections
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-lg">
          <Info className="w-3 h-3" />
          Click any node to open the note
        </div>
      </div>

      <div className="flex-1" style={{ height: '100%' }}>
        {loading ? (
          <div className="h-full rounded-2xl border border-white/[0.07] bg-surface-50/40 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <KnowledgeGraph notes={notes} />
        )}
      </div>
    </div>
  );
}
