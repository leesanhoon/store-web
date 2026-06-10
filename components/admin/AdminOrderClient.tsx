"use client";

import { AdminCard, AdminSectionHeader } from "@/components/admin/admin-ui";

export default function AdminOrderClient() {
    return (
        <div className="space-y-3 text-[#101a36]">
            <AdminSectionHeader title="Đơn hàng" />
            <AdminCard className="p-6 text-center">
                <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-amber-50">
                    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-amber-500" aria-hidden="true">
                        <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h2 className="text-[16px] font-extrabold">Hệ thống đơn hàng đang được thiết kế lại</h2>
                <p className="mt-2 text-[13px] font-semibold text-slate-500">
                    Tính năng quản lý đơn hàng sẽ sớm được cập nhật trong phiên bản tiếp theo.
                </p>
            </AdminCard>
        </div>
    );
}
