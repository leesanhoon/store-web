"use client";

import Image from "next/image";
import {
    FormEvent,
    ReactNode,
    Ref,
    RefObject,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import { flushSync } from "react-dom";
import { PaginatedResponse } from "@/lib/api/http";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { CategoryDto, getCategories } from "@/lib/api/categories";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { isLidProduct } from "@/lib/api/products";
import {
    addProductImages,
    createProduct,
    deleteProduct,
    deleteProductImage,
    getProduct,
    getProducts,
    normalizeProductApiError,
    ProductDto,
    updateProduct,
    validateProductImages,
} from "@/lib/api/products";
import { getMinPrice, getProductImageSrc } from "@/lib/products/display";
import {
    AdminCard,
    AdminChip,
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
    useObjectUrls,
} from "@/components/admin/shared";

type PriceTierRow = {
    minQuantity: string;
    unitPrice: string;
};

type VariantRow = {
    capacityMl: string;
    diameterMm: string;
    priceTiers: PriceTierRow[];
};

type ProductForm = {
    name: string;
    description: string;
    categoryId: string;
    variants: VariantRow[];
    compatibleProductIds: number[];
};

type Props = {
    initialProducts: ProductDto[];
    initialCategories: CategoryDto[];
};

const tabs = ["Tất cả", "Ly nhựa", "Ly giấy"];

const emptyPriceTier: PriceTierRow = { minQuantity: "", unitPrice: "" };
const emptyVariant: VariantRow = {
    capacityMl: "",
    diameterMm: "",
    priceTiers: [{ ...emptyPriceTier }],
};
const initialForm: ProductForm = {
    name: "",
    description: "",
    categoryId: "",
    variants: [
        {
            ...emptyVariant,
            priceTiers: [{ ...emptyPriceTier }],
        },
    ],
    compatibleProductIds: [],
};

// Shared columns for the price-tier header and rows: quantity | unit price | remove
const TIER_GRID =
    "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-2";

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

function AdminImageUploadBox({
    inputRef,
    previewUrl,
    existingImageUrl,
    onFileChange,
    onOpenPicker,
}: {
    inputRef: RefObject<HTMLInputElement | null>;
    previewUrl: string;
    existingImageUrl?: string | null;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenPicker: () => void;
}) {
    const displayUrl = previewUrl || existingImageUrl || "";
    const isExisting = !previewUrl && !!existingImageUrl;
    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                onChange={onFileChange}
                className="hidden"
            />
            <button
                type="button"
                onClick={onOpenPicker}
                aria-label={displayUrl ? "Đổi ảnh đại diện" : undefined}
                className="grid min-h-40 w-full place-items-center rounded-lg border border-dashed border-line-strong bg-white p-2 text-center text-ink transition-colors hover:border-primary hover:text-primary"
            >
                {displayUrl ? (
                    <Image
                        src={displayUrl}
                        alt=""
                        width={400}
                        height={300}
                        unoptimized={displayUrl.startsWith("blob:")}
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
            {isExisting ? (
                <span className="pointer-events-none absolute bottom-4 left-4 rounded-sm bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white">
                    Ảnh hiện tại
                </span>
            ) : null}
        </div>
    );
}

function AdminGalleryPicker({
    inputRef,
    imageSources,
    existingImages,
    onFileChange,
    onOpenPicker,
    onDeleteExisting,
}: {
    inputRef: RefObject<HTMLInputElement | null>;
    imageSources: string[];
    existingImages?: { id: number; imageUrl: string }[];
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenPicker: () => void;
    onDeleteExisting?: (imageId: number) => void;
}) {
    return (
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-white p-2">
            <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                multiple
                onChange={onFileChange}
                className="hidden"
            />
            {existingImages?.map((img, index) => (
                <div key={img.id} className="relative">
                    <Image
                        src={img.imageUrl}
                        alt={`Ảnh sản phẩm ${index + 1}`}
                        width={160}
                        height={160}
                        className="aspect-square w-full rounded-md border border-line object-cover"
                    />
                    {onDeleteExisting ? (
                        <button
                            type="button"
                            onClick={() => onDeleteExisting(img.id)}
                            className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-md bg-white/90 text-danger shadow-sm transition-colors hover:bg-danger hover:text-white"
                            aria-label={`Xóa ảnh sản phẩm ${index + 1}`}
                        >
                            <DeleteIcon />
                        </button>
                    ) : null}
                </div>
            ))}
            {imageSources.slice(0, 5).map((src, index) => (
                <div key={`${src}-${index}`} className="relative">
                    <Image
                        src={src}
                        alt={`Ảnh mới ${index + 1}`}
                        width={160}
                        height={160}
                        unoptimized={src.startsWith("blob:")}
                        className="aspect-square w-full rounded-md border border-line object-cover"
                    />
                    <span className="absolute bottom-1 left-1 rounded-sm bg-ink/80 px-1.5 py-0.5 text-xs font-semibold text-white">
                        Mới
                    </span>
                </div>
            ))}
            <button
                type="button"
                onClick={onOpenPicker}
                aria-label="Thêm ảnh khác vào thư viện"
                className="grid aspect-square place-items-center rounded-md border border-dashed border-line-strong bg-white text-center text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
                <span className="grid place-items-center gap-1">
                    <PlusIcon />
                    Ảnh khác
                </span>
            </button>
        </div>
    );
}

function VariantEditor({
    variants,
    onChange,
}: {
    variants: VariantRow[];
    onChange: (variants: VariantRow[]) => void;
}) {
    const idPrefix = useId();

    const addVariant = () => {
        onChange([
            ...variants,
            {
                capacityMl: "",
                diameterMm: "",
                priceTiers: [{ ...emptyPriceTier }],
            },
        ]);
    };

    const removeVariant = (index: number) => {
        if (variants.length <= 1) return;
        onChange(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (
        index: number,
        field: keyof Omit<VariantRow, "priceTiers">,
        value: string,
    ) => {
        onChange(
            variants.map((v, i) =>
                i === index ? { ...v, [field]: value } : v,
            ),
        );
    };

    const updatePriceTiers = (vIndex: number, tiers: PriceTierRow[]) => {
        onChange(
            variants.map((v, i) =>
                i === vIndex ? { ...v, priceTiers: tiers } : v,
            ),
        );
    };

    const addPriceTier = (vIndex: number) => {
        const v = variants[vIndex];
        updatePriceTiers(vIndex, [
            ...v.priceTiers,
            { ...emptyPriceTier },
        ]);
    };

    const removePriceTier = (vIndex: number, tIndex: number) => {
        const v = variants[vIndex];
        if (v.priceTiers.length <= 1) return;
        updatePriceTiers(
            vIndex,
            v.priceTiers.filter((_, i) => i !== tIndex),
        );
    };

    const updateTier = (
        vIndex: number,
        tIndex: number,
        field: keyof PriceTierRow,
        value: string,
    ) => {
        const v = variants[vIndex];
        updatePriceTiers(
            vIndex,
            v.priceTiers.map((t, i) =>
                i === tIndex ? { ...t, [field]: value } : t,
            ),
        );
    };

    return (
        <div className="space-y-3">
            <h2 className="text-base font-semibold text-ink">
                Biến thể sản phẩm
            </h2>
            {variants.map((variant, vIndex) => {
                const titleId = `${idPrefix}-variant-${vIndex}`;
                return (
                    <div
                        key={vIndex}
                        role="group"
                        aria-labelledby={titleId}
                        className="space-y-3 rounded-md border border-line bg-surface p-3"
                    >
                        <div className="flex min-h-11 items-center justify-between gap-3">
                            <h3
                                id={titleId}
                                className="text-sm font-semibold text-ink"
                            >
                                Biến thể {vIndex + 1}
                            </h3>
                            {variants.length > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => removeVariant(vIndex)}
                                    className="min-h-11 rounded-sm px-3 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft"
                                    aria-label={`Xóa biến thể ${vIndex + 1}`}
                                >
                                    Xóa
                                </button>
                            ) : null}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                                <FieldLabel>Dung tích (ml)</FieldLabel>
                                <AdminField
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    value={variant.capacityMl}
                                    onChange={(e) =>
                                        updateVariant(
                                            vIndex,
                                            "capacityMl",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="250"
                                />
                            </label>
                            <label className="block">
                                <FieldLabel>⌀ miệng (mm)</FieldLabel>
                                <AdminField
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    value={variant.diameterMm}
                                    onChange={(e) =>
                                        updateVariant(
                                            vIndex,
                                            "diameterMm",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="90"
                                />
                            </label>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-label">
                                    Bảng giá theo số lượng
                                </p>
                                <button
                                    type="button"
                                    onClick={() => addPriceTier(vIndex)}
                                    className="min-h-11 rounded-sm px-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                                >
                                    + Thêm mức giá
                                </button>
                            </div>
                            {/* Visual column header; each input carries its own aria-label */}
                            <div
                                className={`${TIER_GRID} text-sm text-muted`}
                                aria-hidden="true"
                            >
                                <span>Từ số lượng</span>
                                <span>Đơn giá (đ)</span>
                                <span />
                            </div>
                            {variant.priceTiers.map((tier, tIndex) => (
                                <div key={tIndex} className={TIER_GRID}>
                                    <AdminField
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        aria-label={`Từ số lượng, mức ${tIndex + 1}`}
                                        value={tier.minQuantity}
                                        onChange={(e) =>
                                            updateTier(
                                                vIndex,
                                                tIndex,
                                                "minQuantity",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="1000"
                                    />
                                    <AdminField
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        aria-label={`Đơn giá (đ), mức ${tIndex + 1}`}
                                        value={tier.unitPrice}
                                        onChange={(e) =>
                                            updateTier(
                                                vIndex,
                                                tIndex,
                                                "unitPrice",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="850"
                                    />
                                    {variant.priceTiers.length > 1 ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removePriceTier(vIndex, tIndex)
                                            }
                                            className="grid h-11 w-11 place-items-center rounded-md text-xl text-danger transition-colors hover:bg-danger-soft"
                                            aria-label={`Xóa mức giá ${tIndex + 1}`}
                                        >
                                            <span aria-hidden="true">×</span>
                                        </button>
                                    ) : (
                                        <span />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            <AdminPrimaryButton
                type="button"
                variant="secondary"
                onClick={addVariant}
                className="w-full md:w-auto"
            >
                <PlusIcon />
                Thêm biến thể
            </AdminPrimaryButton>
        </div>
    );
}

function LidSelector({
    selectedIds,
    allLids,
    productDiameters,
    onChange,
}: {
    selectedIds: number[];
    allLids: ProductDto[];
    productDiameters: number[];
    onChange: (ids: number[]) => void;
}) {
    const toggle = (id: number) => {
        onChange(
            selectedIds.includes(id)
                ? selectedIds.filter((i) => i !== id)
                : [...selectedIds, id],
        );
    };

    const compatibleLids =
        productDiameters.length > 0
            ? allLids.filter((lid) =>
                  lid.variants.some((v) =>
                      productDiameters.includes(v.diameterMm),
                  ),
              )
            : allLids;

    if (allLids.length === 0) {
        return (
            <p className="text-sm text-muted">
                Chưa có nắp nào trong hệ thống. Hãy tạo nắp trước.
            </p>
        );
    }

    if (compatibleLids.length === 0) {
        return (
            <p className="text-sm text-muted">
                Không có nắp nào phù hợp với ⌀ miệng (
                {productDiameters.map((d) => `${d}mm`).join(", ")}).
            </p>
        );
    }

    return (
        <div className="grid gap-2 md:grid-cols-2">
            {compatibleLids.map((lid) => {
                const checked = selectedIds.includes(lid.id);
                const matchingDiameters =
                    productDiameters.length > 0
                        ? lid.variants.filter((v) =>
                              productDiameters.includes(v.diameterMm),
                          )
                        : lid.variants;
                return (
                    <label
                        key={lid.id}
                        className="flex min-h-14 min-w-0 cursor-pointer items-center gap-3 rounded-md border border-line bg-white px-3 py-2 transition-colors has-checked:border-primary has-checked:bg-primary-soft"
                    >
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(lid.id)}
                            className="h-5 w-5 shrink-0 accent-primary"
                        />
                        {lid.avatarImageUrl ? (
                            <Image
                                src={lid.avatarImageUrl}
                                alt=""
                                width={40}
                                height={40}
                                className="h-10 w-10 shrink-0 rounded-md object-cover"
                            />
                        ) : (
                            <span
                                className="h-10 w-10 shrink-0 rounded-md bg-surface"
                                aria-hidden="true"
                            />
                        )}
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ink">
                                {lid.name}
                            </span>
                            <span className="block truncate text-sm text-muted">
                                {lid.categoryName
                                    ? `${lid.categoryName} · `
                                    : ""}
                                {matchingDiameters
                                    .map((v) => `⌀${v.diameterMm}mm`)
                                    .join(", ")}
                            </span>
                        </span>
                    </label>
                );
            })}
        </div>
    );
}

export default function AdminProductClient({
    initialProducts,
    initialCategories,
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const avatarInputRef = useRef<HTMLInputElement | null>(null);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const errorRef = useRef<HTMLDivElement | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState<ProductForm>(initialForm);
    const [activeTab, setActiveTab] = useState("Tất cả");
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

    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);
    const [allProducts, setAllProducts] =
        useState<ProductDto[]>(initialProducts);
    const [hasMore, setHasMore] = useState(initialProducts.length >= PAGE_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

    const {
        data: productsPage,
        error: productsError,
        mutate,
    } = useSWR<PaginatedResponse<ProductDto>>(
        [`/api/v1/Products`, page],
        () => getProducts({ page, pageSize: PAGE_SIZE }),
        { revalidateOnFocus: false },
    );

    // Merge each newly fetched page into the accumulated list. Adjusted during render
    // (not in an effect) whenever SWR hands back a different page object.
    const [mergedPage, setMergedPage] =
        useState<PaginatedResponse<ProductDto>>();
    if (productsPage && productsPage !== mergedPage) {
        setMergedPage(productsPage);
        setAllProducts((prev) => {
            if (page === 1) return productsPage.items;
            const existingIds = new Set(prev.map((p) => p.id));
            const newItems = productsPage.items.filter(
                (p) => !existingIds.has(p.id),
            );
            return [...prev, ...newItems];
        });
        setHasMore(page * PAGE_SIZE < productsPage.totalCount);
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

    const refreshProducts = useCallback(async () => {
        const fresh = await getProducts({ page: 1, pageSize: PAGE_SIZE });
        setPage(1);
        setAllProducts(fresh.items);
        setHasMore(PAGE_SIZE < fresh.totalCount);
        setIsLoadingMore(false);
        mutate(fresh, { revalidate: false });
    }, [mutate]);

    const { data: categories = initialCategories, error: categoriesError } =
        useSWR<CategoryDto[]>("/api/v1/Categories", getCategories, {
            fallbackData: initialCategories,
        });
    const { data: allLids = [] } = useSWR<ProductDto[]>(
        "lid-products",
        async () => {
            const lids: ProductDto[] = [];
            let page = 1;
            let hasMore = true;
            while (hasMore) {
                const response = await getProducts({ page, pageSize: 50 });
                const pageLids = response.items.filter(isLidProduct);
                lids.push(...pageLids);
                hasMore = response.items.length >= 50;
                page++;
            }
            return lids;
        },
        { fallbackData: [] },
    );
    const { data: productDetail } = useSWR<ProductDto>(
        selectedId ? `/api/v1/Products/${selectedId}` : null,
        () => getProduct(selectedId!),
    );

    const avatarPreviewUrl = useMemo(
        () => (avatarImage ? URL.createObjectURL(avatarImage) : ""),
        [avatarImage],
    );
    const galleryPreviews = useObjectUrls(galleryImages);
    const galleryImageSources = galleryPreviews.map(({ url }) => url);
    const categorySelectOptions = categories
        .filter((c) => !c.isRoot)
        .map((c) => ({
            value: String(c.id),
            label: c.name,
        }));
    const productDiameters = useMemo(
        () =>
            form.variants.map((v) => Number(v.diameterMm)).filter((d) => d > 0),
        [form.variants],
    );

    // (P-fix) Create mode preselects every compatible lid, but only when the set of
    // diameters or the lid list changes, so typing in other fields keeps manual unchecks.
    // Keyed on strings (the SWR fallback array is a new object each render) and adjusted
    // during render instead of in an effect.
    const diameterKey = [...new Set(productDiameters)]
        .sort((a, b) => a - b)
        .join(",");
    const lidPreselectKey = `${diameterKey}|${allLids.map((lid) => lid.id).join(",")}`;
    const [preselectedFor, setPreselectedFor] = useState(lidPreselectKey);
    if (!selectedId && lidPreselectKey !== preselectedFor) {
        setPreselectedFor(lidPreselectKey);
        if (allLids.length > 0 && productDiameters.length > 0) {
            const compatibleIds = allLids
                .filter((lid) =>
                    lid.variants.some((v) =>
                        productDiameters.includes(v.diameterMm),
                    ),
                )
                .map((lid) => lid.id);
            setForm((prev) => ({
                ...prev,
                compatibleProductIds: compatibleIds,
            }));
        }
    }

    // (P-fix) `?mode=edit` is required too, so browser Back from the edit form returns to the list
    const isFormMode =
        mode === "create" || (mode === "edit" && selectedId !== null);
    const formTitle = selectedId ? "Sửa sản phẩm" : "Thêm sản phẩm";
    const editingProduct =
        productDetail ??
        (selectedId ? allProducts.find((p) => p.id === selectedId) : null);
    const existingAvatar = editingProduct?.avatarImageUrl ?? null;
    const existingGallery = editingProduct?.galleryImages ?? [];

    // The banner sits above the form while the trigger is far below it: render it now, then bring it into view
    const showError = (text: string) => {
        flushSync(() => setError(text));
        errorRef.current?.scrollIntoView({ block: "center" });
    };

    const confirmDeleteExistingImage = async () => {
        if (!selectedId || imageDeleteTarget === null) return;
        setIsDeletingImage(true);
        try {
            await deleteProductImage(selectedId, imageDeleteTarget);
            await refreshProducts();
        } catch (err) {
            showError(err instanceof Error ? err.message : "Không thể xóa ảnh.");
        } finally {
            setIsDeletingImage(false);
            setImageDeleteTarget(null);
        }
    };

    const visibleProducts = allProducts.filter((product) => {
        // (P-fix) Lids are managed on their own page
        if (isLidProduct(product)) return false;
        const text = normalizeSearch(
            `${product.name} ${product.description ?? ""} ${product.categoryName}`,
        );
        const tabNeedle = normalizeSearch(activeTab).replace("ly ", "");
        const matchesTab = activeTab === "Tất cả" || text.includes(tabNeedle);
        const matchesSearch =
            !searchTerm.trim() ||
            text.includes(normalizeSearch(searchTerm.trim()));
        return matchesTab && matchesSearch;
    });

    useEffect(
        () => () => {
            if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
        },
        [avatarPreviewUrl],
    );
    useEffect(
        () => () => {
            galleryPreviews.forEach(({ url }) => URL.revokeObjectURL(url));
        },
        [galleryPreviews],
    );

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
        router.push("/admin/product?mode=create");
    };

    const closeForm = () => {
        setSelectedId(null);
        setForm(initialForm);
        setAvatarImage(null);
        setGalleryImages([]);
        setError("");
        router.push("/admin/product");
    };

    const editProduct = (product: ProductDto) => {
        setSelectedId(product.id);
        setForm({
            name: product.name,
            description: product.description ?? "",
            categoryId: String(product.categoryId),
            variants:
                product.variants.length > 0
                    ? product.variants.map((v) => ({
                          capacityMl: String(v.capacityMl),
                          diameterMm: String(v.diameterMm),
                          priceTiers:
                              v.priceTiers.length > 0
                                  ? v.priceTiers.map((t) => ({
                                        minQuantity: String(t.minQuantity),
                                        unitPrice: String(t.unitPrice),
                                    }))
                                  : [{ ...emptyPriceTier }],
                      }))
                    : [
                          {
                              ...emptyVariant,
                              priceTiers: [{ ...emptyPriceTier }],
                          },
                      ],
            compatibleProductIds: product.lids.map(
                (l) => l.compatibleProductId,
            ),
        });
        setAvatarImage(null);
        setGalleryImages([]);
        setMessage("");
        setError("");
        router.push("/admin/product?mode=edit");
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const categoryId = Number(form.categoryId);
        if (!form.name.trim() || Number.isNaN(categoryId) || categoryId <= 0) {
            showError("Vui lòng nhập tên sản phẩm và chọn danh mục.");
            return;
        }

        const variants = form.variants
            .filter((v) => v.capacityMl && v.diameterMm)
            .map((v) => ({
                capacityMl: Number(v.capacityMl),
                diameterMm: Number(v.diameterMm),
                priceTiers: v.priceTiers
                    .filter((t) => t.minQuantity && t.unitPrice)
                    .map((t) => ({
                        minQuantity: Number(t.minQuantity),
                        unitPrice: Number(t.unitPrice),
                    })),
            }))
            .filter((v) => v.priceTiers.length > 0);

        if (variants.length === 0) {
            showError("Cần ít nhất 1 biến thể với bảng giá hợp lệ.");
            return;
        }

        if (!selectedId && !avatarImage) {
            showError("Vui lòng chọn ảnh đại diện cho sản phẩm.");
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
                    compatibleProductIds:
                        form.compatibleProductIds.length > 0
                            ? form.compatibleProductIds
                            : undefined,
                });
                if (hasNewImages) {
                    await addProductImages(
                        selectedId,
                        avatarImage,
                        galleryImages.length > 0 ? galleryImages : undefined,
                    );
                }
                setMessage("Đã cập nhật sản phẩm.");
            } else {
                await createProduct({
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    categoryId,
                    variants,
                    compatibleProductIds:
                        form.compatibleProductIds.length > 0
                            ? form.compatibleProductIds
                            : undefined,
                    avatarImage,
                    galleryImages,
                });
                setMessage("Đã tạo sản phẩm mới.");
            }
            await refreshProducts();
            closeForm();
        } catch (err) {
            showError(normalizeProductApiError(err));
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
            await refreshProducts();
            if (selectedId === deleteTarget) closeForm();
            setMessage("Đã xóa sản phẩm.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Không thể xóa sản phẩm.",
            );
        } finally {
            setIsSubmitting(false);
            setDeleteTarget(null);
        }
    };

    if (isFormMode) {
        return (
            <div className="admin-product-form">
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
                    {/* min-w-0 on both columns: truncated lid names must not widen the grid tracks */}
                    <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
                        <div className="min-w-0 space-y-4 lg:col-span-2">
                            <AdminCard className="space-y-4 p-4">
                                <label className="block">
                                    <FieldLabel required>Tên sản phẩm</FieldLabel>
                                    <AdminField
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder="Nhập tên sản phẩm"
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
                                    <FieldLabel>Mô tả sản phẩm</FieldLabel>
                                    <AdminTextArea
                                        rows={2}
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        placeholder="Nhập mô tả sản phẩm..."
                                    />
                                </label>
                            </AdminCard>

                            <AdminCard className="p-4">
                                <VariantEditor
                                    variants={form.variants}
                                    onChange={(variants) =>
                                        setForm((prev) => ({ ...prev, variants }))
                                    }
                                />
                            </AdminCard>

                            <AdminCard className="p-4">
                                {/* min-w-0: a fieldset defaults to min-content width and would overflow on long lid names */}
                                <fieldset className="min-w-0">
                                    <legend className="mb-3 text-base font-semibold text-ink">
                                        Nắp tương thích
                                    </legend>
                                    <LidSelector
                                        selectedIds={form.compatibleProductIds}
                                        allLids={allLids}
                                        productDiameters={productDiameters}
                                        onChange={(compatibleProductIds) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                compatibleProductIds,
                                            }))
                                        }
                                    />
                                </fieldset>
                            </AdminCard>
                        </div>

                        <AdminCard className="mt-4 grid min-w-0 gap-4 p-4 md:grid-cols-2 lg:mt-0 lg:grid-cols-1">
                            <div>
                                <FieldLabel required={!selectedId}>
                                    Ảnh đại diện
                                </FieldLabel>
                                <AdminImageUploadBox
                                    inputRef={avatarInputRef}
                                    previewUrl={avatarPreviewUrl}
                                    existingImageUrl={existingAvatar}
                                    onFileChange={handleAvatarFileChange}
                                    onOpenPicker={openAvatarPicker}
                                />
                            </div>
                            <div>
                                <FieldLabel>Thư viện ảnh</FieldLabel>
                                <AdminGalleryPicker
                                    inputRef={galleryInputRef}
                                    imageSources={galleryImageSources}
                                    existingImages={existingGallery}
                                    onFileChange={handleGalleryFileChange}
                                    onOpenPicker={openGalleryPicker}
                                    onDeleteExisting={
                                        selectedId
                                            ? setImageDeleteTarget
                                            : undefined
                                    }
                                />
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
                            {isSubmitting ? "Đang lưu..." : "Lưu sản phẩm"}
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
                title="Quản lý sản phẩm"
                action={
                    <AdminPrimaryButton type="button" onClick={startCreate}>
                        <PlusIcon />
                        Thêm
                    </AdminPrimaryButton>
                }
            />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                        placeholder="Tìm sản phẩm..."
                        aria-label="Tìm sản phẩm"
                        className="pl-10"
                    />
                </div>
                <div
                    role="group"
                    aria-label="Lọc theo loại ly"
                    className="flex flex-wrap gap-2"
                >
                    {tabs.map((tab) => (
                        <AdminChip
                            key={tab}
                            active={activeTab === tab}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </AdminChip>
                    ))}
                </div>
            </div>
            {productsError ? (
                <Notice tone="danger">Không tải được sản phẩm.</Notice>
            ) : null}
            {categoriesError ? (
                <Notice tone="danger">Không tải được danh mục.</Notice>
            ) : null}
            {message ? <Notice tone="success">{message}</Notice> : null}
            {error ? <Notice tone="danger">{error}</Notice> : null}

            <section aria-label="Danh sách sản phẩm" className="space-y-2">
                {visibleProducts.map((product) => {
                    const minPrice = getMinPrice(product);
                    const meta = [
                        product.categoryName || "Chưa có danh mục",
                        product.variants
                            .map((v) => `${v.capacityMl}ml`)
                            .join(", "),
                        product.lids.length > 0
                            ? `${product.lids.length} nắp`
                            : "",
                    ]
                        .filter(Boolean)
                        .join(" · ");
                    return (
                        <AdminCard
                            key={product.id}
                            className="flex items-center gap-3 p-3 md:gap-4"
                        >
                            <Image
                                src={getProductImageSrc(product)}
                                alt=""
                                width={56}
                                height={56}
                                className="h-14 w-14 shrink-0 rounded-md object-cover"
                            />
                            <div className="min-w-0 flex-1 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4">
                                <div className="min-w-0">
                                    <h2 className="truncate text-base font-semibold text-ink">
                                        {product.name}
                                    </h2>
                                    <p className="truncate text-sm text-muted">
                                        {meta}
                                    </p>
                                </div>
                                <p className="mt-1 text-sm text-body md:mt-0 md:text-right">
                                    {minPrice !== null ? (
                                        <>
                                            Từ{" "}
                                            <span className="font-semibold text-ink">
                                                {adminFormatMoney(minPrice)}
                                            </span>
                                        </>
                                    ) : (
                                        "Liên hệ"
                                    )}
                                </p>
                            </div>
                            <div className="flex shrink-0 flex-col gap-2 md:flex-row">
                                <IconButton
                                    label={`Sửa ${product.name}`}
                                    onClick={() => editProduct(product)}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    label={`Xóa ${product.name}`}
                                    tone="danger"
                                    onClick={() =>
                                        setDeleteTarget(product.id)
                                    }
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </div>
                        </AdminCard>
                    );
                })}
                {visibleProducts.length === 0 && !isLoadingMore ? (
                    <AdminEmptyState>Chưa có sản phẩm phù hợp.</AdminEmptyState>
                ) : null}
                {isLoadingMore ? (
                    <div role="status" className="flex justify-center py-4">
                        <span
                            className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
                            aria-hidden="true"
                        />
                        <span className="sr-only">Đang tải thêm sản phẩm</span>
                    </div>
                ) : null}
                {hasMore ? (
                    <div ref={scrollSentinelRef} className="h-1" />
                ) : null}
            </section>

            <ConfirmModal
                open={deleteTarget !== null}
                title="Xóa sản phẩm?"
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
