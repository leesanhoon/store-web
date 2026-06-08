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
import {
    createProduct,
    deleteProduct,
    getProducts,
    normalizeProductApiError,
    ProductDto,
    updateProduct,
    validateProductImages,
} from "@/lib/api/products";
import { getProductImageSrc } from "@/lib/products/display";
import {
    AdminCard,
    AdminChip,
    AdminField,
    AdminPrimaryButton,
    AdminSectionHeader,
    AdminSelect,
    AdminStatusBadge,
    AdminTextArea,
    adminFormatMoney,
} from "@/components/admin/admin-ui";

type ProductForm = {
    name: string;
    description: string;
    price: string;
    stockQuantity: string;
    categoryId: string;
    volume: string;
    lidOptions: string;
    priceTiers: string;
    status: ProductStatus;
};

type ProductStatus = "Đang hiển thị" | "Ẩn" | "Hết hàng" | "Ngừng bán";
type Props = {
    initialProducts: ProductDto[];
    initialCategories: CategoryDto[];
};

const tabs = ["Tất cả", "Ly nhựa", "Ly giấy", "Nắp", "Phụ kiện"];
const volumeOptions = ["16oz", "20oz", "12oz", "500ml", "700ml"];
const statusOptions: ProductStatus[] = [
    "Đang hiển thị",
    "Ẩn",
    "Hết hàng",
    "Ngừng bán",
];
const lidOptionList = ["Không nắp", "Nắp bằng", "Nắp cầu", "Nắp sip"];
const fallbackCategories: CategoryDto[] = [
    { id: 1, name: "Ly nhựa", description: "", products: [] },
    { id: 2, name: "Ly giấy", description: "", products: [] },
    { id: 3, name: "Nắp", description: "", products: [] },
    { id: 4, name: "Phụ kiện", description: "", products: [] },
];
const sampleGallery = [
    "/images/mockups/pet-500-amber.png",
    "/images/mockups/paper-360-linen.png",
    "/images/ly/coc-nhua-dung-tau-hu-7.png",
    "/images/ly/coc-nhua-ly-nhua.png",
    "/images/ly/ly-nhua-pp-coc-nhua-pp_500x500.png",
];
const mockProducts: ProductDto[] = [
    {
        id: -1,
        name: "Ly PET 16oz",
        description: "Ly nhựa",
        price: 850,
        stockQuantity: 1000,
        categoryId: 1,
        categoryName: "Ly nhựa",
        avatarImageUrl: "/images/mockups/pet-500-amber.png",
    },
    {
        id: -2,
        name: "Ly PET 20oz",
        description: "Ly nhựa",
        price: 950,
        stockQuantity: 1000,
        categoryId: 1,
        categoryName: "Ly nhựa",
        avatarImageUrl: "/images/mockups/pet-700-velvet.png",
    },
    {
        id: -3,
        name: "Ly giấy 12oz",
        description: "Ly giấy",
        price: 1200,
        stockQuantity: 1000,
        categoryId: 2,
        categoryName: "Ly giấy",
        avatarImageUrl: "/images/mockups/paper-360-linen.png",
    },
    {
        id: -4,
        name: "Nắp cầu PET",
        description: "Nắp ly",
        price: 350,
        stockQuantity: 1000,
        categoryId: 3,
        categoryName: "Nắp",
        avatarImageUrl: "/images/ly/coc-nhua-dung-tau-hu-7.png",
    },
];
const initialForm: ProductForm = {
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    categoryId: "",
    volume: "",
    lidOptions: "",
    priceTiers: "",
    status: "Đang hiển thị",
};

