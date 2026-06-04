export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-5 border border-white/[0.06] bg-surface-50/60"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <div className="h-5 bg-white/[0.06] rounded-lg w-3/4 mb-4 shimmer" />
          <div className="h-3.5 bg-white/[0.04] rounded w-full mb-2 shimmer" />
          <div className="h-3.5 bg-white/[0.04] rounded w-5/6 mb-5 shimmer" />
          <div className="flex gap-2">
            <div className="h-5 bg-white/[0.06] rounded-full w-16 shimmer" />
            <div className="h-5 bg-white/[0.04] rounded-full w-12 shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
