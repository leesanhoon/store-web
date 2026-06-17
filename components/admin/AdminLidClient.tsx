"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { PaginatedResponse } from "@/lib/api/http";
import { CategoryDto, getCategories } from "@/lib/api/categories";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import {
    addLidImages,
    createLid,
    deleteLid,
    deleteLidImage,
    getLid,
    getLids,
    updateLid,
    validateLidImages,
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

const emptyPriceRow: LidPriceRow = {
    diameterMm: "",
    sizeName: "",
    unitPrice: "",
};
const initialForm: LidForm = {
    name: "",
    description: "",
    categoryId: "",
    prices: [{ ...emptyPriceRow }],
};

function PlusIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0 0-3l-.5-.5a2.1 2.1 0 0 0-3 0l-10 10L4 20Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="M6 7h12M10 11v6M14 11v6M8 7l1 13h6l1-13M10 7V5h4v2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-9 w-9"
            aria-hidden="true"
        >
            <path
                d="M12 16V7m0 0 4 4m-4-4-4 4"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7 18a4 4 0 1 1 .9-7.9A5 5 0 0 1 17.7 11 3.5 3.5 0 1 1 18 18H7Z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#eadfce] bg-white text-[#4c596c] shadow-sm transition active:scale-[0.96]"
            aria-label={label}
        >
            {children}
        </button>
    );
}

function FieldLabel({
    children,
    required,
}: {
    children: React.ReactNode;
    required?: boolean;
}) {
    return (
        <span className="mb-1.5 block text-[13px] font-extrabold text-[#101a36]">
            {children}{" "}
            {required ? <span className="text-red-500">*</span> : null}
        </span>
    );
}

function preserveAdminScroll() {
    const scroller = document.getElementById("admin-main-content");
    const scrollTop = scroller?.scrollTop ?? 0;
    const restore = () => {
        if (scroller) scroller.scrollTop = scrollTop;
    };
    window.requestAnimationFrame(restore);
    window.setTimeout(restore, 120);
    window.setTimeout(restore, 320);
}

