import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon } from "@/components/mobile-store/icons";

type Props = {
  title: string;
  /** Đường dẫn nút quay lại. Bỏ trống nếu không cần nút back. */
  backHref?: string;
  backLabel?: string;
  /** Nội dung góc phải (ví dụ ProductActions). Mặc định là spacer giữ cân bằng. */
  rightSlot?: ReactNode;
};

export default function MobileTopBar({
  title,
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
      ) : (
        <span className="icon-button ghost" aria-hidden="true" />
      )}
      <h1>{title}</h1>
      {rightSlot ?? <span className="icon-button ghost" aria-hidden="true" />}
    </header>
  );
}
