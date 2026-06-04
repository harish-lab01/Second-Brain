export default function TagChip({ tag, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
        active
          ? 'bg-primary/20 text-primary-300 border-primary/40 shadow-glow-sm'
          : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-primary/10 hover:text-primary-300 hover:border-primary/30'
      }`}
    >
      {tag}
    </button>
  );
}
