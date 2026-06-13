"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  icon,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
      confirmRef.current?.focus();
    } else {
      setAnimateIn(false);
      const t = setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{
          opacity: animateIn ? 1 : 0,
          transition: "opacity 0.3s var(--ease-out-soft)",
        }}
        onClick={loading ? undefined : onCancel}
      />

      {/* Modal card — Double-Bezel */}
      <div
        className="relative w-full max-w-[340px] rounded-[24px] bg-black/[0.04] p-[5px] ring-1 ring-[--ring-hairline]"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "scale(1) translateY(0)" : "scale(0.92) translateY(16px)",
          filter: animateIn ? "blur(0)" : "blur(4px)",
          transition:
            "opacity 0.4s var(--ease-spring), transform 0.4s var(--ease-spring), filter 0.4s var(--ease-spring)",
        }}
      >
        <div className="rounded-[calc(24px-5px)] bg-white p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
          {/* Icon */}
          {icon ? (
            <div className="mb-4 flex justify-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
                  danger ? "bg-rose-50 ring-1 ring-rose-200" : "bg-[--color-brand-accent-soft] ring-1 ring-[--color-brand-accent]/10"
                }`}
              >
                {icon}
              </div>
            </div>
          ) : null}

          {/* Title */}
          <h3
            id="confirm-modal-title"
            className="text-center font-display text-[17px] font-extrabold leading-snug text-[--color-ink]"
          >
            {title}
          </h3>

          {/* Description */}
          {description ? (
            <p className="mt-2 text-center text-[13px] leading-relaxed text-slate-500">
              {description}
            </p>
          ) : null}

          {/* Actions */}
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="rounded-full border border-[--color-border] bg-white px-4 py-3 text-[13px] font-bold text-[--color-ink] transition-all duration-300 active:scale-[0.96] disabled:opacity-50"
              style={{ transitionTimingFunction: "var(--ease-spring)" }}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`relative rounded-full px-4 py-3 text-[13px] font-bold text-white transition-all duration-300 active:scale-[0.96] disabled:opacity-70 ${
                danger
                  ? "bg-rose-500 shadow-[0_8px_20px_-8px_rgba(225,29,72,0.5)]"
                  : "bg-[--color-ink] shadow-[0_8px_20px_-8px_rgba(16,26,54,0.5)]"
              }`}
              style={{ transitionTimingFunction: "var(--ease-spring)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingDots />
                  Đang xử lý
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current"
          style={{
            animation: `confirm-dot-bounce 1.2s var(--ease-spring) ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes confirm-dot-bounce {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </span>
  );
}
