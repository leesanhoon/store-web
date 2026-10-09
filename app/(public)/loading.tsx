// Fallback for every (public) route without its own loading.tsx: /, /track-order, /gallery, /partner/[id]
function SkeletonBlock({ className = "" }: { className?: string }) {
    return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export default function PublicLoading() {
    return (
        <div className="site-container grid gap-6 pt-4 md:pt-6" aria-busy="true">
            <p className="sr-only" role="status">
                Đang tải…
            </p>
            <SkeletonBlock className="h-8 w-56 max-w-full rounded-sm md:h-10" />
            <div className="home-product-grid">
                {Array.from({ length: 8 }, (_, index) => (
                    <div
                        key={index}
                        className="overflow-hidden rounded-md border border-line bg-white"
                    >
                        <SkeletonBlock className="aspect-square" />
                        <div className="grid gap-2 p-3">
                            <SkeletonBlock className="h-4 w-3/4 rounded-sm" />
                            <SkeletonBlock className="h-4 w-1/2 rounded-sm" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
