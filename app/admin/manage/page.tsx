"use client";

import Link from "next/link";

const sections = [
    {
        href: "/admin/lid",
        label: "Nắp",
        description: "Quản lý các loại nắp ly",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path d="M6 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M7 14c0-4 2.2-7 5-7s5 3 5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M5 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
        ),
        color: "#0f766e",
        bg: "rgba(15, 118, 110, 0.08)",
    },
    {
        href: "/admin/partner",
        label: "Đối tác",
        description: "Quản lý nhà cung cấp & đối tác",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        color: "#7c3aed",
        bg: "rgba(124, 58, 237, 0.08)",
    },
    {
        href: "/admin/category",
        label: "Danh mục",
        description: "Phân loại sản phẩm theo nhóm",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
        color: "#c2740a",
        bg: "rgba(194, 116, 10, 0.08)",
    },
];

export default function AdminManagePage() {
    return (
        <div className="px-4 py-5">
            <h1 className="text-[20px] font-extrabold text-[#101a36] tracking-tight mb-1">
                Quản lý
            </h1>
            <p className="text-[12px] text-[#8b95a8] font-medium mb-5">
                Nắp, đối tác & danh mục sản phẩm
            </p>

            <div className="flex flex-col gap-3">
                {sections.map((s) => (
                    <Link
                        key={s.href}
                        href={s.href}
                        className="admin-manage-card group"
                    >
                        <span
                            className="admin-manage-icon"
                            style={{ background: s.bg, color: s.color }}
                        >
                            {s.icon}
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="block text-[14px] font-bold text-[#101a36] leading-tight">
                                {s.label}
                            </span>
                            <span className="block text-[11px] text-[#8b95a8] font-medium mt-0.5">
                                {s.description}
                            </span>
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#c5cad4] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                ))}
            </div>
        </div>
    );
}
