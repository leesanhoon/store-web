"use client";

import {
    type ReactNode,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import { flushSync } from "react-dom";
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
    AdminEmptyState,
    AdminField,
    AdminPrimaryButton,
    AdminSectionHeader,
    AdminStatusBadge,
    AdminTextArea,
} from "@/components/admin/admin-ui";
import { FieldLabel, PlusIcon } from "@/components/admin/shared";

type EditingCategory = {
    id: number | null;
    parentId: number | null;
    /** Only for the "add child" form title */
    parentName?: string;
    name: string;
    description: string;
};

const NOTICE_TONES = {
    success: "border-success/30 bg-success-soft text-success",
    danger: "border-danger/30 bg-danger-soft text-danger",
};

function Notice({
    tone,
    children,
}: {
    tone: keyof typeof NOTICE_TONES;
    children: ReactNode;
}) {
    return (
        <div
            role={tone === "danger" ? "alert" : "status"}
            className={`rounded-lg border p-3 text-sm font-medium ${NOTICE_TONES[tone]}`}
        >
            {children}
        </div>
    );
}

// Row actions: 44px tall on mobile, 36px from 768px
const ROW_BUTTON =
    "min-h-11 rounded-sm border bg-white px-3 text-sm font-semibold transition-colors md:min-h-9";
const ROW_BUTTON_TONES = {
    neutral: "border-line text-label hover:border-primary hover:text-primary",
    danger: "border-danger/30 text-danger hover:bg-danger-soft",
};

