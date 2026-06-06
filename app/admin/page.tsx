import Link from "next/link";

const modules = [
  {
    title: "Quản lý sản phẩm",
    href: "/admin/product",
    summary: "Tạo, sửa, xóa sản phẩm và cập nhật giá, tồn kho, danh mục.",
  },
  {
    title: "Quản lý danh mục",
    href: "/admin/category",
    summary: "Tổ chức catalog theo nhóm danh mục để dễ lọc và vận hành.",
  },
  {
    title: "Quản lý đơn hàng",
    href: "/admin/order",
    summary: "Theo dõi tiến độ đơn, trạng thái và chi tiết từng đơn hàng.",
  },
  {
    title: "Cấu hình vật liệu",
    href: "/admin/materials",
    summary: "Quản lý material và giá cộng thêm cho từng cấu hình.",
  },
  {
    title: "Cấu hình in",
    href: "/admin/print-types",
    summary: "Quản lý kiểu in và giá cộng thêm theo option.",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <section className="panel-strong overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Admin center
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-header sm:text-4xl">
              Tổng quan quản trị
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Giao diện admin được giữ tương tự về chức năng nhưng làm lại theo bố cục gọn và dễ dùng trên mobile.
            </p>
          </div>
          <Link href="/admin/product" className="button-primary">
            Mở quản lý sản phẩm
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <article key={module.title} className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Module
            </p>
            <h3 className="mt-2 text-xl font-semibold text-header">{module.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{module.summary}</p>
            <Link href={module.href} className="button-secondary mt-5 w-full">
              Mở chức năng
            </Link>
          </article>
        ))}
      </section>

      <section className="panel p-6">
        <h2 className="text-xl font-semibold text-header">Lưu ý vận hành</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Những module này vẫn dùng nguồn dữ liệu hiện tại từ API. Nếu bạn muốn, bước sau tôi có thể tiếp tục tối ưu riêng từng trang admin để đồng bộ với mobile-first shell này.
        </p>
      </section>
    </div>
  );
}
