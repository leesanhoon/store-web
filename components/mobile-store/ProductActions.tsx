"use client";

import { useEffect, useState } from "react";
import { ShareIcon } from "@/components/mobile-store/icons";

type Props = {
  name: string;
};

export default function ProductActions({ name }: Props) {
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    if (!shareMessage) return;
    const timeout = window.setTimeout(() => setShareMessage(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [shareMessage]);

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        // Người dùng hủy hộp chia sẻ — không cần báo lỗi.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("Đã sao chép liên kết");
    } catch {
      setShareMessage("Không thể chia sẻ trên thiết bị này");
    }
  };

  return (
    <div className="detail-actions">
      <button type="button" aria-label="Chia sẻ" onClick={handleShare}>
        <ShareIcon className="h-6 w-6" />
      </button>
      {/* Always mounted so screen readers announce the message when it appears */}
      <span role="status" className={shareMessage ? "detail-share-toast" : "sr-only"}>
        {shareMessage}
      </span>
    </div>
  );
}
