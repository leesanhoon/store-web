"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createCategory, deleteCategory, getCategories, updateCategory } from "@/lib/api/categories";

type Category = {
    id: number;
    name: string;
    description: string;
    slug: string;
    productCount: number;
    status: "active" | "hidden";
};

function toSlug(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export default function AdminPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingDescription, setEditingDescription] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);

    const activeCount = useMemo(
        () => categories.filter((item) => item.status === "active").length,
        [categories],
    );

    useEffect(() => {
        const loadCategories = async () => {
            setIsLoadingCategories(true);
            setLoadError("");
            try {
                const data = await getCategories();
                const mappedCategories: Category[] = data.map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    slug: toSlug(item.name),
                    productCount: Array.isArray(item.products) ? item.products.length : 0,
                    status: "active",
                }));
                setCategories(mappedCategories);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Khong the tai danh sach category.");
            } finally {
                setIsLoadingCategories(false);
            }
        };

        loadCategories();
    }, []);

    const onAdd = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = newName.trim();
        const description = newDescription.trim();
        if (!name) return;
        if (!description) return;

        setIsSubmitting(true);
        setSubmitMessage("");
        setSubmitError("");

        try {
            await createCategory({ name, description });

            const newCategory: Category = {
                id: Date.now(),
                name,
                description,
                slug: toSlug(name),
                productCount: 0,
                status: "active",
            };

            setCategories((prev) => [newCategory, ...prev]);
            setNewName("");
            setNewDescription("");
            setSubmitMessage("Tao category thanh cong.");
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Co loi xay ra.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDelete = async (id: number) => {
        setProcessingId(id);
        setActionMessage("");
        setActionError("");
        try {
            await deleteCategory(id);
            setCategories((prev) => prev.filter((item) => item.id !== id));
            if (editingId === id) {
                setEditingId(null);
                setEditingName("");
                setEditingDescription("");
            }
            setActionMessage("Xoa category thanh cong.");
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Khong the xoa category.");
        } finally {
            setProcessingId(null);
        }
    };

    const onEditStart = (category: Category) => {
        setEditingId(category.id);
        setEditingName(category.name);
        setEditingDescription(category.description);
    };

    const onEditSave = async (id: number) => {
        const name = editingName.trim();
        const description = editingDescription.trim();
        if (!name) return;
        if (!description) return;

        setProcessingId(id);
        setActionMessage("");
        setActionError("");
        try {
            await updateCategory(id, { name, description });
            setCategories((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, name, description, slug: toSlug(name) } : item,
                ),
            );
            setEditingId(null);
            setEditingName("");
            setEditingDescription("");
            setActionMessage("Cap nhat category thanh cong.");
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Khong the cap nhat category.");
        } finally {
            setProcessingId(null);
        }
    };

    const onToggleStatus = (id: number) => {
        setCategories((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, status: item.status === "active" ? "hidden" : "active" }
                    : item,
            ),
        );
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dcfce7_0%,_#ecfeff_45%,_#f8fafc_100%)] px-4 py-10 sm:px-8">
            <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-emerald-100 bg-white/80 shadow-xl backdrop-blur">
                <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-7 text-white sm:p-9">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
                        Admin Dashboard
                    </p>
                    <h1 className="mt-3 text-3xl font-black sm:text-4xl">Quan Ly Category</h1>
                    <p className="mt-2 text-sm text-emerald-50">
                        Them, sua, xoa danh muc cho cua hang.
                    </p>
                </div>

                <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            {isLoadingCategories ? (
                                <p className="p-4 text-sm text-slate-500">Dang tai danh sach category...</p>
                            ) : null}
                            {loadError ? (
                                <p className="p-4 text-sm font-semibold text-rose-700">{loadError}</p>
                            ) : null}
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3">Ten</th>
                                        <th className="px-4 py-3">Slug</th>
                                        <th className="px-4 py-3">San pham</th>
                                        <th className="px-4 py-3">Trang thai</th>
                                        <th className="px-4 py-3 text-right">Hanh dong</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {categories.map((category) => (
                                        <tr key={category.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-semibold">
                                                {editingId === category.id ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            value={editingName}
                                                            onChange={(event) => setEditingName(event.target.value)}
                                                            className="w-full rounded-lg border border-emerald-300 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
                                                        />
                                                        <input
                                                            value={editingDescription}
                                                            onChange={(event) => setEditingDescription(event.target.value)}
                                                            placeholder="Mo ta category"
                                                            className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-xs outline-none ring-emerald-500 focus:ring-2"
                                                        />
                                                    </div>
                                                ) : (
                                                    category.name
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{category.slug}</td>
                                            <td className="px-4 py-3">{category.productCount}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => onToggleStatus(category.id)}
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                                                        category.status === "active"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-amber-100 text-amber-700"
                                                    }`}
                                                >
                                                    {category.status === "active" ? "Active" : "Hidden"}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {editingId === category.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => onEditSave(category.id)}
                                                                disabled={processingId === category.id}
                                                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                                                            >
                                                                {processingId === category.id ? "Dang luu..." : "Luu"}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingId(null);
                                                                    setEditingName("");
                                                                    setEditingDescription("");
                                                                }}
                                                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                            >
                                                                Huy
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => onEditStart(category)}
                                                            className="rounded-lg border border-cyan-300 px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50"
                                                        >
                                                            Sua
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => onDelete(category.id)}
                                                        disabled={processingId === category.id}
                                                        className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                                                    >
                                                        {processingId === category.id ? "Dang xoa..." : "Xoa"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <form
                            onSubmit={onAdd}
                            className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5"
                        >
                            <h2 className="text-lg font-black text-emerald-900">Them Category</h2>
                            <p className="mt-1 text-xs text-emerald-800">Nhap ten danh muc moi.</p>
                            <input
                                value={newName}
                                onChange={(event) => setNewName(event.target.value)}
                                placeholder="Vi du: Hop giay cao cap"
                                className="mt-4 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
                            />
                            <textarea
                                value={newDescription}
                                onChange={(event) => setNewDescription(event.target.value)}
                                placeholder="Mo ta category"
                                className="mt-3 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
                                rows={3}
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-3 w-full rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? "Dang tao..." : "Them category"}
                            </button>
                            {submitMessage ? (
                                <p className="mt-2 text-xs font-semibold text-emerald-700">{submitMessage}</p>
                            ) : null}
                            {submitError ? (
                                <p className="mt-2 text-xs font-semibold text-rose-700">{submitError}</p>
                            ) : null}
                            {actionMessage ? (
                                <p className="mt-2 text-xs font-semibold text-emerald-700">{actionMessage}</p>
                            ) : null}
                            {actionError ? (
                                <p className="mt-2 text-xs font-semibold text-rose-700">{actionError}</p>
                            ) : null}
                        </form>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Tong quan
                            </p>
                            <p className="mt-3 text-3xl font-black text-slate-800">{categories.length}</p>
                            <p className="text-sm text-slate-500">Tong so category</p>
                            <p className="mt-4 text-sm font-semibold text-emerald-700">
                                Dang hoat dong: {activeCount}
                            </p>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}
