import Link from "next/link";
import { getOrders } from "@/lib/api/orders";
import { getProducts } from "@/lib/api/products";
import { AdminCard, AdminSectionHeader, AdminStatusBadge, adminFormatMoney } from "@/components/admin/admin-ui";

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
          <p className="text-[13px] font-semibold leading-tight text-[#101a36]">Tong</p>
          <p className="text-[13px] font-extrabold leading-tight text-[#101a36]">{total} don</p>
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

  const productionOrders = statusCount(orders, "san xuat") || statusCount(orders, "production");
  const deliveredOrders = statusCount(orders, "giao") || statusCount(orders, "delivered");
  const canceledOrders = statusCount(orders, "huy") || statusCount(orders, "cancel");
  const pendingOrders = Math.max(orders.length - productionOrders - deliveredOrders - canceledOrders, 0);
  const estimatedRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalForChart = orders.length || deliveredOrders + productionOrders + pendingOrders + canceledOrders || 1;

  const stats = [
    { label: "Tong san pham", value: products.length.toString(), delta: products.length ? "Du lieu API" : "Chua co du lieu", suffix: "SP" },
    { label: "Yeu cau moi", value: pendingOrders.toString(), delta: pendingOrders ? "Can xu ly" : "Khong co yeu cau", suffix: "yeu cau" },
    { label: "Don dang san xuat", value: productionOrders.toString(), delta: productionOrders ? "Theo API don hang" : "Chua co don", suffix: "don hang" },
    { label: "Doanh thu tam tinh", value: adminFormatMoney(estimatedRevenue), delta: estimatedRevenue ? "Tu don hang hien co" : "Chua phat sinh", suffix: "" },
  ];

  const orderStatus = [
    { name: "Da giao hang", value: deliveredOrders, color: "bg-emerald-600" },
    { name: "Dang san xuat", value: productionOrders, color: "bg-blue-500" },
    { name: "Cho xac nhan", value: pendingOrders, color: "bg-amber-400" },
    { name: "Da huy", value: canceledOrders, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-3 text-[#101a36]">
      <AdminSectionHeader
        title="Dashboard tong quan"
        action={
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-[#eadfce] bg-white px-3 text-[13px] font-bold text-[#1f2f46] shadow-sm">
            <CalendarIcon />
            Hom nay
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
                <p className="truncate text-[28px] font-extrabold leading-none tracking-tight text-[#101a36]">{item.value}</p>
                <p className="mt-1.5 text-[11px] font-extrabold leading-tight text-emerald-600">{item.delta}</p>
              </div>
              {item.suffix ? <span className="pb-1 text-[12px] font-bold text-[#1f2f46]">{item.suffix}</span> : null}
            </div>
          </AdminCard>
        ))}
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        <Link href="/admin/product?mode=create" className="rounded-[16px] border border-[#eadfce] bg-white p-3 text-center text-[11px] font-extrabold text-[#101a36] shadow-sm">
          Them san pham
        </Link>
        <Link href="/admin/order?view=quotes" className="rounded-[16px] border border-[#eadfce] bg-white p-3 text-center text-[11px] font-extrabold text-[#101a36] shadow-sm">
          Bao gia moi
        </Link>
        <Link href="/admin/order" className="rounded-[16px] border border-[#eadfce] bg-white p-3 text-center text-[11px] font-extrabold text-[#101a36] shadow-sm">
          Don can xu ly
        </Link>
      </section>

      <AdminCard className="p-3.5">
        <h2 className="text-[17px] font-extrabold">Tinh trang don hang</h2>
        <div className="mt-3 flex items-center gap-3.5">
          <Donut total={orders.length} />
          <div className="min-w-0 flex-1 space-y-2.5">
            {orderStatus.map((item) => {
              const percent = orders.length ? Math.round((item.value / totalForChart) * 100) : 0;
              return (
                <div key={item.name} className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-[12px]">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="truncate font-semibold text-[#3d4860]">{item.name}</span>
                  <span className="font-bold text-[#101a36]">{item.value}{orders.length ? ` (${percent}%)` : ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </AdminCard>

      <AdminCard className="p-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[17px] font-extrabold">Yeu cau bao gia moi</h2>
          <Link href="/admin/order?view=quotes" className="text-[12px] font-extrabold text-emerald-700">Xem tat ca</Link>
        </div>
        {orders.length === 0 ? (
          <div className="mt-2.5 overflow-hidden rounded-[14px] border border-[#f1e7d8] bg-white px-3 py-4 text-center text-[12px] font-semibold text-slate-500">
            Chua co yeu cau bao gia nao.
          </div>
        ) : (
          <div className="mt-2.5 overflow-hidden rounded-[14px] border border-[#f1e7d8] bg-white">
            {orders.slice(0, 3).map((order) => (
              <article key={order.id} className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 border-b border-[#f1e7d8] px-3 py-2.5 last:border-b-0">
                <p className="min-w-0 text-[13px] font-extrabold text-[#101a36]">{`RQ250520-${String(order.id).slice(-3).padStart(3, "0")}`}</p>
                <p className="whitespace-nowrap text-right text-[12px] font-semibold text-[#1f2f46]">{adminFormatMoney(order.totalAmount)}</p>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-[#101a36]">{order.customerName || "Khach hang"}</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-[#3d4860]">{order.status}</p>
                </div>
                <div className="justify-self-end"><AdminStatusBadge tone="warning">Moi</AdminStatusBadge></div>
              </article>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard className="border-amber-200 bg-amber-50 p-3.5">
        <h2 className="text-[14px] font-extrabold text-[#101a36]">Canh bao van hanh</h2>
        <ul className="mt-2 space-y-1.5 text-[12px] font-semibold text-[#3d4860]">
          <li>{pendingOrders} bao gia can kiem tra trong hom nay.</li>
          <li>{productionOrders} don dang trong quy trinh san xuat.</li>
          <li>{products.filter((product) => !product.avatarImageUrl || product.price <= 0).length} san pham thieu anh hoac gia ban.</li>
        </ul>
      </AdminCard>
    </div>
  );
}
