import { Brain } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', description = 'Get started by adding your first note.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      {/* Decorative ring */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse scale-125" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
          <Brain className="w-9 h-9 text-primary-300" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-xs text-sm leading-relaxed mb-6">{description}</p>
      {action && action}
    </div>
  );
}
