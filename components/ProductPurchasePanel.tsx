"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";

type Props = {
    productId: number;
    name: string;
    price: number;
    categoryName: string;
};

export default function ProductPurchasePanel({ productId, name, price, categoryName }: Props) {
    const [unit, setUnit] = useState<"cay" | "thung">("cay");
    const [quantity, setQuantity] = useState(1);

    return (
        <div className="mt-8 rounded-2xl border border-[#e6e0d8] bg-[#fbfaf7] p-5">
            <h2 className="text-xl font-semibold text-header">Chọn số lượng và đơn vị</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-header">
                    Đơn vị
                    <select
                        value={unit}
                        onChange={(event) => setUnit(event.target.value as "cay" | "thung")}
                        className="input-modern"
                    >
                        <option value="cay">Cây</option>
                        <option value="thung">Thùng</option>
                    </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-header">
                    Số lượng
                    <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                        className="input-modern"
                    />
                </label>
            </div>
            <div className="mt-5">
                <AddToCartButton
                    productId={productId}
                    name={name}
                    price={price}
                    categoryName={categoryName}
                    quantity={quantity}
                    unit={unit}
                    label="Thêm vào giỏ"
                />
            </div>
        </div>
    );
}
