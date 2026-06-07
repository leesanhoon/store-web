import Link from "next/link";
import { AdminCard, AdminSectionHeader, AdminStatusBadge, adminFormatMoney } from "@/components/admin/admin-ui";

const stats = [
  { label: "Tổng sản phẩm", value: "128", delta: "+8", suffix: "SP" },
  { label: "Yêu cầu mới", value: "16", delta: "+5", suffix: "yêu cầu" },
  { label: "Đơn đang sản xuất", value: "24", delta: "+6", suffix: "đơn hàng" },
  { label: "Doanh thu tạm tính", value: adminFormatMoney(48650000), delta: "↑ 12% so với hôm qua", suffix: "" },
];

const orderStatus = [
  { name: "Đã giao hàng", value: "42", percent: "25%", color: "bg-emerald-600" },
  { name: "Đang sản xuất", value: "58", percent: "35%", color: "bg-blue-500" },
  { name: "Chờ xác nhận", value: "30", percent: "18%", color: "bg-amber-400" },
  { name: "Đã hủy", value: "36", percent: "22%", color: "bg-orange-500" },
  { name: "Khác", value: "-", percent: "", color: "bg-slate-300" },
];

const quotes = [
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

function Donut() {
  return (
    <div className="relative grid h-[116px] w-[116px] shrink-0 place-items-center rounded-full bg-[conic-gradient(#08964f_0_25%,#3b8eed_25%_60%,#f2b431_60%_78%,#f15b2f_78%_100%)]">
      <div className="grid h-[70px] w-[70px] place-items-center rounded-full bg-white text-center shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div>
          <p className="text-[13px] font-semibold leading-tight text-[#0b1b3b]">Tổng</p>
          <p className="text-[13px] font-extrabold leading-tight text-[#0b1b3b]">166 đơn</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
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
                <p className="truncate text-[29px] font-extrabold leading-none tracking-tight text-[#0b1b3b]">{item.value}</p>
                <p className="mt-1.5 text-[12px] font-extrabold leading-none text-emerald-600">{item.delta}</p>
              </div>
              {item.suffix ? <span className="pb-1 text-[12px] font-bold text-[#1f2f46]">{item.suffix}</span> : null}
            </div>
          </AdminCard>
        ))}
      </section>

      <AdminCard className="p-3.5">
        <h2 className="text-[17px] font-extrabold">Tình trạng đơn hàng</h2>
        <div className="mt-3 flex items-center gap-3.5">
          <Donut />
          <div className="min-w-0 flex-1 space-y-2.5">
            {orderStatus.map((item) => (
              <div key={item.name} className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-[12px]">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="truncate font-semibold text-[#3d4860]">{item.name}</span>
                <span className="font-bold text-[#0b1b3b]">{item.value}{item.percent ? ` (${item.percent})` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </AdminCard>

      <AdminCard className="p-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[17px] font-extrabold">Yêu cầu báo giá mới</h2>
          <Link href="/admin/order?view=quotes" className="text-[12px] font-extrabold text-emerald-700">Xem tất cả</Link>
        </div>
        <div className="mt-2.5 overflow-hidden rounded-[14px] border border-[#f1e7d8] bg-white">
          {quotes.map((quote) => (
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
    </div>
  );
}
