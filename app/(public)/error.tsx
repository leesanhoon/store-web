"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ChatIcon } from "@/components/mobile-store/icons";
import { SITE } from "@/lib/site";

export default function PublicError({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="notfound-screen">
            <h1 className="notfound-title">Không tải được trang</h1>
            <p className="notfound-copy">
                Máy chủ đang bận hoặc mất kết nối. Vui lòng thử lại sau ít phút.
            </p>
            <div className="notfound-actions">
                <button type="button" className="button-primary" onClick={() => unstable_retry()}>
                    Thử lại
                </button>
                <Link href="/" className="button-secondary">
                    Về trang chủ
                </Link>
                {SITE.zaloHref ? (
                    <a
                        href={SITE.zaloHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button-secondary"
                    >
                        <ChatIcon className="h-5 w-5" />
                        Nhắn Zalo
                    </a>
                ) : null}
            </div>
        </div>
    );
}
