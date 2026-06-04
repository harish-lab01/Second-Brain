export default function StatsCard({ icon: Icon, label, value, color = 'text-primary-300', bg = 'bg-primary/10', borderColor = 'border-primary/20', glow = '' }) {
  return (
    <div className={`group relative rounded-2xl p-5 border border-white/[0.07] bg-surface-50/60 hover:bg-surface-50/80 transition-all duration-300 overflow-hidden hover:shadow-card-hover ${glow}`}>
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)' }} />

      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} border ${borderColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>

      <p className="text-2xl font-bold text-white mb-1 tabular-nums">{value}</p>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </div>
  );
}
