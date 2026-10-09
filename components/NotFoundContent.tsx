import Link from "next/link";

export const notFoundMetadata = {
  title: "Không tìm thấy trang",
};

export default function NotFoundContent() {
  return (
    <div className="notfound-screen">
      <p className="notfound-code">404</p>
      <h1 className="notfound-title">Không tìm thấy trang này</h1>
      <p className="notfound-copy">
        Liên kết có thể đã thay đổi hoặc sản phẩm không còn được hiển thị.
        Bạn có thể quay lại trang sản phẩm để tiếp tục chọn mẫu ly.
      </p>
      <div className="notfound-actions">
        <Link href="/" className="button-primary">
          Về trang chủ
        </Link>
        <Link href="/products" className="button-secondary">
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
}
