"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createCategory, deleteCategory, updateCategory } from "@/lib/api/categories";
import { getCatalogCategories } from "@/lib/data/catalog";

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
        const data = await getCatalogCategories();
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
        { id: Date.now(), name, description, slug: toSlug(name), productCount: 0, status: "active" },
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
      setCategories((prev) => prev.map((item) => (item.id === id ? { ...item, name, description, slug: toSlug(name) } : item)));
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

  return (
    <div className="space-y-6">
      <section className="panel-strong p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Danh mục</p>
            <h1 className="mt-2 text-3xl font-semibold text-header">Quản lý danh mục sản phẩm</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Giữ danh mục ngắn gọn, rõ nghĩa để catalog và điều hướng public thống nhất hơn.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="rounded-full border border-[#dbe5ef] bg-white px-4 py-2 font-semibold">Tổng: {categories.length}</span>
            <span className="rounded-full border border-[#dbe5ef] bg-white px-4 py-2 font-semibold">Đang hoạt động: {activeCount}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="panel p-5 sm:p-6">
          {isLoadingCategories ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
          {loadError ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">{loadError}</p> : null}
          {actionMessage ? <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{actionMessage}</p> : null}
          {actionError ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{actionError}</p> : null}

          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-[#dbe5ef] md:block">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tên</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ebf2] text-sm text-slate-700">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-header">{category.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{category.description}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{category.slug}</td>
                    <td className="px-4 py-4">{category.productCount}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="button-secondary px-3 py-2 text-xs" onClick={() => onEditStart(category)}>Sửa</button>
                        <button type="button" className="button-ghost px-3 py-2 text-xs text-rose-700" onClick={() => void onDelete(category.id)} disabled={processingId === category.id}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-header">Thêm danh mục</h2>
          <form onSubmit={onAdd} className="mt-4 space-y-3">
            <input className="input-modern" placeholder="Tên danh mục" value={newName} onChange={(event) => setNewName(event.target.value)} />
            <textarea className="input-modern" rows={4} placeholder="Mô tả" value={newDescription} onChange={(event) => setNewDescription(event.target.value)} />
            <button className="button-primary w-full" type="submit" disabled={isSubmitting}>Tạo mới</button>
          </form>
          {submitMessage ? <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{submitMessage}</p> : null}
          {submitError ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{submitError}</p> : null}

          {editingId ? (
            <div className="mt-6 rounded-[1.5rem] border border-[#dbe5ef] bg-[#f8fafc] p-4">
              <h3 className="text-lg font-semibold text-header">Chỉnh sửa</h3>
              <div className="mt-3 grid gap-3">
                <input className="input-modern" value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                <textarea className="input-modern" rows={4} value={editingDescription} onChange={(event) => setEditingDescription(event.target.value)} />
                <div className="flex gap-3">
                  <button type="button" className="button-primary flex-1" onClick={() => void onEditSave(editingId)} disabled={processingId === editingId}>Lưu</button>
                  <button type="button" className="button-secondary flex-1" onClick={() => setEditingId(null)}>Hủy</button>
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
