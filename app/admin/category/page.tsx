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

export default function AdminCategoryPage() {
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

    const activeCount = useMemo(() => categories.filter((item) => item.status === "active").length, [categories]);

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
                setLoadError(error instanceof Error ? error.message : "Không thể tải danh sách danh mục.");
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
        if (!name || !description) return;

        setIsSubmitting(true);
        setSubmitMessage("");
        setSubmitError("");

        try {
            await createCategory({ name, description });
            setCategories((prev) => [
                {
                    id: Date.now(),
                    name,
                    description,
                    slug: toSlug(name),
                    productCount: 0,
                    status: "active",
                },
                ...prev,
            ]);
            setNewName("");
            setNewDescription("");
            setSubmitMessage("Đã tạo danh mục.");
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Có lỗi xảy ra.");
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
            setActionMessage("Đã xóa danh mục.");
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Không thể xóa danh mục.");
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
        if (!name || !description) return;

        setProcessingId(id);
        setActionMessage("");
        setActionError("");
        try {
            await updateCategory(id, { name, description });
            setCategories((prev) =>
                prev.map((item) => (item.id === id ? { ...item, name, description, slug: toSlug(name) } : item)),
            );
            setEditingId(null);
            setEditingName("");
            setEditingDescription("");
            setActionMessage("Đã cập nhật danh mục.");
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Không thể cập nhật danh mục.");
        } finally {
            setProcessingId(null);
        }
    };

    const onToggleStatus = (id: number) => {
        setCategories((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: item.status === "active" ? "hidden" : "active" } : item)),
        );
    };

    return (
        <div className="space-y-6">
            <section className="panel-strong p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admin Dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold text-header sm:text-4xl">Quản lý danh mục</h1>
                <p className="mt-2 text-sm text-slate-600">Thêm, sửa, xóa danh mục cho cửa hàng.</p>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                    {isLoadingCategories ? <div className="panel p-4 text-sm text-slate-500">Đang tải danh sách danh mục...</div> : null}
                    {loadError ? <div className="panel border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{loadError}</div> : null}

                    <div className="panel overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#fbfaf7] text-xs uppercase tracking-[0.2em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Tên</th>
                                    <th className="px-4 py-3">Slug</th>
                                    <th className="px-4 py-3">Sản phẩm</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eee7de] text-sm text-slate-700">
                                {categories.map((category) => (
                                    <tr key={category.id} className="align-top hover:bg-[#fbfaf7]">
                                        <td className="px-4 py-4 font-medium">
                                            {editingId === category.id ? (
                                                <div className="space-y-2">
                                                    <input
                                                        value={editingName}
                                                        onChange={(event) => setEditingName(event.target.value)}
                                                        className="input-modern"
                                                    />
                                                    <input
                                                        value={editingDescription}
                                                        onChange={(event) => setEditingDescription(event.target.value)}
                                                        placeholder="Mô tả danh mục"
                                                        className="input-modern text-xs"
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="font-medium text-header">{category.name}</p>
                                                    <p className="mt-1 text-xs text-slate-500">{category.description}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-slate-500">{category.slug}</td>
                                        <td className="px-4 py-4">{category.productCount}</td>
                                        <td className="px-4 py-4">
                                            <button
                                                type="button"
                                                onClick={() => onToggleStatus(category.id)}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    category.status === "active" ? "bg-slate-900 text-white" : "bg-amber-100 text-amber-900"
                                                }`}
                                            >
                                                {category.status === "active" ? "Active" : "Hidden"}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {editingId === category.id ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => onEditSave(category.id)}
                                                            disabled={processingId === category.id}
                                                            className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                                                        >
                                                            {processingId === category.id ? "Đang lưu..." : "Lưu"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                setEditingName("");
                                                                setEditingDescription("");
                                                            }}
                                                            className="rounded-full border border-[#ddd6cb] bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditStart(category)}
                                                        className="rounded-full border border-[#ddd6cb] bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                                    >
                                                        Sửa
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onDelete(category.id)}
                                                    disabled={processingId === category.id}
                                                    className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700"
                                                >
                                                    {processingId === category.id ? "Đang xóa..." : "Xóa"}
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
                    <form onSubmit={onAdd} className="panel p-5">
                        <h2 className="text-lg font-semibold text-header">Thêm danh mục</h2>
                        <p className="mt-1 text-xs text-slate-500">Nhập tên danh mục mới.</p>
                        <input
                            value={newName}
                            onChange={(event) => setNewName(event.target.value)}
                            placeholder="Ví dụ: Ly giấy"
                            className="mt-4 input-modern"
                        />
                        <textarea
                            value={newDescription}
                            onChange={(event) => setNewDescription(event.target.value)}
                            placeholder="Mô tả danh mục"
                            className="mt-3 input-modern"
                            rows={3}
                        />
                        <button type="submit" disabled={isSubmitting} className="button-primary mt-3 w-full">
                            {isSubmitting ? "Đang tạo..." : "Thêm danh mục"}
                        </button>
                        {submitMessage ? <p className="mt-2 text-xs font-medium text-emerald-700">{submitMessage}</p> : null}
                        {submitError ? <p className="mt-2 text-xs font-medium text-rose-700">{submitError}</p> : null}
                        {actionMessage ? <p className="mt-2 text-xs font-medium text-emerald-700">{actionMessage}</p> : null}
                        {actionError ? <p className="mt-2 text-xs font-medium text-rose-700">{actionError}</p> : null}
                    </form>

                    <div className="panel p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tổng quan</p>
                        <p className="mt-3 text-3xl font-semibold text-header">{categories.length}</p>
                        <p className="text-sm text-slate-500">Tổng số danh mục</p>
                        <p className="mt-4 text-sm font-medium text-slate-700">Đang hoạt động: {activeCount}</p>
                    </div>
                </aside>
            </section>
        </div>
    );
}
