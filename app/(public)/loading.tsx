import MobileAppShell from "@/components/mobile-store/MobileAppShell";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export default function PublicLoading() {
  return (
    <MobileAppShell>
      <div className="home-screen" aria-busy="true">
        <header className="mobile-home-header">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-28 rounded-full" />
              <SkeletonBlock className="h-3 w-20 rounded-full" />
            </div>
          </div>
          <SkeletonBlock className="h-11 w-11 rounded-full" />
        </header>

        <section className="mobile-hero-card p-0">
          <SkeletonBlock className="absolute inset-0 rounded-[22px]" />
        </section>

        <section className="category-rail">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-[82px] rounded-[16px]" />
          ))}
        </section>

        <section className="mobile-section">
          <div className="mobile-section-heading">
            <SkeletonBlock className="h-5 w-36 rounded-full" />
            <SkeletonBlock className="h-4 w-20 rounded-full" />
          </div>
          <div className="featured-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="mobile-product-card compact space-y-2">
                <SkeletonBlock className="h-[118px] rounded-[14px]" />
                <SkeletonBlock className="h-4 w-20 rounded-full" />
                <SkeletonBlock className="h-3 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileAppShell>
  );
}
