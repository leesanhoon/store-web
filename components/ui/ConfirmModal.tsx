"use client";

import { useEffect, useId, useRef } from "react";
import { TrashIcon } from "@/components/mobile-store/icons";
import { InlineSpinner } from "@/components/ui/LoadingOverlay";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
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
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // React state drives the native dialog (focus trap, Escape, focus return, top layer).
  // autoFocus can't be used on an always-mounted dialog, so focus explicitly:
  // Cancel for destructive dialogs, so Enter never deletes by accident.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      (danger ? cancelRef : confirmRef).current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, danger]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onCancel();
      }}
      // The browser can still force-close it (repeated Escape); keep the parent in sync
      onClose={() => {
        if (open) onCancel();
      }}
      onClick={(event) => {
        // Only the backdrop targets the dialog itself (it has no padding)
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
      className="confirm-modal m-auto w-[calc(100%-2rem)] max-w-100 rounded-lg bg-white p-0 text-body shadow-lg"
    >
      <div className="p-6">
        {danger ? (
          <span className="mb-4 flex size-12 items-center justify-center rounded-md bg-danger-soft text-danger">
            <TrashIcon className="size-6" />
          </span>
        ) : null}

        <h2 id={titleId} className="text-lg leading-snug font-semibold text-ink">
          {title}
        </h2>

        {description ? (
          <p id={descriptionId} className="mt-2 text-base text-body">
            {description}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="button-secondary"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={danger ? "button-primary button-danger" : "button-primary"}
          >
            {loading ? (
              <>
                <InlineSpinner className="size-4" />
                Đang xử lý
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
