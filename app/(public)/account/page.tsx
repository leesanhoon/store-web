"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import {
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    isAdminAuthenticated,
    setAdminAuthenticated,
} from "@/lib/admin-auth";

function LockIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7"
            aria-hidden="true"
        >
            <path
                d="M7 10V8a5 5 0 0 1 10 0v2"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
            <path
                d="M6 10h12v10H6V10Z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinejoin="round"
            />
            <path
                d="M12 14v2.5"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
        </svg>
    );
}

function AccountContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const nextPath = useMemo(() => {
        const next = searchParams.get("next");
        return next?.startsWith("/admin") ? next : "/admin";
    }, [searchParams]);

    useEffect(() => {
        if (isAdminAuthenticated()) {
            router.replace(nextPath);
        }
    }, [nextPath, router]);

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            setError("Tài khoản hoặc mật khẩu không đúng.");
            return;
        }

        setError("");
        setAdminAuthenticated();
        router.replace(nextPath);
    };

    return (
        <MobileAppShell>
            <div className="catalog-screen text-[#101a36]">
                <MobileTopBar title="Đăng nhập" backHref="/" backLabel="Quay lại trang chủ" />
                <section className="rounded-[18px] border border-[#eadfce] bg-white p-4 shadow-[0_22px_45px_-36px_rgba(15,23,42,0.45)]">
                    <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <LockIcon />
                        </span>
                        <div>
                            <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                                Admin
                            </p>
                            <h1 className="text-[23px] font-extrabold leading-tight">
                                Đăng nhập
                            </h1>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
                        <label className="block">
                            <span className="mb-1.5 block text-[13px] font-extrabold">
                                Tài khoản
                            </span>
                            <input
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
                                autoComplete="username"
                                placeholder="Nhập tài khoản"
                                className="h-12 w-full rounded-[14px] border border-[#eadfce] bg-white px-3.5 text-[14px] font-bold outline-none placeholder:text-slate-400 focus:border-[#101a36] focus:ring-2 focus:ring-[#101a36]/10"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-[13px] font-extrabold">
                                Mật khẩu
                            </span>
                            <input
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                type="password"
                                autoComplete="current-password"
                                placeholder="Nhập mật khẩu"
                                className="h-12 w-full rounded-[14px] border border-[#eadfce] bg-white px-3.5 text-[14px] font-bold outline-none placeholder:text-slate-400 focus:border-[#101a36] focus:ring-2 focus:ring-[#101a36]/10"
                            />
                        </label>

                        {error ? (
                            <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-700">
                                {error}
                            </p>
                        ) : null}

                        <button
                            type="submit"
                            className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-[16px] bg-[#101a36] px-4 py-3 text-[15px] font-extrabold text-white shadow-[0_18px_30px_-22px_rgba(16,26,54,0.9)] transition hover:bg-[#1c2a4d] active:scale-[0.98]"
                        >
                            Đăng nhập
                        </button>
                    </form>
                </section>
            </div>
        </MobileAppShell>
    );
}

export default function AccountPage() {
    return (
        <Suspense
            fallback={
                <MobileAppShell>
                    <main className="grid min-h-full place-items-center bg-[#fffaf2] px-4 pb-24 pt-5 text-center text-[#101a36]">
                        <div>
                            <p className="text-[15px] font-extrabold">
                                Đang mở đăng nhập
                            </p>
                            <p className="mt-2 text-[12px] font-semibold text-slate-500">
                                Vui lòng chờ trong giây lát.
                            </p>
                        </div>
                    </main>
                </MobileAppShell>
            }
        >
            <AccountContent />
        </Suspense>
    );
}
