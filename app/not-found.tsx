import Link from "next/link";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";

export const metadata = {
  title: "Không tìm thấy trang",
};

export default function NotFound() {
  return (
    <MobileAppShell>
      <div className="notfound-screen">
        <span className="notfound-code">404</span>
        <h1 className="notfound-title">Không tìm thấy trang này</h1>
        <p className="notfound-copy">
          Liên kết có thể đã thay đổi hoặc sản phẩm không còn được hiển thị.
          Bạn có thể quay lại danh mục để tiếp tục chọn mẫu ly.
        </p>
        <div className="notfound-actions">
          <Link href="/" className="button-primary">
            Về trang chủ
            <span className="cta-arrow" aria-hidden>↗</span>
          </Link>
          <Link href="/products" className="button-secondary">
            Xem danh mục sản phẩm
          </Link>
        </div>
      </div>
    </MobileAppShell>
  );
}
