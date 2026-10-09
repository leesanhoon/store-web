// Also rendered by cart/page.tsx while the cart is read from localStorage
function SkeletonBlock({ className = "" }: { className?: string }) {
    return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export default function CartLoading() {
    return (
        <div className="quote-screen" aria-busy="true">
            <p className="sr-only" role="status">
                Đang tải giỏ hàng…
            </p>
            <header className="mobile-topbar">
                <SkeletonBlock className="h-7.5 w-40 rounded-sm md:h-10 md:w-56" />
            </header>

            <div className="cart-layout">
                <div className="cart-items">
                    <div className="cart-list-header">
                        <SkeletonBlock className="h-6 w-32 rounded-sm" />
                        <SkeletonBlock className="h-6 w-20 rounded-sm" />
                    </div>
                    <div className="cart-items-list">
                        {Array.from({ length: 2 }, (_, index) => (
                            <div key={index} className="cart-item">
                                <SkeletonBlock className="cart-item-image" />
                                <div className="cart-item-details">
                                    <SkeletonBlock className="h-5 w-3/4 rounded-sm" />
                                    <SkeletonBlock className="h-4 w-1/2 rounded-sm" />
                                    <SkeletonBlock className="h-4 w-24 rounded-sm" />
                                    <div className="cart-item-bottom">
                                        <SkeletonBlock className="h-11 w-36 rounded-sm" />
                                        <SkeletonBlock className="h-5 w-20 rounded-sm" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="quote-form-card cart-summary-card">
                    <div className="cart-total-block">
                        <SkeletonBlock className="h-8 w-full rounded-sm" />
                        <SkeletonBlock className="h-5 w-48 rounded-sm" />
                    </div>
                    <SkeletonBlock className="h-7 w-40 rounded-sm" />
                    {Array.from({ length: 4 }, (_, index) => (
                        <div key={index}>
                            <SkeletonBlock className="h-5 w-28 rounded-sm" />
                            <SkeletonBlock className="h-11 rounded-sm" />
                        </div>
                    ))}
                    <SkeletonBlock className="h-11 rounded-sm" />
                </div>
            </div>
        </div>
    );
}
