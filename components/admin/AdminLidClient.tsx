"use client";

import Image from "next/image";
import {
    FormEvent,
    ReactNode,
    Ref,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import { flushSync } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { PaginatedResponse } from "@/lib/api/http";
import { CategoryDto, getCategories } from "@/lib/api/categories";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import {
    addProductImages,
    createProduct,
    deleteProduct,
    deleteProductImage,
    getProduct,
    getProducts,
    isLidProduct,
    updateProduct,
    validateProductImages,
    type ProductDto,
} from "@/lib/api/products";
import {
    AdminCard,
    AdminEmptyState,
    AdminField,
    AdminPrimaryButton,
    AdminSectionHeader,
    AdminSelect,
    AdminTextArea,
    adminFormatMoney,
} from "@/components/admin/admin-ui";
import {
    PlusIcon,
    EditIcon,
    DeleteIcon,
    UploadIcon,
    FieldLabel,
    preserveAdminScroll,
    normalizeSearch,
} from "@/components/admin/shared";

type LidVariantRow = {
    diameterMm: string;
    sizeName: string;
    unitPrice: string;
};

type LidForm = {
    name: string;
    description: string;
    categoryId: string;
    variants: LidVariantRow[];
};

type Props = {
    initialLids: ProductDto[];
    initialHasMore?: boolean;
    initialCategories: CategoryDto[];
};

type LidPage = PaginatedResponse<ProductDto> & { rawPageWasFull: boolean };

const emptyVariantRow: LidVariantRow = {
    diameterMm: "",
    sizeName: "",
    unitPrice: "",
};
const initialForm: LidForm = {
    name: "",
    description: "",
    categoryId: "",
    variants: [{ ...emptyVariantRow }],
};

const NOTICE_TONES = {
    success: "border-success/30 bg-success-soft text-success",
    danger: "border-danger/30 bg-danger-soft text-danger",
};

function Notice({
    tone,
    className = "",
    ref,
    children,
}: {
    tone: keyof typeof NOTICE_TONES;
    className?: string;
    ref?: Ref<HTMLDivElement>;
    children: ReactNode;
}) {
    return (
        <div
            ref={ref}
            role={tone === "danger" ? "alert" : "status"}
            className={`rounded-lg border p-3 text-sm font-medium ${NOTICE_TONES[tone]} ${className}`}
        >
            {children}
        </div>
    );
}

function IconButton({
    label,
    onClick,
    tone = "neutral",
    children,
}: {
    label: string;
    onClick: () => void;
    tone?: "neutral" | "danger";
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`grid h-11 w-11 place-items-center rounded-md border bg-white transition-colors ${
                tone === "danger"
                    ? "border-danger/30 text-danger hover:bg-danger-soft"
                    : "border-line text-label hover:border-primary hover:text-primary"
            }`}
            aria-label={label}
        >
            {children}
        </button>
    );
}

async function fetchLidProducts(params?: {
    page: number;
    pageSize: number;
}): Promise<LidPage> {
    const result = await getProducts(params ?? { page: 1, pageSize: 50 });
    const paginated = result as PaginatedResponse<ProductDto>;
    const filtered = paginated.items.filter(isLidProduct);
    const rawPageWasFull = paginated.items.length >= (params?.pageSize ?? 50);
    return {
        ...paginated,
        items: filtered,
        totalCount: paginated.totalCount,
        rawPageWasFull,
    };
}

