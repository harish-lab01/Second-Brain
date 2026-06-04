import { useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, MessageSquare, GitFork, BookOpen, FolderOpen } from 'lucide-react';

const pages = {
  '/dashboard':   { title: 'Dashboard',        sub: 'Overview of your knowledge base',     icon: LayoutDashboard },
  '/notes':       { title: 'My Notes',         sub: 'All your saved knowledge',            icon: FileText        },
  '/collections': { title: 'Collections',      sub: 'Organised notebooks',                 icon: FolderOpen      },
  '/chat':        { title: 'AI Chat',          sub: 'Converse with your second brain',     icon: MessageSquare   },
  '/graph':       { title: 'Knowledge Graph',  sub: 'Visual map of your note connections', icon: GitFork         },
  '/review':      { title: 'Daily Review',     sub: 'Spaced repetition practice',          icon: BookOpen        },
};

export default function Header() {
  const { pathname } = useLocation();
  const base = '/' + pathname.split('/')[1];
  const page = pages[base] || { title: 'AI Second Brain', sub: '', icon: LayoutDashboard };
  const Icon = page.icon;

  return (
    <header className="flex items-center gap-4 px-6 lg:px-8 py-4 border-b border-white/[0.06] bg-surface-100/60 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-300" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-100 leading-none">{page.title}</h1>
          {page.sub && (
            <p className="text-xs text-slate-500 mt-0.5">{page.sub}</p>
          )}
        </div>
      </div>

      {/* Right side — decorative status */}
      <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-green-400 font-medium">AI Ready</span>
      </div>
    </header>
  );
}
