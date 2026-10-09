type LoadingOverlayProps = {
    open: boolean;
    message?: string;
};

// Sits below the native <dialog> top layer, so an open ConfirmModal keeps its own loading state visible
export default function LoadingOverlay({ open, message }: LoadingOverlayProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4 bg-white/60 backdrop-blur-md transition-opacity duration-300 starting:opacity-0"
            role="alert"
            aria-live="assertive"
        >
            <svg
                className="size-12 animate-spin"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
            >
                <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="var(--color-line)"
                    strokeWidth="3.5"
                />
                <path
                    d="M24 4a20 20 0 0 1 20 20"
                    stroke="var(--color-primary)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                />
            </svg>
            {message ? (
                <p className="text-sm font-semibold text-ink">{message}</p>
            ) : null}
        </div>
    );
}

export function InlineSpinner({
    className = "h-4 w-4",
}: {
    className?: string;
}) {
    return (
        <svg
            className={`animate-spin ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2.5"
                opacity="0.2"
            />
            <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
    );
}
