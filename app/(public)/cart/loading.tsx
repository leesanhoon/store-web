import MobileAppShell from "@/components/mobile-store/MobileAppShell";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export default function CartLoading() {
  return (
    <MobileAppShell>
      <div className="quote-screen" aria-busy="true">
        <header className="mobile-topbar">
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <SkeletonBlock className="h-5 w-44 rounded-full" />
          <SkeletonBlock className="h-10 w-10 rounded-full" />
        </header>

        <section className="quote-stepper">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="grid justify-items-center gap-2">
              <SkeletonBlock className="h-6 w-6 rounded-full" />
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <SkeletonBlock className="h-3 w-20 rounded-full" />
            </div>
          ))}
        </section>

        <section className="quote-form-card space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonBlock className="h-4 w-28 rounded-full" />
              <SkeletonBlock className="h-12 rounded-[16px]" />
            </div>
          ))}
          <div className="grid gap-3 md:grid-cols-2">
            <SkeletonBlock className="h-[156px] rounded-[18px]" />
            <SkeletonBlock className="h-[156px] rounded-[18px]" />
          </div>
        </section>

        <SkeletonBlock className="h-[132px] rounded-[18px]" />
        <SkeletonBlock className="h-12 rounded-[16px]" />
      </div>
    </MobileAppShell>
  );
}
