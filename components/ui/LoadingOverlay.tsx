"use client";

import { useEffect, useState } from "react";

type LoadingOverlayProps = {
  open: boolean;
  message?: string;
};

export default function LoadingOverlay({ open, message }: LoadingOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
      const t = setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center"
      role="alert"
      aria-live="assertive"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/60 backdrop-blur-md"
        style={{
          opacity: animateIn ? 1 : 0,
          transition: "opacity 0.3s var(--ease-out-soft)",
        }}
      />

      {/* Spinner card */}
      <div
        className="relative flex flex-col items-center gap-5"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "scale(1)" : "scale(0.85)",
          transition: "opacity 0.4s var(--ease-spring), transform 0.4s var(--ease-spring)",
        }}
      >
        <div className="relative h-12 w-12">
          <svg className="h-12 w-12 animate-[overlay-spin_1s_var(--ease-spring)_infinite]" viewBox="0 0 48 48" fill="none">
            <circle
              cx="24" cy="24" r="20"
              stroke="var(--color-border)"
              strokeWidth="3.5"
            />
            <path
              d="M24 4a20 20 0 0 1 20 20"
              stroke="var(--color-ink)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        {message && (
          <p className="font-display text-[14px] font-bold text-[--color-ink]">
            {message}
          </p>
        )}
      </div>

      <style>{`
        @keyframes overlay-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function InlineSpinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-[overlay-spin_1s_var(--ease-spring)_infinite] ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <style>{`
        @keyframes overlay-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}
