import { ORDER_STATUS_FLOW, OrderStatus, ORDER_STATUS_LABEL } from "@/lib/orders";

type Props = {
    status: OrderStatus;
};

export default function OrderTimeline({ status }: Props) {
    const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

    return (
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
            {ORDER_STATUS_FLOW.map((step, index) => {
                const active = index <= currentIndex;
                return (
                    <div
                        key={step}
                        className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold ${
                            active
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-[#e6e0d8] bg-white text-slate-500"
                        }`}
                    >
                        {ORDER_STATUS_LABEL[step]}
                    </div>
                );
            })}
        </div>
    );
}
