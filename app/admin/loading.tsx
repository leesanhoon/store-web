function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

// Generic page-header + list-rows skeleton: every admin route falls back to it
export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <p role="status" className="sr-only">
        Đang tải…
      </p>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <SkeletonBlock className="h-7 w-44 rounded-sm" />
          <SkeletonBlock className="h-4 w-56 max-w-full rounded-sm" />
        </div>
        <SkeletonBlock className="h-11 w-28 shrink-0 rounded-sm" />
      </div>

      <div className="admin-card divide-y divide-line">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-4">
            <SkeletonBlock className="h-12 w-12 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-1/2 rounded-sm" />
              <SkeletonBlock className="h-3 w-1/3 rounded-sm" />
            </div>
            <SkeletonBlock className="h-9 w-20 shrink-0 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
