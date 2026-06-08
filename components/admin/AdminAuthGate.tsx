"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useSyncExternalStore } from "react";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const allowed = useSyncExternalStore(
    () => () => undefined,
    isAdminAuthenticated,
    () => false,
  );

  useEffect(() => {
    if (allowed) return;

    const query = searchParams.toString();
    const next = `${pathname}${query ? `?${query}` : ""}`;
    router.replace(`/account?next=${encodeURIComponent(next)}`);
  }, [allowed, pathname, router, searchParams]);

  if (!allowed) {
    return (
      <div className="grid min-h-[320px] place-items-center px-6 text-center text-[#0b1b3b]">
        <div>
          <p className="text-[15px] font-extrabold">Đang kiểm tra đăng nhập</p>
          <p className="mt-2 text-[12px] font-semibold text-slate-500">Vui lòng đăng nhập để vào quản trị.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
