function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export default function AdminLoading() {
  return (
    <div className="space-y-3 text-[#0b1b3b]" aria-busy="true">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <SkeletonBlock className="h-6 w-40 rounded-full" />
          <SkeletonBlock className="h-3 w-52 rounded-full" />
        </div>
        <SkeletonBlock className="h-10 w-24 rounded-[13px]" />
      </div>

      <section className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-card space-y-3 p-3.5">
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="h-8 w-20 rounded-full" />
            <SkeletonBlock className="h-3 w-16 rounded-full" />
          </div>
        ))}
      </section>

      <SkeletonBlock className="h-11 rounded-[16px]" />
      <SkeletonBlock className="h-[180px] rounded-[18px]" />
      <SkeletonBlock className="h-[200px] rounded-[18px]" />
    </div>
  );
}
