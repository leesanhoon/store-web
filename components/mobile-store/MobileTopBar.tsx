import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon } from "@/components/mobile-store/icons";

type Props = {
  title: string;
  /** Dùng "p" khi trang đã có h1 riêng (ví dụ tên sản phẩm). */
  titleAs?: "h1" | "p";
  /** Đường dẫn nút quay lại. Bỏ trống nếu không cần nút back. */
  backHref?: string;
  backLabel?: string;
  /** Nội dung góc phải (ví dụ ProductActions). */
  rightSlot?: ReactNode;
};

export default function MobileTopBar({
  title,
  titleAs: Title = "h1",
  backHref,
  backLabel = "Quay lại",
  rightSlot,
}: Props) {
  return (
    <header className="mobile-topbar">
      {backHref ? (
        <Link href={backHref} className="icon-button ghost" aria-label={backLabel}>
          <BackIcon className="h-6 w-6" />
        </Link>
      ) : null}
      <Title className="mobile-topbar-title">{title}</Title>
      {rightSlot}
    </header>
  );
}
