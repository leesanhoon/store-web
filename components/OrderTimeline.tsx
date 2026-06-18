import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/api/orders";

type Props = { status: OrderStatus };

const STATUS_STEPS: OrderStatus[] = ["PendingConfirmation", "Confirmed", "Shipping", "Completed"];

export default function OrderTimeline({ status }: Props) {
  if (status === "Cancelled") {
    return (
      <div className="rounded-full border border-rose-200 bg-rose-50 px-3 py-3 text-center text-xs font-semibold text-rose-600">
        Đã hủy
      </div>
    );
  }
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Tiến trình đơn hàng">
      {STATUS_STEPS.map((step, index) => {
        const active = index <= currentIndex;
        return (
          <div
            key={step}
            className={`rounded-full border px-3 py-3 text-center text-xs font-semibold ${
              active
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-[#e5ebf2] bg-white text-slate-500"
            }`}
          >
            {ORDER_STATUS_LABELS[step]}
          </div>
        );
      })}
    </div>
  );
}
