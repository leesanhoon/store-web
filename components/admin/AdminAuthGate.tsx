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
      <div role="status" className="grid min-h-[320px] place-items-center px-6 text-center">
        <div>
          <p className="text-base font-semibold text-ink">Đang kiểm tra đăng nhập</p>
          <p className="mt-2 text-sm text-muted">Vui lòng đăng nhập để vào quản trị.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