export default function AdminLidClient({
    initialLids,
    initialHasMore,
    initialCategories,
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const avatarInputRef = useRef<HTMLInputElement | null>(null);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const errorRef = useRef<HTMLDivElement | null>(null);
    const rowIdPrefix = useId();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState<LidForm>(initialForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [avatarImage, setAvatarImage] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [imageDeleteTarget, setImageDeleteTarget] = useState<number | null>(
        null,
    );
    const [isDeletingImage, setIsDeletingImage] = useState(false);

    const PAGE_SIZE = 50;
    const [page, setPage] = useState(1);
    const [allLids, setAllLids] = useState<ProductDto[]>(initialLids);
    const [hasMore, setHasMore] = useState(initialHasMore ?? false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

    const initialPageData = useMemo(
        () =>
            ({
                items: initialLids,
                totalCount: initialLids.length,
                rawPageWasFull: initialHasMore ?? false,
            }) as LidPage,
        [initialLids, initialHasMore],
    );

    const { data: lidsPage, mutate } = useSWR<LidPage>(
        [`lid-products-admin`, page],
        () => fetchLidProducts({ page, pageSize: PAGE_SIZE }),
        {
            revalidateOnFocus: false,
            fallbackData: page === 1 ? initialPageData : undefined,
        },
    );

    // Merge each newly fetched page into the accumulated list. Adjusted during render
    // (not in an effect) whenever SWR hands back a different page object.
    const [mergedPage, setMergedPage] = useState<LidPage>();
    if (lidsPage && lidsPage !== mergedPage) {
        setMergedPage(lidsPage);
        setAllLids((prev) => {
            if (page === 1) return lidsPage.items;
            const existingIds = new Set(prev.map((l) => l.id));
            const newItems = lidsPage.items.filter(
                (l) => !existingIds.has(l.id),
            );
            return [...prev, ...newItems];
        });
        setHasMore(lidsPage.rawPageWasFull);
        setIsLoadingMore(false);
    }

    useEffect(() => {
        const sentinel = scrollSentinelRef.current;
        if (!sentinel || !hasMore) return;
        // The window scrolls (no inner admin scroller), so observe against the viewport
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    setIsLoadingMore(true);
                    setPage((p) => p + 1);
                }
            },
            { root: null, rootMargin: "200px" },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore]);

    const refreshLids = useCallback(async () => {
        const fresh = await fetchLidProducts({ page: 1, pageSize: PAGE_SIZE });
        setPage(1);
        setAllLids(fresh.items);
        setHasMore(fresh.rawPageWasFull);
        setIsLoadingMore(false);
        mutate(fresh, { revalidate: false });
    }, [mutate]);

    const { data: categories = initialCategories } = useSWR<CategoryDto[]>(
        "/api/v1/Categories",
        getCategories,
        { fallbackData: initialCategories },
    );
    const { data: lidDetail } = useSWR<ProductDto>(
        selectedId ? `/api/v1/Products/${selectedId}` : null,
        () => getProduct(selectedId!),
    );

    // (P-fix) `?mode=edit` is required too, so browser Back from the edit form returns to the list
    const isFormMode =
        mode === "create" || (mode === "edit" && selectedId !== null);
    const formTitle = selectedId ? "Sửa nắp" : "Thêm nắp mới";
    const editingLid =
        lidDetail ??
        (selectedId ? allLids.find((l) => l.id === selectedId) : null);
    const existingAvatar = editingLid?.avatarImageUrl ?? null;
    const existingGallery = editingLid?.galleryImages ?? [];

    // Root categories are not assignable, same as the product form
    const categorySelectOptions = categories
        .filter((c) => !c.isRoot)
        .map((c) => ({
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

    const visibleLids = allLids.filter((lid) => {
        if (!searchTerm.trim()) return true;
        const text = normalizeSearch(
            `${lid.name} ${lid.description ?? ""} ${lid.categoryName ?? ""}`,
        );
        return text.includes(normalizeSearch(searchTerm.trim()));
    });

    // The banner sits above the form while the save button is in the sticky bar: render it now, then bring it into view
    const showError = (text: string) => {
        flushSync(() => setError(text));
        errorRef.current?.scrollIntoView({ block: "center" });
    };

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

    const editLid = (product: ProductDto) => {
        setSelectedId(product.id);
        setForm({
            name: product.name,
            description: product.description ?? "",
            categoryId: String(product.categoryId),
            variants:
                product.variants.length > 0
                    ? product.variants.map((v) => ({
                          diameterMm: String(v.diameterMm),
                          sizeName: v.sizeName ?? "",
                          unitPrice: String(v.priceTiers[0]?.unitPrice ?? 0),
                      }))
                    : [{ ...emptyVariantRow }],
        });
        setAvatarImage(null);
        setGalleryImages([]);
        setMessage("");
        setError("");
        router.push("/admin/lid?mode=edit");
    };

    const addVariantRow = () => {
        setForm((prev) => ({
            ...prev,
            variants: [...prev.variants, { ...emptyVariantRow }],
        }));
    };

    const removeVariantRow = (index: number) => {
        setForm((prev) => ({
            ...prev,
            variants:
                prev.variants.length <= 1
                    ? prev.variants
                    : prev.variants.filter((_, i) => i !== index),
        }));
    };

    const updateVariantRow = (
        index: number,
        field: keyof LidVariantRow,
        value: string,
    ) => {
        setForm((prev) => ({
            ...prev,
            variants: prev.variants.map((row, i) =>
                i === index ? { ...row, [field]: value } : row,
            ),
        }));
    };

    const confirmDeleteExistingImage = async () => {
        if (!selectedId || imageDeleteTarget === null) return;
        setIsDeletingImage(true);
        try {
            await deleteProductImage(selectedId, imageDeleteTarget);
            await refreshLids();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Không thể xóa ảnh.");
        } finally {
            setIsDeletingImage(false);
            setImageDeleteTarget(null);
        }
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const categoryId = Number(form.categoryId);
        if (!form.name.trim() || Number.isNaN(categoryId) || categoryId <= 0) {
            showError("Vui lòng nhập tên nắp và chọn danh mục.");
            return;
        }

        const variants = form.variants
            .filter((v) => v.diameterMm && v.unitPrice)
            .map((v) => ({
                capacityMl: 0,
                diameterMm: Number(v.diameterMm),
                sizeName: v.sizeName ?? "",
                priceTiers: [{ minQuantity: 1, unitPrice: Number(v.unitPrice) }],
            }));

        if (variants.length === 0) {
            showError("Cần ít nhất 1 dòng giá hợp lệ (đường kính và đơn giá).");
            return;
        }

        if (!selectedId && !avatarImage) {
            showError("Vui lòng chọn ảnh đại diện cho nắp ly.");
            return;
        }

        const hasNewImages = avatarImage || galleryImages.length > 0;
        const imageError = hasNewImages
            ? validateProductImages(avatarImage, galleryImages)
            : "";
        if (imageError) {
            showError(imageError);
            return;
        }

        setIsSubmitting(true);
        setMessage("");
        setError("");

        try {
            if (selectedId) {
                await updateProduct(selectedId, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    categoryId,
                    variants,
                });
                if (hasNewImages) {
                    await addProductImages(
                        selectedId,
                        avatarImage,
                        galleryImages.length > 0 ? galleryImages : undefined,
                    );
                }
                setMessage("Đã cập nhật nắp.");
            } else {
                await createProduct({
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    categoryId,
                    variants,
                    avatarImage,
                    galleryImages,
                });
                setMessage("Đã tạo nắp mới.");
            }
            await refreshLids();
            closeForm();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Không thể lưu nắp.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    const confirmDelete = async () => {
        if (deleteTarget === null) return;
        setIsSubmitting(true);
        setMessage("");
        setError("");
        try {
            await deleteProduct(deleteTarget);
            await refreshLids();
            if (selectedId === deleteTarget) closeForm();
            setMessage("Đã xóa nắp.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể xóa nắp.");
        } finally {
            setIsSubmitting(false);
            setDeleteTarget(null);
        }
    };

    if (isFormMode) {
        const displayAvatarUrl = avatarPreviewUrl || existingAvatar || "";
        const isExistingAvatar = !avatarPreviewUrl && !!existingAvatar;
        return (
            <div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={closeForm}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ink transition-colors hover:bg-primary-soft hover:text-primary"
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
                    <h1 className="text-2xl font-semibold leading-tight text-ink">
                        {formTitle}
                    </h1>
                </div>

                {message ? (
                    <Notice tone="success" className="mt-4">
                        {message}
                    </Notice>
                ) : null}
                {error ? (
                    <Notice ref={errorRef} tone="danger" className="mt-4">
                        {error}
                    </Notice>
                ) : null}

                <form onSubmit={onSubmit} className="mt-4">
                    <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
                        <div className="min-w-0 space-y-4 lg:col-span-2">
                            <AdminCard className="space-y-4 p-4">
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
                            </AdminCard>

                            <AdminCard className="p-4">
                                <h2 className="text-base font-semibold text-ink">
                                    Bảng giá theo đường kính
                                </h2>
                                <div className="mt-3 space-y-3">
                                    {form.variants.map((row, index) => {
                                        const rowLabelId = `${rowIdPrefix}-row-${index}`;
                                        return (
                                            <div
                                                key={index}
                                                role="group"
                                                aria-labelledby={rowLabelId}
                                                className="rounded-md border border-line bg-surface p-3"
                                            >
                                                <div className="flex min-h-11 items-center justify-between gap-2">
                                                    <h3
                                                        id={rowLabelId}
                                                        className="text-sm font-semibold text-ink"
                                                    >
                                                        Dòng {index + 1}
                                                    </h3>
                                                    {/* The last row cannot be removed */}
                                                    {form.variants.length > 1 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeVariantRow(index)
                                                            }
                                                            className="min-h-11 rounded-sm px-3 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft"
                                                            aria-label={`Xóa dòng ${index + 1}`}
                                                        >
                                                            Xóa
                                                        </button>
                                                    ) : null}
                                                </div>
                                                <div className="mt-2 grid gap-3 md:grid-cols-3">
                                                    <label className="block">
                                                        <FieldLabel>
                                                            Đường kính (mm)
                                                        </FieldLabel>
                                                        <AdminField
                                                            type="number"
                                                            inputMode="numeric"
                                                            min={0}
                                                            value={row.diameterMm}
                                                            onChange={(e) =>
                                                                updateVariantRow(
                                                                    index,
                                                                    "diameterMm",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="90"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <FieldLabel>
                                                            Đơn giá (đ)
                                                        </FieldLabel>
                                                        <AdminField
                                                            type="number"
                                                            inputMode="numeric"
                                                            min={0}
                                                            value={row.unitPrice}
                                                            onChange={(e) =>
                                                                updateVariantRow(
                                                                    index,
                                                                    "unitPrice",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="350"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <FieldLabel>Tên size</FieldLabel>
                                                        <AdminField
                                                            type="text"
                                                            value={row.sizeName}
                                                            onChange={(e) =>
                                                                updateVariantRow(
                                                                    index,
                                                                    "sizeName",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="S, M, L..."
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <AdminPrimaryButton
                                    type="button"
                                    variant="secondary"
                                    onClick={addVariantRow}
                                    className="mt-3 w-full md:w-auto"
                                >
                                    <PlusIcon />
                                    Thêm dòng
                                </AdminPrimaryButton>
                            </AdminCard>
                        </div>

                        <AdminCard className="mt-4 grid min-w-0 gap-4 p-4 md:grid-cols-2 lg:mt-0 lg:grid-cols-1">
                            <div>
                                <FieldLabel required={!selectedId}>
                                    Ảnh đại diện
                                </FieldLabel>
                                <div className="relative">
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
                                        aria-label={
                                            displayAvatarUrl
                                                ? "Đổi ảnh đại diện"
                                                : undefined
                                        }
                                        className="grid min-h-40 w-full place-items-center rounded-lg border border-dashed border-line-strong bg-white p-2 text-center text-ink transition-colors hover:border-primary hover:text-primary"
                                    >
                                        {displayAvatarUrl ? (
                                            <Image
                                                src={displayAvatarUrl}
                                                alt=""
                                                width={400}
                                                height={300}
                                                unoptimized={displayAvatarUrl.startsWith(
                                                    "blob:",
                                                )}
                                                className="h-36 w-full rounded-md object-cover"
                                            />
                                        ) : (
                                            <span className="grid place-items-center gap-1 text-sm font-semibold">
                                                <UploadIcon />
                                                Tải ảnh lên
                                                <small className="text-sm font-normal text-muted">
                                                    JPG, PNG tối đa 2MB
                                                </small>
                                            </span>
                                        )}
                                    </button>
                                    {isExistingAvatar ? (
                                        <span className="pointer-events-none absolute bottom-4 left-4 rounded-sm bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white">
                                            Ảnh hiện tại
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <div>
                                <FieldLabel>Thư viện ảnh</FieldLabel>
                                <div className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-white p-2">
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                                        multiple
                                        onChange={handleGalleryFileChange}
                                        className="hidden"
                                    />
                                    {existingGallery.map((img, index) => (
                                        <div key={img.id} className="relative">
                                            <Image
                                                src={img.imageUrl}
                                                alt={`Ảnh nắp ${index + 1}`}
                                                width={160}
                                                height={160}
                                                className="aspect-square w-full rounded-md border border-line object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setImageDeleteTarget(img.id)
                                                }
                                                className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-md bg-white/90 text-danger shadow-sm transition-colors hover:bg-danger hover:text-white"
                                                aria-label={`Xóa ảnh nắp ${index + 1}`}
                                            >
                                                <DeleteIcon />
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
                                                    alt={`Ảnh mới ${index + 1}`}
                                                    width={160}
                                                    height={160}
                                                    unoptimized
                                                    className="aspect-square w-full rounded-md border border-line object-cover"
                                                />
                                                <span className="absolute bottom-1 left-1 rounded-sm bg-ink/80 px-1.5 py-0.5 text-xs font-semibold text-white">
                                                    Mới
                                                </span>
                                            </div>
                                        ))}
                                    <button
                                        type="button"
                                        onClick={openGalleryPicker}
                                        aria-label="Thêm ảnh khác vào thư viện"
                                        className="grid aspect-square place-items-center rounded-md border border-dashed border-line-strong bg-white text-center text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
                                    >
                                        <span className="grid place-items-center gap-1">
                                            <PlusIcon />
                                            Ảnh khác
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </AdminCard>
                    </div>

                    <div className="admin-form-actions mt-6">
                        <AdminPrimaryButton
                            type="button"
                            variant="secondary"
                            onClick={closeForm}
                            className="flex-1 md:flex-none"
                        >
                            Hủy
                        </AdminPrimaryButton>
                        <AdminPrimaryButton
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 md:flex-none"
                        >
                            {isSubmitting ? "Đang lưu..." : "Lưu nắp"}
                        </AdminPrimaryButton>
                    </div>
                </form>

                <ConfirmModal
                    open={imageDeleteTarget !== null}
                    title="Xóa ảnh này?"
                    description="Ảnh sẽ bị xóa ngay khỏi hệ thống."
                    danger
                    confirmLabel="Xóa ảnh"
                    loading={isDeletingImage}
                    onConfirm={confirmDeleteExistingImage}
                    onCancel={() => setImageDeleteTarget(null)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AdminSectionHeader
                title="Quản lý nắp"
                action={
                    <AdminPrimaryButton type="button" onClick={startCreate}>
                        <PlusIcon />
                        Thêm
                    </AdminPrimaryButton>
                }
            />

            <div className="relative md:w-80">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                >
                    <path
                        d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
                <AdminField
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm nắp..."
                    aria-label="Tìm nắp"
                    className="pl-10"
                />
            </div>

            {message ? <Notice tone="success">{message}</Notice> : null}
            {error ? <Notice tone="danger">{error}</Notice> : null}

            <section aria-label="Danh sách nắp" className="space-y-2">
                {visibleLids.map((lid) => (
                    <AdminCard
                        key={lid.id}
                        className="flex items-center gap-3 p-3 md:gap-4"
                    >
                        {lid.avatarImageUrl ? (
                            <Image
                                src={lid.avatarImageUrl}
                                alt=""
                                width={56}
                                height={56}
                                className="h-14 w-14 shrink-0 rounded-md object-cover"
                            />
                        ) : (
                            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-surface text-muted">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="h-7 w-7"
                                    aria-hidden="true"
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
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-base font-semibold text-ink">
                                {lid.name}
                            </h2>
                            <p className="truncate text-sm text-body">
                                {lid.categoryName || "Chưa có danh mục"}
                            </p>
                            {lid.description ? (
                                <p className="truncate text-sm text-muted">
                                    {lid.description}
                                </p>
                            ) : null}
                            {lid.variants.length > 0 ? (
                                <ul
                                    aria-label="Bảng giá"
                                    className="mt-2 flex flex-wrap gap-1.5"
                                >
                                    {lid.variants.map((variant) => (
                                        <li
                                            key={variant.id}
                                            className="rounded-sm bg-surface px-2 py-0.5 text-xs font-medium text-body"
                                        >
                                            ⌀{variant.diameterMm}mm —{" "}
                                            {adminFormatMoney(
                                                variant.priceTiers[0]?.unitPrice ?? 0,
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 md:flex-row">
                            <IconButton
                                label={`Sửa ${lid.name}`}
                                onClick={() => editLid(lid)}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                label={`Xóa ${lid.name}`}
                                tone="danger"
                                onClick={() => setDeleteTarget(lid.id)}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </div>
                    </AdminCard>
                ))}
                {visibleLids.length === 0 && !isLoadingMore ? (
                    <AdminEmptyState>
                        {searchTerm.trim()
                            ? "Không tìm thấy nắp phù hợp."
                            : "Chưa có nắp nào."}
                    </AdminEmptyState>
                ) : null}
                {isLoadingMore ? (
                    <div role="status" className="flex justify-center py-4">
                        <span
                            className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
                            aria-hidden="true"
                        />
                        <span className="sr-only">Đang tải thêm nắp</span>
                    </div>
                ) : null}
                {hasMore ? <div ref={scrollSentinelRef} className="h-1" /> : null}
            </section>

            <ConfirmModal
                open={deleteTarget !== null}
                title="Xóa nắp?"
                description="Thao tác này không thể hoàn tác."
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
