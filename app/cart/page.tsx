"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const cartItems = [
    {
        id: 1,
        name: "iPhone 15 Pro Max",
        price: 34990000,
        quantity: 1,
        image: "📱",
    },
    {
        id: 2,
        name: "MacBook Pro M3",
        price: 45990000,
        quantity: 1,
        image: "💻",
    },
];

export default function CartPage() {
    const [items, setItems] = useState(cartItems);

    const total = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Giỏ hàng của bạn</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-2/3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 uppercase text-sm">
                                <tr>
                                    <th className="px-6 py-4">Sản phẩm</th>
                                    <th className="px-6 py-4 text-center">
                                        Số lượng
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Giá
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 flex items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-2xl">
                                                {item.image}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {item.name}
                                                </div>
                                                <button className="text-red-500 text-sm hover:underline mt-1">
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center border border-gray-200 rounded-lg">
                                                <button className="px-3 py-1 hover:bg-gray-50 border-r border-gray-200">
                                                    -
                                                </button>
                                                <span className="px-4 py-1">
                                                    {item.quantity}
                                                </span>
                                                <button className="px-3 py-1 hover:bg-gray-50 border-l border-gray-200">
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">
                                            {(
                                                item.price * item.quantity
                                            ).toLocaleString("vi-VN")}{" "}
                                            ₫
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:w-1/3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold mb-4">Tổng cộng</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between text-gray-600">
                                <span>Tạm tính</span>
                                <span>{total.toLocaleString("vi-VN")} ₫</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Phí vận chuyển</span>
                                <span className="text-green-600 font-medium">
                                    Miễn phí
                                </span>
                            </div>
                            <hr className="border-dashed border-gray-200" />
                            <div className="flex justify-between text-xl font-bold text-gray-900">
                                <span>Tổng tiền</span>
                                <span>{total.toLocaleString("vi-VN")} ₫</span>
                            </div>
                            <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg mt-4">
                                Thanh toán ngay
                            </button>
                            <p className="text-center text-gray-500 text-sm mt-4 italic">
                                Miễn phí đổi trả trong 30 ngày
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
