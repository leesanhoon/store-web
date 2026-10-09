"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminField } from "@/components/admin/admin-ui";
import { InlineSpinner } from "@/components/ui/LoadingOverlay";
import {
    isAdminAuthenticated,
    setAdminToken,
} from "@/lib/admin-auth";
import { apiClient, ApiError } from "@/lib/api/http";

function AccountContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);
    const nextPath = useMemo(() => {
        const next = searchParams.get("next");
        return next?.startsWith("/admin") ? next : "/admin";
    }, [searchParams]);

    useEffect(() => {
        if (isAdminAuthenticated()) {
            router.replace(nextPath);
        }
    }, [nextPath, router]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!username.trim() || !password) {
            setError("Tài khoản và mật khẩu không được để trống.");
            return;
        }

        setPending(true);
        try {
            const response = await apiClient.post<{ token: string; expiresIn: number }>(
                "/api/v1/auth/login",
                { username: username.trim(), password }
            );

            setError("");
            setAdminToken(response.token);
            // pending stays on until the redirect unmounts the page
            router.replace(nextPath);
        } catch (err) {
            const badCredentials =
                err instanceof ApiError && (err.status === 400 || err.status === 401);
            setError(
                badCredentials
                    ? "Sai tài khoản hoặc mật khẩu."
                    : "Không đăng nhập được. Vui lòng thử lại sau ít phút."
            );
            setPending(false);
        }
    };

    return (
        <section
            aria-labelledby="login-title"
            className="w-full max-w-[400px] rounded-lg border border-line bg-white p-6 shadow-sm sm:p-8"
        >
            <Link href="/" className="inline-flex min-h-11 items-center">
                <Image
                    src="/images/logo.png"
                    alt="In ly DTP - CN Quảng Ngãi"
                    width={61}
                    height={40}
                    className="h-10 w-auto"
                    priority
                />
            </Link>

            <h1
                id="login-title"
                className="mt-4 text-2xl font-semibold leading-tight text-ink"
            >
                Đăng nhập quản trị
            </h1>

            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
                <div>
                    <label
                        htmlFor="admin-username"
                        className="mb-1.5 block text-sm font-medium text-label"
                    >
                        Tài khoản
                    </label>
                    <AdminField
                        id="admin-username"
                        name="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        aria-describedby={error ? "login-error" : undefined}
                    />
                </div>

                <div>
                    <label
                        htmlFor="admin-password"
                        className="mb-1.5 block text-sm font-medium text-label"
                    >
                        Mật khẩu
                    </label>
                    <AdminField
                        id="admin-password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                        aria-describedby={error ? "login-error" : undefined}
                    />
                </div>

                {error ? (
                    <p
                        id="login-error"
                        role="alert"
                        className="rounded-sm border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger"
                    >
                        {error}
                    </p>
                ) : null}

                <button
                    type="submit"
                    disabled={pending}
                    className="button-primary w-full"
                >
                    {pending ? (
                        <>
                            <InlineSpinner className="h-4 w-4" />
                            Đang đăng nhập…
                        </>
                    ) : (
                        "Đăng nhập"
                    )}
                </button>
            </form>
        </section>
    );
}

export default function AccountPage() {
    return (
        <main className="grid min-h-dvh place-items-center bg-surface px-4 py-12">
            <Suspense
                fallback={
                    <p role="status" className="text-sm text-muted">
                        Đang mở đăng nhập…
                    </p>
                }
            >
                <AccountContent />
            </Suspense>
        </main>
    );
}
