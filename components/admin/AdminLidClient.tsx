"use client";

import { FormEvent, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { CategoryDto, getCategories } from "@/lib/api/categories";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import {
    createLid,
    deleteLid,
    getLids,
    updateLid,
    LidDto,
} from "@/lib/api/lids";
import {
    AdminCard,
    AdminField,
    AdminPrimaryButton,
    AdminSectionHeader,
    AdminSelect,
    AdminTextArea,
    adminFormatMoney,
} from "@/components/admin/admin-ui";

type LidPriceRow = {
    diameterMm: string;
    sizeName: string;
    unitPrice: string;
};

type LidForm = {
    name: string;
    description: string;
    categoryId: string;
    prices: LidPriceRow[];
};

type Props = {
    initialLids: LidDto[];
    initialCategories: CategoryDto[];
};

const emptyPriceRow: LidPriceRow = { diameterMm: "", sizeName: "", unitPrice: "" };
const initialForm: LidForm = {
    name: "",
    description: "",
    categoryId: "",
    prices: [{ ...emptyPriceRow }],
};

function PlusIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0 0-3l-.5-.5a2.1 2.1 0 0 0-3 0l-10 10L4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M6 7h12M10 11v6M14 11v6M8 7l1 13h6l1-13M10 7V5h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick} className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#eadfce] bg-white text-[#4c596c] shadow-sm transition active:scale-[0.96]" aria-label={label}>
            {children}
        </button>
    );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <span className="mb-1.5 block text-[13px] font-extrabold text-[#101a36]">
            {children} {required ? <span className="text-red-500">*</span> : null}
        </span>
    );
}

