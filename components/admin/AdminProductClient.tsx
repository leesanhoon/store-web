"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import {
    createProduct,
    deleteProduct,
    getProducts,
    normalizeProductApiError,
    ProductDto,
    updateProduct,
    validateProductImages,
} from "@/lib/api/products";
import { CategoryDto, getCategories } from "@/lib/api/categories";
import { formatCurrency, getProductDisplayInfo } from "@/lib/products/display";

type ProductForm = {
    name: string;
    description: string;
    price: string;
    stockQuantity: string;
    categoryId: string;
};

const initialForm: ProductForm = {
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    categoryId: "",
};

type Props = {
    initialProducts: ProductDto[];
    initialCategories: CategoryDto[];
};

function formatFileSize(bytes: number) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
    const value = bytes / 1024;
    return value >= 1024
        ? `${(value / 1024).toFixed(1)} MB`
        : `${Math.round(value)} KB`;
}

function useObjectUrls(files: File[]) {
    return useMemo(
        () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
        [files],
    );
}

export default function AdminProductClient({
    initialProducts,
    initialCategories,
}: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState<ProductForm>(initialForm);
    const [avatarImage, setAvatarImage] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const {
        data: products = initialProducts,
        error: productsError,
        mutate: mutateProducts,
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
    const loadError =
        productsError || categoriesError
            ? "Không thể tải lại dữ liệu mới nhất từ API. Đang hiển thị dữ liệu có sẵn."
            : "";

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

    const resetForm = () => {
        setSelectedId(null);
        setForm(initialForm);
        setAvatarImage(null);
        setGalleryImages([]);
    };

    const editProduct = (product: ProductDto) => {
        setSelectedId(product.id);
        setForm({
            name: product.name,
            description: product.description ?? "",
            price: String(product.price),
            stockQuantity: String(product.stockQuantity),
            categoryId: String(product.categoryId),
        });
        setAvatarImage(null);
        setGalleryImages([]);
        setMessage("");
        setError("");
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const basePayload = {
            name: form.name.trim(),
            description: form.description.trim(),
            price: Number(form.price),
            stockQuantity: Number(form.stockQuantity),
            categoryId: Number(form.categoryId),
        };

        if (
            !basePayload.name ||
            !form.price.trim() ||
            !form.stockQuantity.trim() ||
            !form.categoryId.trim() ||
            Number.isNaN(basePayload.price) ||
            Number.isNaN(basePayload.stockQuantity) ||
            Number.isNaN(basePayload.categoryId)
        ) {
            setError(
                "Vui lòng nhập tên, giá, số lượng tồn và danh mục hợp lệ.",
            );
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
                await updateProduct(selectedId, basePayload);
                setMessage("Đã cập nhật sản phẩm.");
            } else {
                await createProduct({
                    ...basePayload,
                    avatarImage,
                    galleryImages,
                });
                setMessage("Đã tạo sản phẩm mới.");
            }

            await mutateProducts();
            resetForm();
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
            await mutateProducts();
            if (selectedId === productId) resetForm();
            setMessage("Đã xóa sản phẩm.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Không thể xóa sản phẩm.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <section className="space-y-4">
                <div className="panel-strong p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Sản phẩm
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-header">
                        Quản lý sản phẩm
                    </h1>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                        Tạo, cập nhật và gắn cấu hình trực tiếp từ backend.
                    </p>
                </div>
                {loadError ? (
                    <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                        {loadError}
                    </div>
                ) : null}
                {message ? (
                    <div className="panel border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                        {message}
                    </div>
                ) : null}
                {error ? (
                    <div className="panel border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                        {error}
                    </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => {
                        const info = getProductDisplayInfo(product);
                        const isSelected = product.id === selectedId;
                        return (
                            <div
                                key={product.id}
                                className={`rounded-[1.5rem] border p-4 shadow-[var(--shadow-card)] ${isSelected ? "border-slate-900 bg-slate-50" : "border-[#e6e0d8] bg-white"}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => editProduct(product)}
                                    className="text-left"
                                >
                                    <p className="text-4xl">{info.icon}</p>
                                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        {product.categoryName || info.cupType}
                                    </p>
                                    <h2 className="mt-1 text-lg font-semibold text-header">
                                        {product.name}
                                    </h2>
                                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                                        {product.description}
                                    </p>
                                    <p className="mt-3 font-semibold text-header">
                                        {formatCurrency(product.price)}
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleDelete(product.id)
                                    }
                                    className="mt-3 button-secondary w-full"
                                >
                                    Xóa
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            <aside className="space-y-4">
                <form
                    onSubmit={onSubmit}
                    className="rounded-[1.75rem] border border-[#e6e0d8] bg-white p-6 shadow-[var(--shadow-card)] space-y-5"
                >
                    <div>
                        <h2 className="text-xl font-semibold text-header">
                            {selectedId ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Ảnh avatar và gallery sẽ có preview trước khi lưu.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <input
                            value={form.name}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                }))
                            }
                            placeholder="Tên sản phẩm"
                            className="input-modern sm:col-span-2"
                        />
                        <textarea
                            value={form.description}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: event.target.value,
                                }))
                            }
                            placeholder="Mô tả"
                            rows={4}
                            className="input-modern sm:col-span-2"
                        />
                        <input
                            type="number"
                            value={form.price}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    price: event.target.value,
                                }))
                            }
                            placeholder="Giá"
                            className="input-modern"
                        />
                        <input
                            type="number"
                            value={form.stockQuantity}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    stockQuantity: event.target.value,
                                }))
                            }
                            placeholder="Số lượng tồn"
                            className="input-modern"
                        />
                        <select
                            value={form.categoryId}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    categoryId: event.target.value,
                                }))
                            }
                            className="input-modern sm:col-span-2"
                        >
                            <option value="">Chọn danh mục</option>
                            {categories.map((category) => (
                                <option
                                    key={category.id}
                                    value={String(category.id)}
                                >
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-3">
                        <div className="rounded-[1.5rem] border border-dashed border-[#d9e4ee] bg-[#f8fbfe] p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-header">
                                        Ảnh đại diện
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Chọn một ảnh chính để hiển thị ở danh
                                        sách và chi tiết sản phẩm.
                                    </p>
                                </div>
                                {avatarImage ? (
                                    <button
                                        type="button"
                                        onClick={() => setAvatarImage(null)}
                                        className="text-xs font-semibold text-slate-600 hover:text-slate-950"
                                    >
                                        Xóa
                                    </button>
                                ) : null}
                            </div>
                            <label className="mt-4 block cursor-pointer rounded-[1.25rem] border border-white/70 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                                    onChange={(event) =>
                                        setAvatarImage(
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                        ⇪
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-header">
                                            Kéo thả hoặc bấm để chọn ảnh
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            PNG, JPG, WEBP, GIF
                                        </p>
                                    </div>
                                </div>
                            </label>
                            <div className="mt-4">
                                {avatarImage ? (
                                    <div className="overflow-hidden rounded-[1.25rem] border border-[#dbe5ef] bg-white">
                                        <Image
                                            src={avatarPreviewUrl}
                                            alt="Avatar preview"
                                            width={1200}
                                            height={800}
                                            unoptimized
                                            className="h-48 w-full object-cover"
                                        />
                                        <div className="flex items-center justify-between gap-3 border-t border-[#eef3f7] px-4 py-3 text-xs text-slate-600">
                                            <span className="truncate">
                                                {avatarImage.name}
                                            </span>
                                            <span>
                                                {formatFileSize(
                                                    avatarImage.size,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-[1.25rem] border border-dashed border-[#dbe5ef] bg-white px-4 py-8 text-center text-sm text-slate-500">
                                        Chưa có ảnh đại diện.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-dashed border-[#d9e4ee] bg-[#f8fbfe] p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-header">
                                        Thư viện ảnh
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Thêm nhiều ảnh để khách hàng xem mẫu sản
                                        phẩm từ nhiều góc độ.
                                    </p>
                                </div>
                                {galleryImages.length > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => setGalleryImages([])}
                                        className="text-xs font-semibold text-slate-600 hover:text-slate-950"
                                    >
                                        Xóa hết
                                    </button>
                                ) : null}
                            </div>
                            <label className="mt-4 block cursor-pointer rounded-[1.25rem] border border-white/70 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                                    multiple
                                    onChange={(event) =>
                                        setGalleryImages(
                                            Array.from(
                                                event.target.files ?? [],
                                            ),
                                        )
                                    }
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                        ＋
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-header">
                                            Chọn nhiều ảnh gallery
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Có thể chọn cùng lúc nhiều file
                                        </p>
                                    </div>
                                </div>
                            </label>
                            <div className="mt-4">
                                {galleryImages.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {galleryPreviews.map(
                                            ({ file, url }) => (
                                                <figure
                                                    key={`${file.name}-${file.lastModified}`}
                                                    className="overflow-hidden rounded-[1.1rem] border border-[#dbe5ef] bg-white shadow-sm"
                                                >
                                                    <Image
                                                        src={url}
                                                        alt={file.name}
                                                        width={600}
                                                        height={400}
                                                        unoptimized
                                                        className="h-28 w-full object-cover"
                                                    />
                                                    <figcaption className="space-y-1 px-3 py-2 text-[11px] text-slate-600">
                                                        <p className="truncate font-medium text-slate-700">
                                                            {file.name}
                                                        </p>
                                                        <p>
                                                            {formatFileSize(
                                                                file.size,
                                                            )}
                                                        </p>
                                                    </figcaption>
                                                </figure>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-[1.25rem] border border-dashed border-[#dbe5ef] bg-white px-4 py-8 text-center text-sm text-slate-500">
                                        Chưa có ảnh gallery.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="button-primary w-full"
                    >
                        {isSubmitting
                            ? "Đang lưu..."
                            : selectedId
                              ? "Cập nhật sản phẩm"
                              : "Thêm sản phẩm"}
                    </button>
                    {selectedId ? (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="button-secondary w-full"
                        >
                            Hủy chỉnh sửa
                        </button>
                    ) : null}
                </form>
            </aside>
        </div>
    );
}
