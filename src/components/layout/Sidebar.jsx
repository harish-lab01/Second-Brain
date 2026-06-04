import { NavLink } from 'react-router-dom';
import { Brain, LayoutDashboard, FileText, MessageSquare, LogOut, Zap, GitFork, BookOpen, FolderOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'       },
  { to: '/notes',       icon: FileText,        label: 'Notes'           },
  { to: '/collections', icon: FolderOpen,      label: 'Collections'     },
  { to: '/chat',        icon: MessageSquare,   label: 'AI Chat'         },
  { to: '/graph',       icon: GitFork,         label: 'Knowledge Graph' },
  { to: '/review',      icon: BookOpen,        label: 'Daily Review'    },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 flex flex-col h-screen sticky top-0 border-r border-white/[0.06] bg-surface-100/80 backdrop-blur-xl">
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-glow-sm">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border-2 border-surface-100" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight">SecondBrain</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Zap className="w-2.5 h-2.5 text-primary-300" />
            <span className="text-[10px] text-primary-300 font-medium">AI Powered</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/[0.15] text-primary-300 shadow-glow-sm border border-primary/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 transition-all flex-shrink-0 ${isActive ? 'text-primary-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="truncate">{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-300 flex-shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* User footer */}
      <div className="px-3 py-4 space-y-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="relative flex-shrink-0">
            <img
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=6C63FF&color=fff`}
              alt="avatar"
              className="w-8 h-8 rounded-full ring-2 ring-primary/30"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 border-2 border-surface-100" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.displayName}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="group flex items-center gap-2.5 text-sm text-slate-500 hover:text-red-400 transition-all duration-200 w-full px-3 py-2 rounded-xl hover:bg-red-500/[0.08]"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
