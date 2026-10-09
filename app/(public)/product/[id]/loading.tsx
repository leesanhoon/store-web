function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export default function ProductDetailLoading() {
  return (
    <div className="product-detail-screen" aria-busy="true">
      <div className="mobile-topbar">
        <SkeletonBlock className="h-11 w-11 rounded-md" />
        <SkeletonBlock className="h-5 w-24 rounded-sm" />
      </div>

      <div className="detail-layout">
        <div className="detail-media">
          <div className="gallery-root">
            <SkeletonBlock className="aspect-[4/3] w-full rounded-md" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-16 w-16 rounded-md" />
              ))}
            </div>
          </div>
        </div>

        <div className="detail-info">
          <div className="space-y-3">
            <SkeletonBlock className="h-6 w-24 rounded-sm" />
            <SkeletonBlock className="h-8 w-3/4 rounded-sm" />
            <SkeletonBlock className="h-8 w-40 rounded-sm" />
            <SkeletonBlock className="h-4 w-32 rounded-sm" />
          </div>

          <SkeletonBlock className="h-12 w-full rounded-sm" />

          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-full rounded-sm" />
            <SkeletonBlock className="h-4 w-5/6 rounded-sm" />
          </div>

          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-40 rounded-sm" />
            <SkeletonBlock className="h-36 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
