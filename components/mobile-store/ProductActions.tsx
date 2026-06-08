"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { HeartIcon, ShareIcon } from "@/components/mobile-store/icons";
import { isWishlisted, subscribeWishlist, toggleWishlist } from "@/lib/wishlist";

type Props = {
  productId: number;
  name: string;
};

export default function ProductActions({ productId, name }: Props) {
  const liked = useSyncExternalStore(
    subscribeWishlist,
    () => isWishlisted(productId),
    () => false,
  );
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
      <button
        type="button"
        aria-label={liked ? "Bỏ yêu thích" : "Yêu thích"}
        aria-pressed={liked}
        className={liked ? "active" : undefined}
        onClick={() => toggleWishlist(productId)}
      >
        <HeartIcon className="h-6 w-6" style={liked ? { fill: "currentColor" } : undefined} />
      </button>
      <button type="button" aria-label="Chia sẻ" onClick={handleShare}>
        <ShareIcon className="h-6 w-6" />
      </button>
      {shareMessage ? (
        <span role="status" className="detail-share-toast">
          {shareMessage}
        </span>
      ) : null}
    </div>
  );
}
