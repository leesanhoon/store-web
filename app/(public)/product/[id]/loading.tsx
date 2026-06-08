import MobileAppShell from "@/components/mobile-store/MobileAppShell";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export default function ProductDetailLoading() {
  return (
    <MobileAppShell>
      <div className="product-detail-screen" aria-busy="true">
        <header className="mobile-topbar detail-topbar">
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <SkeletonBlock className="h-5 w-40 rounded-full" />
          <div className="flex justify-end gap-2">
            <SkeletonBlock className="h-10 w-10 rounded-full" />
            <SkeletonBlock className="h-10 w-10 rounded-full" />
          </div>
        </header>

        <SkeletonBlock className="h-[220px] rounded-[18px]" />

        <section className="space-y-2">
          <SkeletonBlock className="h-6 w-40 rounded-full" />
          <SkeletonBlock className="h-5 w-24 rounded-full" />
          <SkeletonBlock className="h-4 w-full rounded-full" />
          <SkeletonBlock className="h-4 w-5/6 rounded-full" />
        </section>

        <section className="detail-spec-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-[76px] rounded-[16px]" />
          ))}
        </section>

        <section className="space-y-2">
          <SkeletonBlock className="h-5 w-24 rounded-full" />
          <SkeletonBlock className="h-[124px] rounded-[18px]" />
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-5 w-40 rounded-full" />
            <SkeletonBlock className="h-4 w-20 rounded-full" />
          </div>
          <div className="related-products">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-[186px] rounded-[18px]" />
            ))}
          </div>
        </section>

        <SkeletonBlock className="h-[52px] rounded-[18px]" />
      </div>
    </MobileAppShell>
  );
}
