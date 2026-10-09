"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { clearAdminToken } from "@/lib/admin-auth";

export function PlusIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function EditIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0 0-3l-.5-.5a2.1 2.1 0 0 0-3 0l-10 10L4 20Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function DeleteIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="M6 7h12M10 11v6M14 11v6M8 7l1 13h6l1-13M10 7V5h4v2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function UploadIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-9 w-9"
            aria-hidden="true"
        >
            <path
                d="M12 16V7m0 0 4 4m-4-4-4 4"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7 18a4 4 0 1 1 .9-7.9A5 5 0 0 1 17.7 11 3.5 3.5 0 1 1 18 18H7Z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function FieldLabel({
    children,
    required,
}: {
    children: React.ReactNode;
    required?: boolean;
}) {
    return (
        <span className="mb-1.5 block text-sm font-medium text-label">
            {children}
            {required ? (
                <>
                    {" "}
                    <span className="text-danger" aria-hidden="true">
                        *
                    </span>
                    <span className="sr-only">(bắt buộc)</span>
                </>
            ) : null}
        </span>
    );
}

export function LogoutIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="M10 5H6v14h4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14 8l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M18 12H9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

/** Logout trigger that asks for confirmation first (sidebar footer + mobile "Thêm" page). */
export function AdminLogoutButton({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);

    return (
        <>
            <button
                type="button"
                className={className}
                onClick={() => setConfirming(true)}
            >
                {children}
            </button>
            <ConfirmModal
                open={confirming}
                title="Đăng xuất khỏi trang quản trị?"
                confirmLabel="Đăng xuất"
                onCancel={() => setConfirming(false)}
                onConfirm={() => {
                    clearAdminToken();
                    router.replace("/account");
                }}
            />
        </>
    );
}

// The window is the scroll container (no inner admin scroller any more)
export function preserveAdminScroll() {
    const scrollY = window.scrollY;
    const restore = () => window.scrollTo({ top: scrollY });
    window.requestAnimationFrame(restore);
    window.setTimeout(restore, 120);
    window.setTimeout(restore, 320);
}

export function normalizeSearch(value: string) {
    return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function useObjectUrls(files: File[]) {
    return useMemo(
        () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
        [files],
    );
}
