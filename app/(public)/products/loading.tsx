function SkeletonBlock({ className = "" }: { className?: string }) {
    return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export default function ProductsLoading() {
    return (
        <div className="catalog-screen" aria-busy="true">
            <header className="mobile-topbar">
                <SkeletonBlock className="h-7.5 w-40 rounded-sm md:h-10 md:w-56" />
            </header>

            <div className="catalog-layout">
                <div className="catalog-sidebar">
                    <SkeletonBlock className="h-11 rounded-sm" />
                    <div className="filter-pills">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <SkeletonBlock
                                key={index}
                                className="h-11 w-24 rounded-sm md:h-10 lg:w-full"
                            />
                        ))}
                    </div>
                </div>

                <div className="catalog-results">
                    <SkeletonBlock className="h-5 w-24 rounded-sm" />
                    <section className="catalog-grid">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="mobile-product-card">
                                <SkeletonBlock className="aspect-square" />
                                <div className="mobile-product-body">
                                    <SkeletonBlock className="h-5 w-3/4 rounded-sm" />
                                    <SkeletonBlock className="mt-auto h-6 w-1/2 rounded-sm" />
                                    <SkeletonBlock className="h-4 w-2/3 rounded-sm" />
                                </div>
                            </div>
                        ))}
                    </section>
                </div>
            </div>
        </div>
    );
}
