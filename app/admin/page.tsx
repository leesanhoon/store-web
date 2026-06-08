import Link from "next/link";
import { getOrders } from "@/lib/api/orders";
import { getProducts } from "@/lib/api/products";
import { AdminCard, AdminSectionHeader, AdminStatusBadge, adminFormatMoney } from "@/components/admin/admin-ui";

const fallbackQuotes = [
  { code: "RQ250520-001", customer: "The Daily Café", product: "Ly PET 16oz", qty: "500 sp", status: "Mới" },
  { code: "RQ250520-002", customer: "Green Coffee", product: "Ly giấy 12oz", qty: "1.000 sp", status: "Mới" },
  { code: "RQ250520-003", customer: "Kaffa House", product: "Ly PET 20oz", qty: "800 sp", status: "Mới" },
];

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function Donut({ total }: { total: number }) {
  return (
    <div className="relative grid h-[116px] w-[116px] shrink-0 place-items-center rounded-full bg-[conic-gradient(#08964f_0_25%,#3b8eed_25%_60%,#f2b431_60%_78%,#f15b2f_78%_100%)]">
      <div className="grid h-[70px] w-[70px] place-items-center rounded-full bg-white text-center shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div>
          <p className="text-[13px] font-semibold leading-tight text-[#0b1b3b]">Tổng</p>
          <p className="text-[13px] font-extrabold leading-tight text-[#0b1b3b]">{total} đơn</p>
        </div>
      </div>
    </div>
  );
}

function statusCount(orders: Array<{ status: string }>, needle: string) {
  return orders.filter((order) => order.status.toLowerCase().includes(needle)).length;
}

export default async function AdminPage() {
  const [products, orders] = await Promise.all([
    getProducts().catch(() => []),
    getOrders().catch(() => []),
  ]);

  const productionOrders = statusCount(orders, "sản xuất") || statusCount(orders, "production");
  const deliveredOrders = statusCount(orders, "giao") || statusCount(orders, "delivered");
  const canceledOrders = statusCount(orders, "hủy") || statusCount(orders, "cancel");
  const pendingOrders = Math.max(orders.length - productionOrders - deliveredOrders - canceledOrders, 0);
  const estimatedRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const quoteCount = orders.length === 0 ? fallbackQuotes.length : pendingOrders;
  const totalForChart = orders.length || deliveredOrders + productionOrders + pendingOrders + canceledOrders || 1;

  const stats = [
    { label: "Tổng sản phẩm", value: products.length.toString(), delta: products.length ? "Dữ liệu API" : "Chưa có dữ liệu", suffix: "SP" },
    { label: "Yêu cầu mới", value: quoteCount.toString(), delta: quoteCount ? "Cần xử lý" : "Đã xử lý hết", suffix: "yêu cầu" },
    { label: "Đơn đang sản xuất", value: productionOrders.toString(), delta: productionOrders ? "Theo API đơn hàng" : "Chưa có đơn", suffix: "đơn hàng" },
    { label: "Doanh thu tạm tính", value: adminFormatMoney(estimatedRevenue), delta: estimatedRevenue ? "Từ đơn hàng hiện có" : "Chưa phát sinh", suffix: "" },
  ];

  const orderStatus = [
    { name: "Đã giao hàng", value: deliveredOrders, color: "bg-emerald-600" },
    { name: "Đang sản xuất", value: productionOrders, color: "bg-blue-500" },
    { name: "Chờ xác nhận", value: pendingOrders, color: "bg-amber-400" },
    { name: "Đã hủy", value: canceledOrders, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-3 text-[#0b1b3b]">
      <AdminSectionHeader
        title="Dashboard tổng quan"
        action={
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-[#eadfce] bg-white px-3 text-[13px] font-bold text-[#1f2f46] shadow-sm">
            <CalendarIcon />
            Hôm nay
            <span aria-hidden="true" className="text-xl leading-none">›</span>
          </button>
        }
      />

      <section className="grid grid-cols-2 gap-2.5">
        {stats.map((item) => (
          <AdminCard key={item.label} className="min-h-[88px] p-3.5">
            <p className="text-[13px] font-bold leading-tight text-[#1f2f46]">{item.label}</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[28px] font-extrabold leading-none tracking-tight text-[#0b1b3b]">{item.value}</p>
                <p className="mt-1.5 text-[11px] font-extrabold leading-tight text-emerald-600">{item.delta}</p>
              </div>
              {item.suffix ? <span className="pb-1 text-[12px] font-bold text-[#1f2f46]">{item.suffix}</span> : null}
            </div>
          </AdminCard>
        ))}
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        <Link href="/admin/product?mode=create" className="rounded-[16px] border border-[#eadfce] bg-white p-3 text-center text-[11px] font-extrabold text-[#0b1b3b] shadow-sm">
          Thêm sản phẩm
        </Link>
        <Link href="/admin/order?view=quotes" className="rounded-[16px] border border-[#eadfce] bg-white p-3 text-center text-[11px] font-extrabold text-[#0b1b3b] shadow-sm">
          Báo giá mới
        </Link>
        <Link href="/admin/order" className="rounded-[16px] border border-[#eadfce] bg-white p-3 text-center text-[11px] font-extrabold text-[#0b1b3b] shadow-sm">
          Đơn cần xử lý
        </Link>
      </section>

      <AdminCard className="p-3.5">
        <h2 className="text-[17px] font-extrabold">Tình trạng đơn hàng</h2>
        <div className="mt-3 flex items-center gap-3.5">
          <Donut total={orders.length} />
          <div className="min-w-0 flex-1 space-y-2.5">
            {orderStatus.map((item) => {
              const percent = orders.length ? Math.round((item.value / totalForChart) * 100) : 0;
              return (
                <div key={item.name} className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-[12px]">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="truncate font-semibold text-[#3d4860]">{item.name}</span>
                  <span className="font-bold text-[#0b1b3b]">{item.value}{orders.length ? ` (${percent}%)` : ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </AdminCard>

      <AdminCard className="p-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[17px] font-extrabold">Yêu cầu báo giá mới</h2>
          <Link href="/admin/order?view=quotes" className="text-[12px] font-extrabold text-emerald-700">Xem tất cả</Link>
        </div>
        <div className="mt-2.5 overflow-hidden rounded-[14px] border border-[#f1e7d8] bg-white">
          {fallbackQuotes.map((quote) => (
            <article key={quote.code} className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 border-b border-[#f1e7d8] px-3 py-2.5 last:border-b-0">
              <p className="min-w-0 text-[13px] font-extrabold text-[#0b1b3b]">{quote.code}</p>
              <p className="whitespace-nowrap text-right text-[12px] font-semibold text-[#1f2f46]">{quote.qty}</p>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-[#0b1b3b]">{quote.customer}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#3d4860]">{quote.product}</p>
              </div>
              <div className="justify-self-end"><AdminStatusBadge tone="warning">{quote.status}</AdminStatusBadge></div>
            </article>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="border-amber-200 bg-amber-50 p-3.5">
        <h2 className="text-[14px] font-extrabold text-[#0b1b3b]">Cảnh báo vận hành</h2>
        <ul className="mt-2 space-y-1.5 text-[12px] font-semibold text-[#3d4860]">
          <li>{quoteCount} báo giá cần kiểm tra trong hôm nay.</li>
          <li>{productionOrders} đơn đang trong quy trình sản xuất.</li>
          <li>{products.filter((product) => !product.avatarImageUrl || product.price <= 0).length} sản phẩm thiếu ảnh hoặc giá bán.</li>
        </ul>
      </AdminCard>
    </div>
  );
}
