import Link from "next/link";
import { AdminSectionHeader } from "@/components/admin/admin-ui";
import { AdminLogoutButton, LogoutIcon } from "@/components/admin/shared";

const sections = [
    {
        href: "/admin/lid",
        label: "Nắp",
        description: "Quản lý các loại nắp ly",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M6 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M7 14c0-4 2.2-7 5-7s5 3 5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M5 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        href: "/admin/partner",
        label: "Đối tác",
        description: "Quản lý nhà cung cấp & đối tác",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        href: "/admin/category",
        label: "Danh mục",
        description: "Phân loại sản phẩm theo nhóm",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
    },
];

function ChevronRightIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-muted" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function AdminManagePage() {
    return (
        <div className="space-y-4">
            <AdminSectionHeader
                title="Quản lý"
                subtitle="Nắp, đối tác, danh mục sản phẩm và tài khoản"
            />

            <ul className="grid gap-3 md:grid-cols-2">
                {sections.map((s) => (
                    <li key={s.href}>
                        <Link href={s.href} className="admin-manage-card">
                            <span className="admin-manage-icon">{s.icon}</span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-base font-semibold leading-tight text-ink">
                                    {s.label}
                                </span>
                                <span className="mt-0.5 block text-sm text-body">
                                    {s.description}
                                </span>
                            </span>
                            <ChevronRightIcon />
                        </Link>
                    </li>
                ))}
                <li>
                    <AdminLogoutButton className="admin-manage-card">
                        <span className="admin-manage-icon">
                            <LogoutIcon />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-base font-semibold leading-tight text-ink">
                                Đăng xuất
                            </span>
                            <span className="mt-0.5 block text-sm text-body">
                                Thoát khỏi trang quản trị
                            </span>
                        </span>
                    </AdminLogoutButton>
                </li>
            </ul>
        </div>
    );
}