export default function AdminLidClient({ initialLids, initialCategories }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState<LidForm>(initialForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const { data: lids = initialLids, mutate } = useSWR<LidDto[]>("/api/v1/Lids", getLids, { fallbackData: initialLids });
    const { data: categories = initialCategories } = useSWR<CategoryDto[]>("/api/v1/Categories", getCategories, { fallbackData: initialCategories });

    const isFormMode = mode === "create" || selectedId !== null;
    const formTitle = selectedId ? "Sửa nắp" : "Thêm nắp mới";

    const categorySelectOptions = categories.map((c) => ({ value: String(c.id), label: c.name }));

    const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

    const visibleLids = lids.filter((lid) => {
        if (!searchTerm.trim()) return true;
        const text = normalizeSearch(`${lid.name} ${lid.description ?? ""} ${lid.categoryName ?? ""}`);
        return text.includes(normalizeSearch(searchTerm.trim()));
    });

    const startCreate = () => {
        setSelectedId(null);
        setForm(initialForm);
        setMessage("");
        setError("");
        router.push("/admin/lid?mode=create");
    };

    const closeForm = () => {
        setSelectedId(null);
        setForm(initialForm);
        setError("");
        router.push("/admin/lid");
    };

    const editLid = (lid: LidDto) => {
        setSelectedId(lid.id);
        setForm({
            name: lid.name,
            description: lid.description ?? "",
            categoryId: String(lid.categoryId),
            prices: lid.prices.length > 0
                ? lid.prices.map((p) => ({ diameterMm: String(p.diameterMm), sizeName: p.sizeName ?? "", unitPrice: String(p.unitPrice) }))
                : [{ ...emptyPriceRow }],
        });
        setMessage("");
        setError("");
        router.push("/admin/lid?mode=edit");
    };

    const addPriceRow = () => {
        setForm((prev) => ({ ...prev, prices: [...prev.prices, { ...emptyPriceRow }] }));
    };

    const removePriceRow = (index: number) => {
        setForm((prev) => ({
            ...prev,
            prices: prev.prices.length <= 1 ? prev.prices : prev.prices.filter((_, i) => i !== index),
        }));
    };

    const updatePriceRow = (index: number, field: keyof LidPriceRow, value: string) => {
        setForm((prev) => ({
            ...prev,
            prices: prev.prices.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
        }));
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const categoryId = Number(form.categoryId);
        if (!form.name.trim() || Number.isNaN(categoryId) || categoryId <= 0) {
            setError("Vui lòng nhập tên nắp và chọn danh mục.");
            return;
        }

        const prices = form.prices
            .filter((p) => p.diameterMm && p.unitPrice)
            .map((p) => ({
                diameterMm: Number(p.diameterMm),
                sizeName: p.sizeName.trim() || undefined,
                unitPrice: Number(p.unitPrice),
            }));

        if (prices.length === 0) {
            setError("Cần ít nhất 1 dòng giá hợp lệ (đường kính và đơn giá).");
            return;
        }

        setIsSubmitting(true);
        setMessage("");
        setError("");

        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                categoryId,
                prices,
            };

            if (selectedId) {
                await updateLid(selectedId, payload);
                setMessage("Đã cập nhật nắp.");
            } else {
                await createLid(payload);
                setMessage("Đã tạo nắp mới.");
            }
            await mutate();
            closeForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể lưu nắp.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    const confirmDelete = useCallback(async () => {
        if (deleteTarget === null) return;
        setIsSubmitting(true);
        setMessage("");
        setError("");
        try {
            await deleteLid(deleteTarget);
            await mutate();
            if (selectedId === deleteTarget) closeForm();
            setMessage("Đã xóa nắp.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể xóa nắp.");
        } finally {
            setIsSubmitting(false);
            setDeleteTarget(null);
        }
    }, [deleteTarget, selectedId, closeForm, mutate]);

    if (isFormMode) {
        return (
            <div className="text-[#101a36]">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={closeForm} className="grid h-10 w-10 place-items-center rounded-full text-[#101a36]" aria-label="Quay lại">
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                            <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h1 className="text-[21px] font-extrabold leading-tight tracking-tight">{formTitle}</h1>
                </div>

                {message ? <AdminCard className="mt-3 border-emerald-200 bg-emerald-50 p-3 text-[13px] font-bold text-emerald-700">{message}</AdminCard> : null}
                {error ? <AdminCard className="mt-3 border-rose-200 bg-rose-50 p-3 text-[13px] font-bold text-rose-700">{error}</AdminCard> : null}

                <form onSubmit={onSubmit} className="mt-4 space-y-4">
                    <label className="block">
                        <FieldLabel required>Tên nắp</FieldLabel>
                        <AdminField value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Nắp vòm trong suốt" />
                    </label>
                    <label className="block">
                        <FieldLabel required>Danh mục</FieldLabel>
                        <AdminSelect value={form.categoryId} onValueChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))} placeholder="Chọn danh mục" options={categorySelectOptions} />
                    </label>
                    <label className="block">
                        <FieldLabel>Mô tả</FieldLabel>
                        <AdminTextArea rows={2} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Mô tả nắp..." />
                    </label>

                    <AdminCard className="space-y-3 p-3.5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[14px] font-extrabold">Bảng giá theo đường kính</h2>
                            <button type="button" onClick={addPriceRow} className="inline-flex items-center gap-1 rounded-lg bg-[#101a36] px-2.5 py-1.5 text-[11px] font-extrabold text-white">
                                + Thêm dòng
                            </button>
                        </div>
                        {form.prices.map((row, index) => (
                            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 items-end">
                                <label className="block">
                                    {index === 0 ? <span className="mb-1 block text-[11px] font-bold text-slate-500">⌀ mm</span> : null}
                                    <AdminField type="number" value={row.diameterMm} onChange={(e) => updatePriceRow(index, "diameterMm", e.target.value)} placeholder="90" />
                                </label>
                                <label className="block">
                                    {index === 0 ? <span className="mb-1 block text-[11px] font-bold text-slate-500">Tên size</span> : null}
                                    <AdminField value={row.sizeName} onChange={(e) => updatePriceRow(index, "sizeName", e.target.value)} placeholder="Size S" />
                                </label>
                                <label className="block">
                                    {index === 0 ? <span className="mb-1 block text-[11px] font-bold text-slate-500">Đơn giá (đ)</span> : null}
                                    <AdminField type="number" value={row.unitPrice} onChange={(e) => updatePriceRow(index, "unitPrice", e.target.value)} placeholder="350" />
                                </label>
                                <button type="button" onClick={() => removePriceRow(index)} className="grid h-[44px] w-9 place-items-center rounded-xl text-rose-500 transition hover:bg-rose-50" aria-label="Xóa dòng">
                                    ×
                                </button>
                            </div>
                        ))}
                    </AdminCard>

                    <AdminPrimaryButton type="submit" disabled={isSubmitting} className="w-full rounded-full py-3 text-[16px]">
                        {isSubmitting ? "Đang lưu..." : "Lưu nắp"}
                    </AdminPrimaryButton>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-3 text-[#101a36]">
            <AdminSectionHeader
                title="Quản lý nắp"
                action={
                    <AdminPrimaryButton type="button" onClick={startCreate} className="h-10 min-h-10 rounded-[13px] px-3 text-[14px]">
                        <PlusIcon />
                        Thêm
                    </AdminPrimaryButton>
                }
            />

            <label className="flex h-12 items-center gap-3 rounded-[14px] border border-[#eadfce] bg-white px-3.5 text-slate-400 shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm nắp..." className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#101a36] outline-none placeholder:text-slate-400" />
            </label>

            {message ? <AdminCard className="border-emerald-200 bg-emerald-50 p-3 text-[12px] font-bold text-emerald-700">{message}</AdminCard> : null}
            {error ? <AdminCard className="border-rose-200 bg-rose-50 p-3 text-[12px] font-bold text-rose-700">{error}</AdminCard> : null}

            <section className="space-y-2.5">
                {visibleLids.map((lid) => (
                    <AdminCard key={lid.id} className="p-3">
                        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                            <div className="min-w-0">
                                <h2 className="truncate text-[16px] font-extrabold leading-tight text-[#101a36]">{lid.name}</h2>
                                <p className="mt-1 text-[12px] font-semibold text-[#3d4860]">{lid.categoryName || "Danh mục"}</p>
                                {lid.description ? <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{lid.description}</p> : null}
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {lid.prices.map((price) => (
                                        <span key={price.id} className="rounded-lg bg-[#f8f0e6] px-2 py-1 text-[10px] font-extrabold text-[#3d4860]">
                                            ⌀{price.diameterMm}mm — {adminFormatMoney(price.unitPrice)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <IconButton label="Sửa nắp" onClick={() => editLid(lid)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton label="Xóa nắp" onClick={() => setDeleteTarget(lid.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </div>
                        </div>
                    </AdminCard>
                ))}
                {visibleLids.length === 0 ? (
                    <AdminCard className="p-4 text-center text-[13px] font-bold text-slate-500">
                        Chưa có nắp nào.
                    </AdminCard>
                ) : null}
            </section>

            <ConfirmModal
                open={deleteTarget !== null}
                title="Xóa nắp?"
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
