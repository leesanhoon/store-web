import Link from "next/link";

const modules = [
  {
    title: "Quản lý sản phẩm",
    href: "/admin/product",
    summary: "Tạo, sửa, xóa sản phẩm ly nhựa/ly giấy, cập nhật giá, tồn kho và danh mục.",
    tasks: ["Tạo sản phẩm mới", "Chỉnh sửa thông tin sản phẩm", "Xóa sản phẩm không còn bán", "Cập nhật giá và tồn kho"],
  },
  {
    title: "Quản lý danh mục",
    href: "/admin/category",
    summary: "Tạo và chỉnh sửa danh mục sản phẩm để tổ chức catalog theo nhu cầu kinh doanh.",
    tasks: ["Thêm danh mục mới", "Sửa tên/mô tả danh mục", "Xóa danh mục không dùng", "Theo dõi số lượng sản phẩm"],
  },
  {
    title: "Quản lý đơn hàng in",
    href: "/admin/order",
    summary: "Theo dõi tiến độ đơn in, cập nhật trạng thái, ghi chú nội bộ và file mockup.",
    tasks: ["Xem toàn bộ đơn hàng", "Cập nhật trạng thái", "Lưu ghi chú nội bộ", "Ghi nhận file mockup đã gửi"],
  },
];

const quickLinks = [
  { label: "Sản phẩm", href: "/admin/product" },
  { label: "Danh mục", href: "/admin/category" },
  { label: "Đơn hàng", href: "/admin/order" },
  { label: "Materials", href: "/admin/materials" },
  { label: "Print types", href: "/admin/print-types" },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <section className="panel-strong overflow-hidden p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Admin center</p>
        <h1 className="mt-2 text-3xl font-semibold text-header sm:text-4xl">Tổng quan chức năng quản trị</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Tại khu vực quản trị, bạn có thể vào nhanh từng module để quản lý sản phẩm, danh mục, đơn hàng và cấu hình in.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {modules.map((module) => (
          <article key={module.title} className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Module</p>
            <h2 className="mt-2 text-xl font-semibold text-header">{module.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{module.summary}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {module.tasks.map((task) => <li key={task}>• {task}</li>)}
            </ul>
            <Link href={module.href} className="button-primary mt-5">
              Mở chức năng
            </Link>
          </article>
        ))}
      </section>

      <section className="panel p-6">
        <h2 className="text-xl font-semibold text-header">Truy cập nhanh</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} className="button-secondary">
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
