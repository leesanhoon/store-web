"use client";

import AddToCartButton from "@/components/AddToCartButton";

type Props = {
  productId: number;
  name: string;
  price: number;
  categoryName: string;
};

export default function ProductPurchasePanel({ productId, name, price, categoryName }: Props) {
  return (
    <div className="mt-8 rounded-[1.75rem] border border-[#e5ebf2] bg-[#f8fafc] p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-header">Cấu hình đặt hàng</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Chọn số lượng, mẫu ly, kích thước, chất liệu và cách in trước khi thêm vào giỏ.</p>
        </div>
        <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">Chọn nhanh để đặt</div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#e7ddd1] bg-white p-4 text-sm text-slate-600">MOQ gợi ý: từ 1.000 ly</div>
        <div className="rounded-2xl border border-[#e7ddd1] bg-white p-4 text-sm text-slate-600">Hỗ trợ báo giá qua Gmail</div>
      </div>
      <div className="mt-5">
        <AddToCartButton productId={productId} name={name} price={price} categoryName={categoryName} label="Chọn cấu hình" />
      </div>
    </div>
  );
}