export default function AdminLidClient({
    initialLids,
    initialCategories,
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const avatarInputRef = useRef<HTMLInputElement | null>(null);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState<LidForm>(initialForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [avatarImage, setAvatarImage] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);
    const [allLids, setAllLids] = useState<LidDto[]>(initialLids);
    const [hasMore, setHasMore] = useState(initialLids.length >= PAGE_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

    const {
        data: lidsPage,
        mutate,
    } = useSWR<PaginatedResponse<LidDto>>(
        [`/api/v1/Lids`, page],
        () => getLids({ page, pageSize: PAGE_SIZE }),
        { revalidateOnFocus: false },
    );

    useEffect(() => {
        if (!lidsPage) return;
        setAllLids((prev) => {
            if (page === 1) return lidsPage.items;
            const existingIds = new Set(prev.map((l) => l.id));
            const newItems = lidsPage.items.filter((l) => !existingIds.has(l.id));
            return [...prev, ...newItems];
        });
        setHasMore(page * PAGE_SIZE < lidsPage.totalCount);
        setIsLoadingMore(false);
    }, [lidsPage, page]);

    useEffect(() => {
        const sentinel = scrollSentinelRef.current;
        if (!sentinel || !hasMore) return;
        const scroller = document.getElementById("admin-main-content") ?? undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    setIsLoadingMore(true);
                    setPage((p) => p + 1);
                }
            },
            { root: scroller, rootMargin: "200px" },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore]);

    const refreshLids = useCallback(async () => {
        const fresh = await getLids({ page: 1, pageSize: PAGE_SIZE });
        setPage(1);
        setAllLids(fresh.items);
        setHasMore(PAGE_SIZE < fresh.totalCount);
        setIsLoadingMore(false);
        mutate(fresh, { revalidate: false });
    }, [mutate]);

    const { data: categories = initialCategories } = useSWR<CategoryDto[]>(
        "/api/v1/Categories",
        getCategories,
        { fallbackData: initialCategories },
    );
    const { data: lidDetail } = useSWR<LidDto>(
        selectedId ? `/api/v1/Lids/${selectedId}` : null,
        () => getLid(selectedId!),
    );

    const isFormMode = mode === "create" || selectedId !== null;
    const formTitle = selectedId ? "Sửa nắp" : "Thêm nắp mới";
    const editingLid =
        lidDetail ??
        (selectedId ? allLids.find((l) => l.id === selectedId) : null);
    const existingAvatar = editingLid?.avatarImageUrl ?? null;
    const existingGallery = editingLid?.galleryImages ?? [];

    const categorySelectOptions = categories.map((c) => ({
        value: String(c.id),
        label: c.name,
    }));

    const avatarPreviewUrl = useMemo(
        () => (avatarImage ? URL.createObjectURL(avatarImage) : ""),
        [avatarImage],
    );
    const galleryPreviews = useMemo(
        () =>
            galleryImages.map((file) => ({
                file,
                url: URL.createObjectURL(file),
            })),
        [galleryImages],
    );

    const normalizeSearch = (value: string) =>
        value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

    const visibleLids = allLids.filter((lid) => {
        if (!searchTerm.trim()) return true;
        const text = normalizeSearch(
            `${lid.name} ${lid.description ?? ""} ${lid.categoryName ?? ""}`,
        );
        return text.includes(normalizeSearch(searchTerm.trim()));
    });

    const openAvatarPicker = () => {
        preserveAdminScroll();
        avatarInputRef.current?.click();
    };
    const openGalleryPicker = () => {
        preserveAdminScroll();
        galleryInputRef.current?.click();
    };
    const handleAvatarFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setAvatarImage(event.currentTarget.files?.[0] ?? null);
        event.currentTarget.value = "";
        preserveAdminScroll();
    };
    const handleGalleryFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setGalleryImages(Array.from(event.currentTarget.files ?? []));
        event.currentTarget.value = "";
        preserveAdminScroll();
    };

    const startCreate = () => {
        setSelectedId(null);
        setForm(initialForm);
        setAvatarImage(null);
        setGalleryImages([]);
        setMessage("");
        setError("");
        router.push("/admin/lid?mode=create");
    };

    const closeForm = () => {
        setSelectedId(null);
        setForm(initialForm);
        setAvatarImage(null);
        setGalleryImages([]);
        setError("");
        router.push("/admin/lid");
    };

    const editLid = (lid: LidDto) => {
        setSelectedId(lid.id);
        setForm({
            name: lid.name,
            description: lid.description ?? "",
            categoryId: String(lid.categoryId),
            prices:
                lid.prices.length > 0
                    ? lid.prices.map((p) => ({
                          diameterMm: String(p.diameterMm),
                          sizeName: p.sizeName ?? "",
                          unitPrice: String(p.unitPrice),
                      }))
                    : [{ ...emptyPriceRow }],
        });
        setAvatarImage(null);
        setGalleryImages([]);
        setMessage("");
        setError("");
        router.push("/admin/lid?mode=edit");
    };

    const addPriceRow = () => {
        setForm((prev) => ({
            ...prev,
            prices: [...prev.prices, { ...emptyPriceRow }],
        }));
    };

    const removePriceRow = (index: number) => {
        setForm((prev) => ({
            ...prev,
            prices:
                prev.prices.length <= 1
                    ? prev.prices
                    : prev.prices.filter((_, i) => i !== index),
        }));
    };

    const updatePriceRow = (
        index: number,
        field: keyof LidPriceRow,
        value: string,
    ) => {
        setForm((prev) => ({
            ...prev,
            prices: prev.prices.map((row, i) =>
                i === index ? { ...row, [field]: value } : row,
            ),
        }));
    };

    const handleDeleteExistingImage = async (imageId: number) => {
        if (!selectedId) return;
        try {
            await deleteLidImage(selectedId, imageId);
            await refreshLids();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể xóa ảnh.");
        }
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

        if (!selectedId && !avatarImage) {
            setError("Vui lòng chọn ảnh đại diện cho nắp ly.");
            return;
        }

        const hasNewImages = avatarImage || galleryImages.length > 0;
        const imageError = hasNewImages
            ? validateLidImages(avatarImage, galleryImages)
            : "";
        if (imageError) {
            setError(imageError);
            return;
        }

        setIsSubmitting(true);
        setMessage("");
        setError("");

        try {
            if (selectedId) {
                await updateLid(selectedId, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    categoryId,
                    prices,
                });
                if (hasNewImages) {
                    await addLidImages(
                        selectedId,
                        avatarImage,
                        galleryImages.length > 0 ? galleryImages : undefined,
                    );
                }
                setMessage("Đã cập nhật nắp.");
            } else {
                await createLid({
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    categoryId,
                    prices,
                    avatarImage,
                    galleryImages,
                });
                setMessage("Đã tạo nắp mới.");
            }
            await refreshLids();
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
            await refreshLids();
            if (selectedId === deleteTarget) closeForm();
            setMessage("Đã xóa nắp.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể xóa nắp.");
        } finally {
            setIsSubmitting(false);
            setDeleteTarget(null);
        }
    }, [deleteTarget, selectedId, closeForm, refreshLids]);

    if (isFormMode) {
        const displayAvatarUrl = avatarPreviewUrl || existingAvatar || "";
        return (
            <div className="text-[#101a36]">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={closeForm}
                        className="grid h-10 w-10 place-items-center rounded-full text-[#101a36]"
                        aria-label="Quay lại"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6"
                            aria-hidden="true"
                        >
                            <path
                                d="M15 5 8 12l7 7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <h1 className="text-[21px] font-extrabold leading-tight tracking-tight">
                        {formTitle}
                    </h1>
                </div>

                {message ? (
                    <AdminCard className="mt-3 border-emerald-200 bg-emerald-50 p-3 text-[13px] font-bold text-emerald-700">
                        {message}
                    </AdminCard>
                ) : null}
                {error ? (
                    <AdminCard className="mt-3 border-rose-200 bg-rose-50 p-3 text-[13px] font-bold text-rose-700">
                        {error}
                    </AdminCard>
                ) : null}

                <form onSubmit={onSubmit} className="mt-4 space-y-4">
                    <label className="block">
                        <FieldLabel required>Tên nắp</FieldLabel>
                        <AdminField
                            value={form.name}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            placeholder="Ví dụ: Nắp vòm trong suốt"
                        />
                    </label>
                    <label className="block">
                        <FieldLabel required>Danh mục</FieldLabel>
                        <AdminSelect
                            value={form.categoryId}
                            onValueChange={(value) =>
                                setForm((prev) => ({
                                    ...prev,
                                    categoryId: value,
                                }))
                            }
                            placeholder="Chọn danh mục"
                            options={categorySelectOptions}
                        />
                    </label>
                    <label className="block">
                        <FieldLabel>Mô tả</FieldLabel>
                        <AdminTextArea
                            rows={2}
                            value={form.description}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="Mô tả nắp..."
                        />
                    </label>

                    <AdminCard className="space-y-3 p-3.5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[14px] font-extrabold">
                                Bảng giá theo đường kính
                            </h2>
                            <button
                                type="button"
                                onClick={addPriceRow}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#101a36] px-2.5 py-1.5 text-[11px] font-extrabold text-white"
                            >
                                + Thêm dòng
                            </button>
                        </div>
                        {form.prices.map((row, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 items-end"
                            >
                                <label className="block">
                                    {index === 0 ? (
                                        <span className="mb-1 block text-[11px] font-bold text-slate-500">
                                            ⌀ mm
                                        </span>
                                    ) : null}
                                    <AdminField
                                        type="number"
                                        value={row.diameterMm}
                                        onChange={(e) =>
                                            updatePriceRow(
                                                index,
                                                "diameterMm",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="90"
                                    />
                                </label>
                                {/* <label className="block">
                                    {index === 0 ? (
                                        <span className="mb-1 block text-[11px] font-bold text-slate-500">
                                            Tên size
                                        </span>
                                    ) : null}
                                    <AdminField
                                        value={row.sizeName}
                                        onChange={(e) =>
                                            updatePriceRow(
                                                index,
                                                "sizeName",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Size S"
                                    />
                                </label> */}
                                <label className="block">
                                    {index === 0 ? (
                                        <span className="mb-1 block text-[11px] font-bold text-slate-500">
                                            Đơn giá (đ)
                                        </span>
                                    ) : null}
                                    <AdminField
                                        type="number"
                                        value={row.unitPrice}
                                        onChange={(e) =>
                                            updatePriceRow(
                                                index,
                                                "unitPrice",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="350"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => removePriceRow(index)}
                                    className="grid h-[44px] w-9 place-items-center rounded-xl text-rose-500 transition hover:bg-rose-50"
                                    aria-label="Xóa dòng"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </AdminCard>

                    {/* Image upload section */}
                    <div className="grid gap-4 min-[431px]:grid-cols-[0.95fr_1.05fr]">
                        <div>
                            <FieldLabel>Ảnh đại diện</FieldLabel>
                            <div className="rounded-[18px] bg-black/[0.03] p-1.5 ring-1 ring-black/[0.06]">
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                                    onChange={handleAvatarFileChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={openAvatarPicker}
                                    className="relative grid min-h-[136px] w-full place-items-center rounded-[calc(18px-6px)] bg-white p-3 text-center text-[#3d4860] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] min-[431px]:min-h-[154px]"
                                >
                                    {displayAvatarUrl ? (
                                        <>
                                            <Image
                                                src={displayAvatarUrl}
                                                alt="Ảnh đại diện xem trước"
                                                width={220}
                                                height={180}
                                                unoptimized={displayAvatarUrl.startsWith(
                                                    "blob:",
                                                )}
                                                className="h-[118px] w-full rounded-xl object-cover min-[431px]:h-[136px]"
                                            />
                                            {!avatarPreviewUrl &&
                                            existingAvatar ? (
                                                <span className="absolute bottom-2 left-2 rounded-full bg-[#101a36]/80 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white/90 uppercase">
                                                    Ảnh hiện tại
                                                </span>
                                            ) : null}
                                        </>
                                    ) : (
                                        <span className="grid place-items-center text-[14px] font-extrabold">
                                            <UploadIcon />
                                            Tải ảnh lên
                                            <small className="mt-1 text-[11px] font-semibold text-slate-500">
                                                JPG, PNG tối đa 2MB
                                            </small>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Thư viện ảnh</FieldLabel>
                            <div className="rounded-[18px] bg-black/[0.03] p-1.5 ring-1 ring-black/[0.06]">
                                <div className="grid grid-cols-3 gap-2 rounded-[calc(18px-6px)] bg-white p-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                                        multiple
                                        onChange={handleGalleryFileChange}
                                        className="hidden"
                                    />
                                    {existingGallery.map((img) => (
                                        <div
                                            key={img.id}
                                            className="group relative"
                                        >
                                            <Image
                                                src={img.imageUrl}
                                                alt="Ảnh nắp"
                                                width={96}
                                                height={86}
                                                className="h-[68px] w-full rounded-[10px] border border-[#f1e7d8] object-cover transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteExistingImage(
                                                        img.id,
                                                    )
                                                }
                                                className="absolute -right-1.5 -top-1.5 grid h-[22px] w-[22px] place-items-center rounded-full bg-gradient-to-b from-rose-400 to-rose-600 text-[11px] font-bold text-white shadow-md ring-2 ring-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90"
                                                aria-label="Xóa ảnh"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {galleryPreviews
                                        .slice(0, 5)
                                        .map(({ url }, index) => (
                                            <div
                                                key={`new-${index}`}
                                                className="relative"
                                            >
                                                <Image
                                                    src={url}
                                                    alt="Ảnh nắp"
                                                    width={96}
                                                    height={86}
                                                    unoptimized
                                                    className="h-[68px] w-full rounded-[10px] border border-emerald-200 object-cover"
                                                />
                                                <span className="absolute bottom-0.5 left-0.5 rounded-full bg-emerald-600/80 px-1.5 py-px text-[8px] font-bold text-white uppercase">
                                                    Mới
                                                </span>
                                            </div>
                                        ))}
                                    <button
                                        type="button"
                                        onClick={openGalleryPicker}
                                        className="grid h-[68px] place-items-center rounded-[10px] border border-dashed border-[#d6c9b8] bg-white/80 text-center text-[12px] font-extrabold text-[#101a36] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                                    >
                                        <span>
                                            <span className="block text-2xl leading-none">
                                                +
                                            </span>
                                            Ảnh khác
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AdminPrimaryButton
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full py-3 text-[16px]"
                    >
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
                    <AdminPrimaryButton
                        type="button"
                        onClick={startCreate}
                        className="h-10 min-h-10 rounded-[13px] px-3 text-[14px]"
                    >
                        <PlusIcon />
                        Thêm
                    </AdminPrimaryButton>
                }
            />

            <label className="flex h-12 items-center gap-3 rounded-[14px] border border-[#eadfce] bg-white px-3.5 text-slate-400 shadow-sm">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    <path
                        d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm nắp..."
                    className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#101a36] outline-none placeholder:text-slate-400"
                />
            </label>

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

            <section className="space-y-2.5">
                {visibleLids.map((lid) => (
                    <AdminCard key={lid.id} className="p-3">
                        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                            {lid.avatarImageUrl ? (
                                <Image
                                    src={lid.avatarImageUrl}
                                    alt={lid.name}
                                    width={72}
                                    height={72}
                                    className="h-[64px] w-[64px] rounded-[12px] object-cover"
                                />
                            ) : (
                                <div className="grid h-[64px] w-[64px] place-items-center rounded-[12px] bg-[#f5efe5] text-[#8b95a8]">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-7 w-7"
                                    >
                                        <path
                                            d="M6 14h12"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M7 14c0-4 2.2-7 5-7s5 3 5 7"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M5 14v2a1 1 0 001 1h12a1 1 0 001-1v-2"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            )}
                            <div className="min-w-0">
                                <h2 className="truncate text-[16px] font-extrabold leading-tight text-[#101a36]">
                                    {lid.name}
                                </h2>
                                <p className="mt-1 text-[12px] font-semibold text-[#3d4860]">
                                    {lid.categoryName || "Danh mục"}
                                </p>
                                {lid.description ? (
                                    <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
                                        {lid.description}
                                    </p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {lid.prices.map((price) => (
                                        <span
                                            key={price.id}
                                            className="rounded-lg bg-[#f8f0e6] px-2 py-1 text-[10px] font-extrabold text-[#3d4860]"
                                        >
                                            ⌀{price.diameterMm}mm —{" "}
                                            {adminFormatMoney(price.unitPrice)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <IconButton
                                    label="Sửa nắp"
                                    onClick={() => editLid(lid)}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    label="Xóa nắp"
                                    onClick={() => setDeleteTarget(lid.id)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </div>
                        </div>
                    </AdminCard>
                ))}
                {visibleLids.length === 0 && !isLoadingMore ? (
                    <AdminCard className="p-4 text-center text-[13px] font-bold text-slate-500">
                        Chưa có nắp nào.
                    </AdminCard>
                ) : null}
                {isLoadingMore ? (
                    <div className="flex justify-center py-4">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#101a36] border-t-transparent" />
                    </div>
                ) : null}
                {hasMore ? <div ref={scrollSentinelRef} className="h-1" /> : null}
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
