"use client";

import Image from "next/image";
import {
    FormEvent,
    ReactNode,
    RefObject,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
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
import { formatPriceRange, getMinPrice } from "@/lib/products/display";
import { getProductImageSrc } from "@/lib/products/display";
import {
    AdminCard,
    AdminChip,
    AdminField,
    AdminPrimaryButton,
    AdminSectionHeader,
    AdminSelect,
    AdminTextArea,
    adminFormatMoney,
} from "@/components/admin/admin-ui";

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

function normalizeSearch(value: string) {
    return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
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

function useObjectUrls(files: File[]) {
    return useMemo(
        () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
        [files],
    );
}

function IconButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: ReactNode;
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

function FieldLabel({
    children,
    required,
}: {
    children: ReactNode;
    required?: boolean;
}) {
    return (
        <span className="mb-1.5 block text-[13px] font-extrabold text-[#101a36]">
            {children}{" "}
            {required ? <span className="text-red-500">*</span> : null}
        </span>
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
        <div className="rounded-[18px] bg-black/[0.03] p-1.5 ring-1 ring-black/[0.06]">
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
                className="relative grid min-h-[136px] w-full place-items-center rounded-[calc(18px-6px)] bg-white p-3 text-center text-[#3d4860] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] min-[431px]:min-h-[154px]"
            >
                {displayUrl ? (
                    <>
                        <Image
                            src={displayUrl}
                            alt="Ảnh đại diện xem trước"
                            width={220}
                            height={180}
                            unoptimized={displayUrl.startsWith("blob:")}
                            className="h-[118px] w-full rounded-xl object-cover min-[431px]:h-[136px]"
                        />
                        {isExisting ? (
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
        <div className="rounded-[18px] bg-black/[0.03] p-1.5 ring-1 ring-black/[0.06]">
            <div className="grid grid-cols-3 gap-2 rounded-[calc(18px-6px)] bg-white p-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                    multiple
                    onChange={onFileChange}
                    className="hidden"
                />
                {existingImages?.map((img) => (
                    <div key={img.id} className="group relative">
                        <Image
                            src={img.imageUrl}
                            alt="Ảnh sản phẩm"
                            width={96}
                            height={86}
                            className="h-[68px] w-full rounded-[10px] border border-[#f1e7d8] object-cover transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        />
                        {onDeleteExisting ? (
                            <button
                                type="button"
                                onClick={() => onDeleteExisting(img.id)}
                                className="absolute -right-1.5 -top-1.5 grid h-[22px] w-[22px] place-items-center rounded-full bg-gradient-to-b from-rose-400 to-rose-600 text-[11px] font-bold text-white shadow-md ring-2 ring-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90"
                                aria-label="Xóa ảnh"
                            >
                                ×
                            </button>
                        ) : null}
                    </div>
                ))}
                {imageSources.slice(0, 5).map((src, index) => (
                    <div key={`${src}-${index}`} className="relative">
                        <Image
                            src={src}
                            alt="Ảnh sản phẩm"
                            width={96}
                            height={86}
                            unoptimized={src.startsWith("blob:")}
                            className="h-[68px] w-full rounded-[10px] border border-emerald-200 object-cover"
                        />
                        <span className="absolute bottom-0.5 left-0.5 rounded-full bg-emerald-600/80 px-1.5 py-px text-[8px] font-bold text-white uppercase">
                            Mới
                        </span>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={onOpenPicker}
                    className="grid h-[68px] place-items-center rounded-[10px] border border-dashed border-[#d6c9b8] bg-white/80 text-center text-[12px] font-extrabold text-[#101a36] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                >
                    <span>
                        <span className="block text-2xl leading-none">+</span>
                        Ảnh khác
                    </span>
                </button>
            </div>
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
            <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-extrabold">
                    Biến thể sản phẩm
                </h2>
                <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#101a36] px-2.5 py-1.5 text-[11px] font-extrabold text-white"
                >
                    + Thêm biến thể
                </button>
            </div>
            {variants.map((variant, vIndex) => (
                <AdminCard key={vIndex} className="space-y-3 p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] font-extrabold text-[#101a36]">
                            Biến thể {vIndex + 1}
                        </span>
                        {variants.length > 1 ? (
                            <button
                                type="button"
                                onClick={() => removeVariant(vIndex)}
                                className="text-[11px] font-bold text-rose-600"
                            >
                                Xóa
                            </button>
                        ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                            <span className="mb-1 block text-[11px] font-bold text-slate-500">
                                Dung tích (ml)
                            </span>
                            <AdminField
                                type="number"
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
                            <span className="mb-1 block text-[11px] font-bold text-slate-500">
                                ⌀ miệng (mm)
                            </span>
                            <AdminField
                                type="number"
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
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-slate-600">
                                Bảng giá theo số lượng
                            </span>
                            <button
                                type="button"
                                onClick={() => addPriceTier(vIndex)}
                                className="text-[11px] font-bold text-emerald-700"
                            >
                                + Thêm mức giá
                            </button>
                        </div>
                        {variant.priceTiers.map((tier, tIndex) => (
                            <div
                                key={tIndex}
                                className="grid grid-cols-[1fr_1fr_32px] gap-2 items-end"
                            >
                                <label className="block">
                                    {tIndex === 0 ? (
                                        <span className="mb-1 block text-[10px] font-bold text-slate-500">
                                            Từ SL
                                        </span>
                                    ) : null}
                                    <AdminField
                                        type="number"
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
                                </label>
                                <label className="block">
                                    {tIndex === 0 ? (
                                        <span className="mb-1 block text-[10px] font-bold text-slate-500">
                                            Đơn giá (đ)
                                        </span>
                                    ) : null}
                                    <AdminField
                                        type="number"
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
                                </label>
                                {variant.priceTiers.length > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removePriceTier(vIndex, tIndex)
                                        }
                                        className="grid h-[44px] w-8 place-items-center rounded-xl text-rose-500 hover:bg-rose-50"
                                        aria-label="Xóa mức giá"
                                    >
                                        ×
                                    </button>
                                ) : (
                                    <div />
                                )}
                            </div>
                        ))}
                    </div>
                </AdminCard>
            ))}
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
            <p className="text-[12px] font-semibold text-slate-500">
                Chưa có nắp nào trong hệ thống. Hãy tạo nắp trước.
            </p>
        );
    }

    if (compatibleLids.length === 0) {
        return (
            <p className="text-[12px] font-semibold text-slate-500">
                Không có nắp nào phù hợp với ⌀ miệng (
                {productDiameters.map((d) => `${d}mm`).join(", ")}).
            </p>
        );
    }

    return (
        <div className="space-y-1.5">
            {compatibleLids.map((lid) => {
                const checked = selectedIds.includes(lid.id);
                const matchingDiameters =
                    productDiameters.length > 0
                        ? lid.variants.filter((v) =>
                              productDiameters.includes(v.diameterMm),
                          )
                        : lid.variants;
                return (
                    <button
                        key={lid.id}
                        type="button"
                        onClick={() => toggle(lid.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${checked ? "bg-emerald-50 ring-1 ring-emerald-300" : "bg-[#fffaf2]"}`}
                    >
                        <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] ${checked ? "bg-emerald-600 text-white" : "bg-white ring-1 ring-slate-300"}`}
                        >
                            {checked ? "✓" : ""}
                        </span>
                        {lid.avatarImageUrl ? (
                            <Image
                                src={lid.avatarImageUrl}
                                alt={lid.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                        ) : (
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#101a36]/5 text-[16px]">
                                🫙
                            </span>
                        )}
                        <span className="min-w-0">
                            <span className="block truncate text-[13px] font-bold text-[#101a36]">
                                {lid.name}
                            </span>
                            <span className="block text-[10px] font-semibold text-slate-500">
                                {lid.categoryName
                                    ? `${lid.categoryName} · `
                                    : ""}
                                {matchingDiameters
                                    .map((v) => `⌀${v.diameterMm}mm`)
                                    .join(", ")}
                            </span>
                        </span>
                    </button>
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
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState<ProductForm>(initialForm);
    const [activeTab, setActiveTab] = useState("Tất cả");
    const [searchTerm, setSearchTerm] = useState("");
    const [avatarImage, setAvatarImage] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

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

    useEffect(() => {
        if (!productsPage) return;
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
    }, [productsPage, page]);

    useEffect(() => {
        const sentinel = scrollSentinelRef.current;
        if (!sentinel || !hasMore) return;
        const scroller =
            document.getElementById("admin-main-content") ?? undefined;
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
            const products = await getProducts();
            return products.filter(isLidProduct);
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
    useEffect(() => {
        if (selectedId) return;
        if (allLids.length === 0 || productDiameters.length === 0) return;
        const compatibleIds = allLids
            .filter((lid) =>
                lid.variants.some((v) =>
                    productDiameters.includes(v.diameterMm),
                ),
            )
            .map((lid) => lid.id);
        setForm((prev) => {
            if (
                prev.compatibleProductIds.length === compatibleIds.length &&
                prev.compatibleProductIds.every((id) =>
                    compatibleIds.includes(id),
                )
            )
                return prev;
            return { ...prev, compatibleProductIds: compatibleIds };
        });
    }, [selectedId, allLids, productDiameters]);

    const isFormMode = mode === "create" || selectedId !== null;
    const formTitle = selectedId ? "Sửa sản phẩm" : "Thêm sản phẩm";
    const editingProduct =
        productDetail ??
        (selectedId ? allProducts.find((p) => p.id === selectedId) : null);
    const existingAvatar = editingProduct?.avatarImageUrl ?? null;
    const existingGallery = editingProduct?.galleryImages ?? [];

    const handleDeleteExistingImage = async (imageId: number) => {
        if (!selectedId) return;
        try {
            await deleteProductImage(selectedId, imageId);
            await refreshProducts();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể xóa ảnh.");
        }
    };

    const visibleProducts = allProducts.filter((product) => {
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
            setError("Vui lòng nhập tên sản phẩm và chọn danh mục.");
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
            setError("Cần ít nhất 1 biến thể với bảng giá hợp lệ.");
            return;
        }

        if (!selectedId && !avatarImage) {
            setError("Vui lòng chọn ảnh đại diện cho sản phẩm.");
            return;
        }

        const hasNewImages = avatarImage || galleryImages.length > 0;
        const imageError = hasNewImages
            ? validateProductImages(avatarImage, galleryImages)
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
            setError(normalizeProductApiError(err));
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
    }, [deleteTarget, selectedId, closeForm, refreshProducts]);

    if (isFormMode) {
        return (
            <div className="admin-product-form text-[#101a36]">
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

                    <AdminCard className="p-3.5">
                        <VariantEditor
                            variants={form.variants}
                            onChange={(variants) =>
                                setForm((prev) => ({ ...prev, variants }))
                            }
                        />
                    </AdminCard>

                    <AdminCard className="space-y-3 p-3.5">
                        <h2 className="text-[14px] font-extrabold">
                            Nắp tương thích
                        </h2>
                        <LidSelector
                            selectedIds={form.compatibleProductIds}
                            allLids={allLids}
                            productDiameters={form.variants
                                .map((v) => Number(v.diameterMm))
                                .filter((d) => d > 0)}
                            onChange={(compatibleProductIds) =>
                                setForm((prev) => ({
                                    ...prev,
                                    compatibleProductIds,
                                }))
                            }
                        />
                    </AdminCard>

                    <div className="grid gap-4 min-[431px]:grid-cols-[0.95fr_1.05fr]">
                        <div>
                            <FieldLabel>Ảnh đại diện</FieldLabel>
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
                                        ? handleDeleteExistingImage
                                        : undefined
                                }
                            />
                        </div>
                    </div>

                    <AdminPrimaryButton
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full py-3 text-[16px]"
                    >
                        {isSubmitting ? "Đang lưu..." : "Lưu sản phẩm"}
                    </AdminPrimaryButton>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-3 text-[#101a36]">
            <AdminSectionHeader
                title="Quản lý sản phẩm"
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
                    placeholder="Tìm sản phẩm..."
                    className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#101a36] outline-none placeholder:text-slate-400"
                />
            </label>
            <div className="flex flex-wrap gap-3 pb-1">
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
            {productsError ? (
                <AdminCard className="p-3 text-[12px] font-semibold text-rose-700">
                    Không tải được sản phẩm.
                </AdminCard>
            ) : null}
            {categoriesError ? (
                <AdminCard className="p-3 text-[12px] font-semibold text-rose-700">
                    Không tải được danh mục.
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

            <section className="space-y-2.5">
                {visibleProducts.map((product) => {
                    const minPrice = getMinPrice(product);
                    const variantCount = product.variants.length;
                    return (
                        <AdminCard key={product.id} className="p-3">
                            <div className="grid grid-cols-[92px_1fr_auto] items-center gap-3">
                                <Image
                                    src={getProductImageSrc(product)}
                                    alt={product.name}
                                    width={180}
                                    height={180}
                                    className="h-[88px] w-[88px] rounded-[14px] object-cover"
                                />
                                <div className="min-w-0">
                                    <h2 className="truncate text-[17px] font-extrabold leading-tight text-[#101a36]">
                                        {product.name}
                                    </h2>
                                    <p className="mt-1 text-[12px] font-semibold text-[#3d4860]">
                                        {product.categoryName || "Danh mục"}
                                    </p>
                                    <div className="mt-2 grid grid-cols-2 gap-3 text-[12px] font-semibold text-[#3d4860]">
                                        <div>
                                            <span className="block">
                                                Giá từ
                                            </span>
                                            <b className="text-[14px] text-[#101a36]">
                                                {minPrice !== null
                                                    ? adminFormatMoney(minPrice)
                                                    : "Liên hệ"}
                                            </b>
                                        </div>
                                        <div>
                                            <span className="block">
                                                Biến thể
                                            </span>
                                            <b className="text-[14px] text-[#101a36]">
                                                {variantCount} loại
                                            </b>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        {product.lids.length > 0 ? (
                                            <span className="rounded-lg bg-[#f8f0e6] px-2 py-1 text-[10px] font-extrabold text-[#3d4860]">
                                                {product.lids.length} nắp
                                            </span>
                                        ) : null}
                                        {variantCount > 0 ? (
                                            <span className="rounded-lg bg-[#f8f0e6] px-2 py-1 text-[10px] font-extrabold text-[#3d4860]">
                                                {product.variants
                                                    .map(
                                                        (v) =>
                                                            `${v.capacityMl}ml`,
                                                    )
                                                    .join(", ")}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <IconButton
                                        label="Sửa sản phẩm"
                                        onClick={() => editProduct(product)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        label="Xóa sản phẩm"
                                        onClick={() =>
                                            setDeleteTarget(product.id)
                                        }
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </div>
                            </div>
                        </AdminCard>
                    );
                })}
                {visibleProducts.length === 0 && !isLoadingMore ? (
                    <AdminCard className="p-4 text-center text-[13px] font-bold text-slate-500">
                        Chưa có sản phẩm phù hợp.
                    </AdminCard>
                ) : null}
                {isLoadingMore ? (
                    <div className="flex justify-center py-4">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#101a36] border-t-transparent" />
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