function CategoryTreeItem({
    node,
    onEdit,
    onDelete,
    onAddChild,
}: {
    node: CategoryTreeNode;
    onEdit: (node: CategoryTreeNode) => void;
    onDelete: (node: CategoryTreeNode) => void;
    onAddChild: (parent: CategoryTreeNode) => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children.length > 0;

    return (
        <li>
            <div className="rounded-lg border border-line bg-white p-3 shadow-sm">
                {/* Below 768px the actions wrap onto their own line */}
                <div className="flex flex-wrap items-center gap-2">
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => setExpanded(!expanded)}
                            aria-expanded={expanded}
                            aria-label={`Danh mục con của ${node.name}`}
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-ink md:h-9 md:w-9"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className={`h-5 w-5 transition-transform ${expanded ? "rotate-90" : ""}`}
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
                        <span className="w-11 shrink-0 md:w-9" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="min-w-0 truncate text-base font-semibold text-ink">
                                {node.name}
                            </p>
                            {node.parentId == null ? (
                                <AdminStatusBadge tone="info">
                                    Gốc
                                </AdminStatusBadge>
                            ) : null}
                        </div>
                        {node.description ? (
                            <p className="truncate text-sm text-muted">
                                {node.description}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex w-full justify-end gap-2 md:w-auto">
                        <button
                            type="button"
                            onClick={() => onAddChild(node)}
                            aria-label={`Thêm danh mục con cho ${node.name}`}
                            className={`${ROW_BUTTON} ${ROW_BUTTON_TONES.neutral}`}
                        >
                            + Con
                        </button>
                        {!node.isRoot ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onEdit(node)}
                                    aria-label={`Sửa ${node.name}`}
                                    className={`${ROW_BUTTON} ${ROW_BUTTON_TONES.neutral}`}
                                >
                                    Sửa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(node)}
                                    aria-label={`Xóa ${node.name}`}
                                    className={`${ROW_BUTTON} ${ROW_BUTTON_TONES.danger}`}
                                >
                                    Xóa
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
            {expanded && hasChildren ? (
                <ul className="ml-4 mt-2 space-y-2">
                    {node.children.map((child) => (
                        <CategoryTreeItem
                            key={child.id}
                            node={child}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                        />
                    ))}
                </ul>
            ) : null}
        </li>
    );
}

export default function AdminCategoryPage() {
    const formRef = useRef<HTMLFormElement | null>(null);
    const nameFieldId = useId();
    const [tree, setTree] = useState<CategoryTreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [editing, setEditing] = useState<EditingCategory | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // State is only set in the promise callbacks, so the mount effect can call this directly
    const loadTree = useCallback(
        () =>
            getCategoryTree()
                .then(setTree)
                .catch((err) =>
                    setLoadError(
                        err instanceof Error
                            ? err.message
                            : "Không thể tải danh mục.",
                    ),
                )
                .finally(() => setLoading(false)),
        [],
    );

    useEffect(() => {
        void loadTree();
    }, [loadTree]);

    const fetchTree = () => {
        setLoading(true);
        setLoadError("");
        void loadTree();
    };

    // The form renders below the whole tree: render it first, then scroll to it and focus the name field
    const openForm = (next: EditingCategory) => {
        flushSync(() => {
            setEditing(next);
            setMessage("");
            setError("");
        });
        formRef.current?.scrollIntoView({ block: "center" });
        document.getElementById(nameFieldId)?.focus({ preventScroll: true });
    };

    const startAddRoot = () =>
        openForm({ id: null, parentId: null, name: "", description: "" });

    const startAddChild = (parent: CategoryTreeNode) =>
        openForm({
            id: null,
            parentId: parent.id,
            parentName: parent.name,
            name: "",
            description: "",
        });

    const startEdit = (node: CategoryTreeNode) =>
        openForm({
            id: node.id,
            parentId: node.parentId,
            name: node.name,
            description: node.description,
        });

    const [deleteTarget, setDeleteTarget] = useState<CategoryTreeNode | null>(
        null,
    );
    const deleteChildCount = deleteTarget?.children.length ?? 0;

    const confirmDelete = async () => {
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
    };

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

    const formTitle = !editing
        ? ""
        : editing.id
          ? "Sửa danh mục"
          : editing.parentId === null
            ? "Thêm danh mục gốc"
            : `Thêm danh mục con cho “${editing.parentName ?? ""}”`;

    return (
        <div className="space-y-4">
            <AdminSectionHeader
                action={
                    <AdminPrimaryButton
                        type="button"
                        onClick={startAddRoot}
                        disabled={isSubmitting}
                    >
                        <PlusIcon />
                        Danh mục gốc
                    </AdminPrimaryButton>
                }
                title="Quản lý danh mục"
                subtitle="Cây danh mục sản phẩm. Danh mục gốc không thể sửa hoặc xóa."
            />

            {loading ? (
                <p role="status" className="text-sm text-muted">
                    Đang tải danh mục...
                </p>
            ) : null}
            {loadError ? <Notice tone="danger">{loadError}</Notice> : null}
            {message ? <Notice tone="success">{message}</Notice> : null}
            {/* While the form is open, errors show inside it (it is usually scrolled into view) */}
            {error && !editing ? <Notice tone="danger">{error}</Notice> : null}

            <section aria-label="Cây danh mục">
                {tree.length > 0 ? (
                    <ul className="space-y-2">
                        {tree.map((root) => (
                            <CategoryTreeItem
                                key={root.id}
                                node={root}
                                onEdit={startEdit}
                                onDelete={(n) => {
                                    if (!n.isRoot) setDeleteTarget(n);
                                }}
                                onAddChild={startAddChild}
                            />
                        ))}
                    </ul>
                ) : null}
                {!loading && !loadError && tree.length === 0 ? (
                    <AdminEmptyState>Chưa có danh mục nào.</AdminEmptyState>
                ) : null}
            </section>

            {editing ? (
                <AdminCard>
                    <form
                        ref={formRef}
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSave();
                        }}
                        className="space-y-4 p-4"
                    >
                        <h2 className="text-lg font-semibold leading-snug text-ink">
                            {formTitle}
                        </h2>
                        {error ? <Notice tone="danger">{error}</Notice> : null}
                        <label className="block">
                            <FieldLabel required>Tên danh mục</FieldLabel>
                            <AdminField
                                id={nameFieldId}
                                value={editing.name}
                                onChange={(e) =>
                                    setEditing({ ...editing, name: e.target.value })
                                }
                                placeholder="Tên danh mục"
                            />
                        </label>
                        <label className="block">
                            <FieldLabel>Mô tả</FieldLabel>
                            <AdminTextArea
                                rows={2}
                                value={editing.description}
                                onChange={(e) =>
                                    setEditing({
                                        ...editing,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Mô tả danh mục..."
                            />
                        </label>
                        <div className="flex justify-end gap-2">
                            <AdminPrimaryButton
                                type="button"
                                variant="secondary"
                                onClick={() => setEditing(null)}
                                className="flex-1 md:flex-none"
                            >
                                Hủy
                            </AdminPrimaryButton>
                            <AdminPrimaryButton
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 md:flex-none"
                            >
                                {isSubmitting ? "Đang lưu..." : "Lưu"}
                            </AdminPrimaryButton>
                        </div>
                    </form>
                </AdminCard>
            ) : null}

            <ConfirmModal
                open={deleteTarget !== null}
                title={`Xóa danh mục "${deleteTarget?.name ?? ""}"?`}
                description={
                    deleteChildCount > 0
                        ? `Danh mục này có ${deleteChildCount} danh mục con. Thao tác này không thể hoàn tác.`
                        : "Thao tác này không thể hoàn tác."
                }
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
