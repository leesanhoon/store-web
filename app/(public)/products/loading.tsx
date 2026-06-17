import MobileAppShell from "@/components/mobile-store/MobileAppShell";

function SkeletonBlock({ className = "" }: { className?: string }) {
    return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export default function ProductsLoading() {
    return (
        <MobileAppShell>
            <div className="catalog-screen" aria-busy="true">
                <header className="mobile-topbar">
                    <SkeletonBlock className="h-10 w-10 rounded-full" />
                    <SkeletonBlock className="h-5 w-44 rounded-full" />
                    <SkeletonBlock className="h-10 w-10 rounded-full" />
                </header>

                <div className="filter-pills">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <SkeletonBlock
                            key={index}
                            className="h-[37px] w-20 rounded-full"
                        />
                    ))}
                </div>

                <section className="catalog-grid">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <article
                            key={index}
                            className="mobile-product-card space-y-2"
                        >
                            <SkeletonBlock className="h-[132px] rounded-[14px]" />
                            <SkeletonBlock className="h-4 w-24 rounded-full" />
                            <SkeletonBlock className="h-3 w-16 rounded-full" />
                            <SkeletonBlock className="h-10 rounded-full" />
                        </article>
                    ))}
                </section>
            </div>
        </MobileAppShell>
    );
}
