"use client";

import { useCallback, useEffect, useState } from "react";
import {
    CategoryTreeNode,
    getCategoryTree,
    createCategory,
    updateCategory,
    deleteCategory,
} from "@/lib/api/categories";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import {
    AdminCard,
    AdminField,
    AdminPrimaryButton,
    AdminSectionHeader,
    AdminStatusBadge,
    AdminTextArea,
} from "@/components/admin/admin-ui";

type EditingCategory = {
    id: number | null;
    parentId: number | null;
    name: string;
    description: string;
};

function CategoryTreeItem({
    node,
    depth,
    onEdit,
    onDelete,
    onAddChild,
}: {
    node: CategoryTreeNode;
    depth: number;
    onEdit: (node: CategoryTreeNode) => void;
    onDelete: (node: CategoryTreeNode) => void;
    onAddChild: (parentId: number) => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children.length > 0;

    return (
        <div>
            <div
                className="rounded-[18px] border border-[#eadfce] bg-white p-2.5 shadow-[0_18px_30px_-28px_rgba(15,23,42,0.3)]"
                style={{ marginLeft: depth * 16 }}
            >
                <div className="flex items-center gap-2">
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => setExpanded(!expanded)}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-500"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className={`h-4 w-4 transition ${expanded ? "rotate-90" : ""}`}
                                aria-hidden="true"
                            >
                                <path
                                    d="m9 6 6 6-6 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    ) : (
                        <span className="w-6" />
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-[14px] font-extrabold text-[#101a36]">
                                {node.name}
                            </h3>
                            {node.parentId == null ? (
                                <AdminStatusBadge tone="info">
                                    Gốc
                                </AdminStatusBadge>
                            ) : null}
                        </div>
                        {node.description ? (
                            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                                {node.description}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                        <button
                            type="button"
                            onClick={() => onAddChild(node.id)}
                            className="rounded-lg bg-[#f8f0e6] px-2 py-1 text-[10px] font-extrabold text-[#101a36]"
                        >
                            + Con
                        </button>
                        {!node.isRoot ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onEdit(node)}
                                    className="rounded-lg bg-[#f8f0e6] px-2 py-1 text-[10px] font-extrabold text-emerald-700"
                                >
                                    Sửa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(node)}
                                    className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-extrabold text-rose-600"
                                >
                                    Xóa
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
            {expanded && hasChildren ? (
                <div className="mt-1.5 space-y-1.5">
                    {node.children.map((child) => (
                        <CategoryTreeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export default function AdminCategoryPage() {
    const [tree, setTree] = useState<CategoryTreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [editing, setEditing] = useState<EditingCategory | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fetchTree = () => {
        setLoading(true);
        void getCategoryTree()
            .then(setTree)
            .catch((err) =>
                setLoadError(
                    err instanceof Error
                        ? err.message
                        : "Không thể tải danh mục.",
                ),
            )
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        void getCategoryTree()
            .then(setTree)
            .catch((err) =>
                setLoadError(
                    err instanceof Error
                        ? err.message
                        : "Không thể tải danh mục.",
                ),
            )
            .finally(() => setLoading(false));
    }, []);

    const startAddRoot = () => {
        setEditing({ id: null, parentId: null, name: "", description: "" });
        setMessage("");
        setError("");
    };

    const startAddChild = (parentId: number) => {
        setEditing({ id: null, parentId, name: "", description: "" });
        setMessage("");
        setError("");
    };

    const startEdit = (node: CategoryTreeNode) => {
        setEditing({
            id: node.id,
            parentId: node.parentId,
            name: node.name,
            description: node.description,
        });
        setMessage("");
        setError("");
    };

    const [deleteTarget, setDeleteTarget] = useState<CategoryTreeNode | null>(
        null,
    );

    const confirmDelete = useCallback(async () => {
        if (!deleteTarget) return;
        setIsSubmitting(true);
        setMessage("");
        setError("");
        try {
            await deleteCategory(deleteTarget.id);
            setMessage(`Đã xóa danh mục "${deleteTarget.name}".`);
            fetchTree();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Không thể xóa danh mục.",
            );
        } finally {
            setIsSubmitting(false);
            setDeleteTarget(null);
        }
    }, [deleteTarget, fetchTree]);

    const handleSave = async () => {
        if (!editing) return;
        if (!editing.name.trim()) {
            setError("Vui lòng nhập tên danh mục.");
            return;
        }
        setIsSubmitting(true);
        setMessage("");
        setError("");
        try {
            const payload = {
                name: editing.name.trim(),
                description: editing.description.trim(),
                parentId: editing.parentId,
            };
            if (editing.id) {
                await updateCategory(editing.id, payload);
                setMessage("Đã cập nhật danh mục.");
            } else {
                await createCategory(payload);
                setMessage(
                    editing.parentId === null
                        ? "Đã tạo danh mục gốc mới."
                        : "Đã tạo danh mục con mới.",
                );
            }
            setEditing(null);
            fetchTree();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Không thể lưu danh mục.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-3 text-[#101a36]">
            <AdminSectionHeader
                action={
                    <AdminPrimaryButton
                        type="button"
                        onClick={startAddRoot}
                        disabled={isSubmitting}
                    >
                        + Danh mục gốc
                    </AdminPrimaryButton>
                }
                title="Quản lý danh mục"
                subtitle="Cây danh mục sản phẩm. Danh mục gốc không thể sửa hoặc xóa."
            />

            {loading ? (
                <AdminCard className="p-3 text-[12px] font-semibold text-slate-500">
                    Đang tải danh mục...
                </AdminCard>
            ) : null}
            {loadError ? (
                <AdminCard className="p-3 text-[12px] font-semibold text-rose-700">
                    {loadError}
                </AdminCard>
            ) : null}
            {message ? (
                <AdminCard className="border-emerald-200 bg-emerald-50 p-3 text-[12px] font-bold text-emerald-700">
                    {message}
                </AdminCard>
            ) : null}
            {error ? (
                <AdminCard className="border-rose-200 bg-rose-50 p-3 text-[12px] font-bold text-rose-700">
                    {error}
                </AdminCard>
            ) : null}

            <section className="space-y-1.5">
                {tree.map((root) => (
                    <CategoryTreeItem
                        key={root.id}
                        node={root}
                        depth={0}
                        onEdit={startEdit}
                        onDelete={(n) => {
                            if (!n.isRoot) setDeleteTarget(n);
                        }}
                        onAddChild={startAddChild}
                    />
                ))}
                {!loading && !loadError && tree.length === 0 ? (
                    <AdminCard className="p-4 text-center text-[12px] font-bold text-slate-500">
                        Chưa có danh mục nào.
                    </AdminCard>
                ) : null}
            </section>

            {editing ? (
                <AdminCard className="space-y-3 p-3.5">
                    {!editing.id && editing.parentId === null ? (
                        <h2 className="text-[15px] font-extrabold">
                            Thêm danh mục gốc
                        </h2>
                    ) : (
                        <h2 className="text-[15px] font-extrabold">
                            {editing.id ? "Sửa danh mục" : "Thêm danh mục con"}
                        </h2>
                    )}
                    <label className="block text-[12px] font-extrabold">
                        Tên danh mục <span className="text-rose-500">*</span>
                        <AdminField
                            value={editing.name}
                            onChange={(e) =>
                                setEditing({ ...editing, name: e.target.value })
                            }
                            className="mt-1"
                            placeholder="Tên danh mục"
                        />
                    </label>
                    <label className="block text-[12px] font-extrabold">
                        Mô tả
                        <AdminTextArea
                            rows={2}
                            value={editing.description}
                            onChange={(e) =>
                                setEditing({
                                    ...editing,
                                    description: e.target.value,
                                })
                            }
                            className="mt-1"
                            placeholder="Mô tả danh mục..."
                        />
                    </label>
                    <div className="flex gap-2">
                        <AdminPrimaryButton
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? "Đang lưu..." : "Lưu"}
                        </AdminPrimaryButton>
                        <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="flex-1 rounded-2xl border border-[#eadfce] bg-white px-4 py-2.5 text-[14px] font-extrabold text-[#101a36]"
                        >
                            Hủy
                        </button>
                    </div>
                </AdminCard>
            ) : null}

            <ConfirmModal
                open={deleteTarget !== null}
                title={`Xóa danh mục "${deleteTarget?.name ?? ""}"?`}
                description="Thao tác này không thể hoàn tác."
                icon="🗑️"
                danger
                confirmLabel="Xóa"
                loading={isSubmitting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
            <LoadingOverlay open={isSubmitting} message="Đang xử lý..." />
        </div>
    );
}