function normalizeSearch(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
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

function CopyIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="M8 8h10v12H8V8Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <path
                d="M6 16H4V4h10v2"
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

function statusTone(status: ProductStatus) {
    if (status === "Đang hiển thị") return "success" as const;
    if (status === "Hết hàng") return "warning" as const;
    if (status === "Ngừng bán") return "danger" as const;
    return "neutral" as const;
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
    const [localProducts, setLocalProducts] = useState<ProductDto[]>([]);
    const [productStatuses, setProductStatuses] = useState<
        Record<number, ProductStatus>
    >({});
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
    const avatarPreviewUrl = useMemo(
        () => (avatarImage ? URL.createObjectURL(avatarImage) : ""),
        [avatarImage],
    );
    const galleryPreviews = useObjectUrls(galleryImages);
    const baseProducts = products.length > 0 ? products : mockProducts;
    const listProducts = [...localProducts, ...baseProducts];
    const categoryOptions =
        categories.length > 0 ? categories : fallbackCategories;
    const galleryImageSources =
        galleryPreviews.length > 0
            ? galleryPreviews.map(({ url }) => url)
            : sampleGallery;
    const categorySelectOptions = categoryOptions.map((category) => ({
        value: String(category.id),
        label: category.name,
    }));
    const isFormMode = mode === "create" || selectedId !== null;
    const formTitle = selectedId ? "Sửa sản phẩm" : "Thêm sản phẩm";

    const visibleProducts = listProducts.filter((product) => {
        const status = productStatuses[product.id] ?? "Đang hiển thị";
        const text = normalizeSearch(
            `${product.name} ${product.description ?? ""} ${product.categoryName} ${status}`,
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
        if (product.id < 0) return;
        setSelectedId(product.id);
        setForm({
            name: product.name,
            description: product.description ?? "",
            price: String(product.price),
            stockQuantity: String(product.stockQuantity),
            categoryId: String(product.categoryId),
            volume: "",
            lidOptions: "Nắp bằng, Nắp cầu",
            priceTiers: "1.000 sp: giá mặc định",
            status: productStatuses[product.id] ?? "Đang hiển thị",
        });
        setAvatarImage(null);
        setGalleryImages([]);
        setMessage("");
        setError("");
        router.push("/admin/product?mode=edit");
    };

    const cloneProduct = (product: ProductDto) => {
        const clone: ProductDto = {
            ...product,
            id: -Date.now(),
            name: `${product.name} copy`,
        };
        setLocalProducts((current) => [clone, ...current]);
        setProductStatuses((current) => ({ ...current, [clone.id]: "Ẩn" }));
        setMessage("Đã tạo bản sao sản phẩm ở trạng thái Ẩn.");
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            price: Number(form.price),
            stockQuantity: Number(form.stockQuantity),
            categoryId: Number(form.categoryId),
        };
        if (
            !payload.name ||
            Number.isNaN(payload.price) ||
            Number.isNaN(payload.stockQuantity) ||
            Number.isNaN(payload.categoryId) ||
            payload.categoryId <= 0
        ) {
            setError("Vui lòng nhập tên, giá, MOQ và danh mục hợp lệ.");
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
                await updateProduct(selectedId, payload);
                setProductStatuses((current) => ({
                    ...current,
                    [selectedId]: form.status,
                }));
                setMessage("Đã cập nhật sản phẩm.");
            } else {
                await createProduct({ ...payload, avatarImage, galleryImages });
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
        if (productId < 0) {
            setLocalProducts((current) =>
                current.filter((product) => product.id !== productId),
            );
            return;
        }
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
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    name: event.target.value,
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
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <FieldLabel required>Giá từ (đ)</FieldLabel>
                            <AdminField
                                type="number"
                                value={form.price}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        price: event.target.value,
                                    }))
                                }
                                placeholder="Ví dụ: 850"
                            />
                        </label>
                        <label className="block">
                            <FieldLabel required>MOQ</FieldLabel>
                            <AdminField
                                type="number"
                                value={form.stockQuantity}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        stockQuantity: event.target.value,
                                    }))
                                }
                                placeholder="Ví dụ: 1000"
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <FieldLabel>Dung tích</FieldLabel>
                            <AdminSelect
                                value={form.volume}
                                onValueChange={(value) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        volume: value,
                                    }))
                                }
                                placeholder="Chọn dung tích"
                                options={volumeOptions.map((item) => ({
                                    value: item,
                                    label: item,
                                }))}
                            />
                        </label>
                        <label className="block">
                            <FieldLabel>Trạng thái</FieldLabel>
                            <AdminSelect
                                value={form.status}
                                onValueChange={(value) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        status: value as ProductStatus,
                                    }))
                                }
                                options={statusOptions.map((item) => ({
                                    value: item,
                                    label: item,
                                }))}
                            />
                        </label>
                    </div>
                    <label className="block">
                        <FieldLabel>Mô tả sản phẩm</FieldLabel>
                        <AdminTextArea
                            rows={2}
                            value={form.description}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: event.target.value,
                                }))
                            }
                            placeholder="Nhập mô tả sản phẩm..."
                        />
                    </label>

                    <AdminCard className="space-y-3 p-3.5">
                        <h2 className="text-[14px] font-extrabold">
                            Cấu hình bán hàng
                        </h2>
                        <label className="block">
                            <FieldLabel>Nắp tương thích</FieldLabel>
                            <AdminSelect
                                value={form.lidOptions}
                                onValueChange={(value) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        lidOptions: value,
                                    }))
                                }
                                placeholder="Chọn nắp"
                                options={lidOptionList.map((item) => ({
                                    value: item,
                                    label: item,
                                }))}
                            />
                        </label>
                        <label className="block">
                            <FieldLabel>Bảng giá theo số lượng</FieldLabel>
                            <AdminTextArea
                                rows={2}
                                value={form.priceTiers}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        priceTiers: event.target.value,
                                    }))
                                }
                                placeholder="Ví dụ: 1.000 sp: 850đ, 5.000 sp: 780đ"
                            />
                        </label>
                        <p className="text-[11px] font-semibold text-slate-500">
                            Các trường cấu hình đang lưu ở UI để chờ backend hỗ
                            trợ, không gửi vào payload sản phẩm hiện tại.
                        </p>
                    </AdminCard>

                    <div className="grid gap-4 min-[431px]:grid-cols-[0.95fr_1.05fr]">
                        <div>
                            <FieldLabel required>Ảnh đại diện</FieldLabel>
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
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm sản phẩm, trạng thái..."
                    className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#101a36] outline-none placeholder:text-slate-400"
                />
            </label>
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                    Không tải được sản phẩm, đang dùng dữ liệu dự phòng.
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
                    const status =
                        productStatuses[product.id] ?? "Đang hiển thị";
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
                                                {adminFormatMoney(
                                                    product.price,
                                                )}
                                            </b>
                                        </div>
                                        <div>
                                            <span className="block">MOQ</span>
                                            <b className="text-[14px] text-[#101a36]">
                                                {new Intl.NumberFormat(
                                                    "vi-VN",
                                                ).format(product.stockQuantity)}
                                            </b>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <AdminStatusBadge
                                            tone={statusTone(status)}
                                        >
                                            {status}
                                        </AdminStatusBadge>
                                        <span className="rounded-lg bg-[#f8f0e6] px-2 py-1 text-[10px] font-extrabold text-[#3d4860]">
                                            Logo theo yêu cầu
                                        </span>
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
                                        label="Nhân bản sản phẩm"
                                        onClick={() => cloneProduct(product)}
                                    >
                                        <CopyIcon />
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
