"use client";

import Image from "next/image";
import {
    FormEvent,
    ReactNode,
    RefObject,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { CategoryDto, getCategories } from "@/lib/api/categories";
import { getLids, LidDto } from "@/lib/api/lids";
import {
    createProduct,
    deleteProduct,
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
    lidIds: number[];
};

type Props = {
    initialProducts: ProductDto[];
    initialCategories: CategoryDto[];
};

const tabs = ["Tất cả", "Ly nhựa", "Ly giấy", "Nắp"];

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
    variants: [{ ...emptyVariant, priceTiers: [{ ...emptyPriceTier }] }],
    lidIds: [],
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
    onFileChange,
    onOpenPicker,
}: {
    inputRef: RefObject<HTMLInputElement | null>;
    previewUrl: string;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenPicker: () => void;
}) {
    return (
        <div>
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
                className="grid min-h-[136px] w-full place-items-center rounded-[14px] border border-dashed border-[#8a99ad] bg-white/60 p-3 text-center text-[#3d4860] transition active:scale-[0.99] min-[431px]:min-h-[154px]"
            >
                {previewUrl ? (
                    <Image
                        src={previewUrl}
                        alt="Ảnh đại diện xem trước"
                        width={220}
                        height={180}
                        unoptimized
                        className="h-[118px] w-full rounded-xl object-cover min-[431px]:h-[136px]"
                    />
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
    onFileChange,
    onOpenPicker,
}: {
    inputRef: RefObject<HTMLInputElement | null>;
    imageSources: string[];
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenPicker: () => void;
}) {
    return (
        <div className="grid grid-cols-3 gap-2 rounded-[14px] border border-[#eadfce] bg-white p-2">
            <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                multiple
                onChange={onFileChange}
                className="hidden"
            />
            {imageSources.slice(0, 5).map((src, index) => (
                <Image
                    key={`${src}-${index}`}
                    src={src}
                    alt="Ảnh sản phẩm"
                    width={96}
                    height={86}
                    unoptimized={src.startsWith("blob:")}
                    className="h-[68px] w-full rounded-[10px] border border-[#f1e7d8] object-cover"
                />
            ))}
            <button
                type="button"
                onClick={onOpenPicker}
                className="grid h-[68px] place-items-center rounded-[10px] border border-dashed border-[#d6c9b8] bg-white text-center text-[12px] font-extrabold text-[#101a36] transition active:scale-[0.98]"
            >
                <span>
                    <span className="block text-2xl leading-none">+</span>Ảnh
                    khác
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
        updatePriceTiers(vIndex, [...v.priceTiers, { ...emptyPriceTier }]);
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
    onChange,
}: {
    selectedIds: number[];
    allLids: LidDto[];
    onChange: (ids: number[]) => void;
}) {
    const toggle = (id: number) => {
        onChange(
            selectedIds.includes(id)
                ? selectedIds.filter((i) => i !== id)
                : [...selectedIds, id],
        );
    };

    if (allLids.length === 0) {
        return (
            <p className="text-[12px] font-semibold text-slate-500">
                Chưa có nắp nào trong hệ thống. Hãy tạo nắp trước.
            </p>
        );
    }

    return (
        <div className="space-y-1.5">
            {allLids.map((lid) => {
                const checked = selectedIds.includes(lid.id);
                return (
                    <button
                        key={lid.id}
                        type="button"
                        onClick={() => toggle(lid.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${checked ? "bg-emerald-50 ring-1 ring-emerald-300" : "bg-[#fffaf2]"}`}
                    >
                        <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] ${checked ? "bg-emerald-600 text-white" : "bg-white ring-1 ring-slate-300"}`}
                        >
                            {checked ? "✓" : ""}
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-[13px] font-bold text-[#101a36]">
                                {lid.name}
                            </span>
                            <span className="block text-[10px] font-semibold text-slate-500">
                                {lid.prices
                                    .map((p) => `⌀${p.diameterMm}mm`)
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

    const {
        data: products = initialProducts,
        error: productsError,
        mutate,
    } = useSWR<ProductDto[]>("/api/v1/Products", getProducts, {
        fallbackData: initialProducts,
    });
    const { data: categories = initialCategories, error: categoriesError } =
        useSWR<CategoryDto[]>("/api/v1/Categories", getCategories, {
            fallbackData: initialCategories,
        });
    const { data: allLids = [] } = useSWR<LidDto[]>("/api/v1/Lids", getLids, {
        fallbackData: [],
    });

    const avatarPreviewUrl = useMemo(
        () => (avatarImage ? URL.createObjectURL(avatarImage) : ""),
        [avatarImage],
    );
    const galleryPreviews = useObjectUrls(galleryImages);
    const galleryImageSources = galleryPreviews.map(({ url }) => url);
    const categorySelectOptions = categories.map((c) => ({
        value: String(c.id),
        label: c.name,
    }));
    const isFormMode = mode === "create" || selectedId !== null;
    const formTitle = selectedId ? "Sửa sản phẩm" : "Thêm sản phẩm";

    const visibleProducts = products.filter((product) => {
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
            lidIds: product.lids.map((l) => l.lidId),
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

        const imageError = selectedId
            ? ""
            : validateProductImages(avatarImage, galleryImages);
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
                    lidIds: form.lidIds.length > 0 ? form.lidIds : undefined,
                });
                setMessage("Đã cập nhật sản phẩm.");
            } else {
                await createProduct({
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    categoryId,
                    variants,
                    lidIds: form.lidIds.length > 0 ? form.lidIds : undefined,
                    avatarImage,
                    galleryImages,
                });
                setMessage("Đã tạo sản phẩm mới.");
            }
            await mutate();
            closeForm();
        } catch (err) {
            setError(normalizeProductApiError(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (productId: number) => {
        if (!window.confirm("Xóa sản phẩm này?")) return;
        setIsSubmitting(true);
        setMessage("");
        setError("");
        try {
            await deleteProduct(productId);
            await mutate();
            if (selectedId === productId) closeForm();
            setMessage("Đã xóa sản phẩm.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Không thể xóa sản phẩm.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            selectedIds={form.lidIds}
                            allLids={allLids}
                            onChange={(lidIds) =>
                                setForm((prev) => ({ ...prev, lidIds }))
                            }
                        />
                    </AdminCard>

                    {!selectedId ? (
                        <div className="grid gap-4 min-[431px]:grid-cols-[0.95fr_1.05fr]">
                            <div>
                                <FieldLabel>Ảnh đại diện</FieldLabel>
                                <AdminImageUploadBox
                                    inputRef={avatarInputRef}
                                    previewUrl={avatarPreviewUrl}
                                    onFileChange={handleAvatarFileChange}
                                    onOpenPicker={openAvatarPicker}
                                />
                            </div>
                            <div>
                                <FieldLabel>Thư viện ảnh</FieldLabel>
                                <AdminGalleryPicker
                                    inputRef={galleryInputRef}
                                    imageSources={galleryImageSources}
                                    onFileChange={handleGalleryFileChange}
                                    onOpenPicker={openGalleryPicker}
                                />
                            </div>
                        </div>
                    ) : null}

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
                                            void handleDelete(product.id)
                                        }
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </div>
                            </div>
                        </AdminCard>
                    );
                })}
                {visibleProducts.length === 0 ? (
                    <AdminCard className="p-4 text-center text-[13px] font-bold text-slate-500">
                        Chưa có sản phẩm phù hợp.
                    </AdminCard>
                ) : null}
            </section>
        </div>
    );
}
