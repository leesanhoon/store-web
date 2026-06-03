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
        <div className="mt-8 rounded-[1.5rem] border border-[#e5ddd1] bg-[#fcfaf7] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-xl font-semibold text-header">Cấu hình đơn đặt</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
                Chọn số lượng, mẫu ly, kích thước, chất liệu và cách in trong popup trước khi thêm vào giỏ.
            </p>
            <div className="mt-5">
                <AddToCartButton productId={productId} name={name} price={price} categoryName={categoryName} label="Chọn cấu hình" />
            </div>
        </div>
    );
}
