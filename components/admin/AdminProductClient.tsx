"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
    addProductMaterialConfiguration,
    addProductPrintOptionConfiguration,
    createProduct,
    deleteProduct,
    getProductConfigurations,
    getProducts,
    ProductConfigurationsDto,
    ProductDto,
    updateProduct,
} from "@/lib/api/products";
import { CategoryDto } from "@/lib/api/categories";
import { getMaterials, type MaterialDto } from "@/lib/api/materials";
import { getPrintTypes, type PrintTypeDto } from "@/lib/api/print-types";
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

export default function AdminProductClient({ initialProducts, initialCategories }: Props) {
    const [products, setProducts] = useState<ProductDto[]>(initialProducts);
    const [categories] = useState<CategoryDto[]>(initialCategories);
    const [materials, setMaterials] = useState<MaterialDto[]>([]);
    const [printTypes, setPrintTypes] = useState<PrintTypeDto[]>([]);
    const [configurations, setConfigurations] = useState<ProductConfigurationsDto | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [submitMessage, setSubmitMessage] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState<ProductForm>(initialForm);
    const [materialId, setMaterialId] = useState("");
    const [materialExtraPrice, setMaterialExtraPrice] = useState("0");
    const [printTypeId, setPrintTypeId] = useState("");
    const [printExtraPrice, setPrintExtraPrice] = useState("0");

    const selectedProduct = useMemo(() => products.find((product) => product.id === selectedId) ?? null, [products, selectedId]);

    useEffect(() => {
        void getMaterials().then(setMaterials).catch(() => setMaterials([]));
        void getPrintTypes().then(setPrintTypes).catch(() => setPrintTypes([]));
    }, []);

    const loadConfigurations = async (productId: number) => {
        try {
            setConfigurations(await getProductConfigurations(productId));
        } catch {
            setConfigurations(null);
        }
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
        setSubmitMessage("");
        setSubmitError("");
        void loadConfigurations(product.id);
    };

    const clearForm = () => {
        setSelectedId(null);
        setForm(initialForm);
        setConfigurations(null);
        setSubmitMessage("");
        setSubmitError("");
    };

    const reload = async () => {
        setLoadError("");
        try {
            setProducts(await getProducts());
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Không thể tải lại danh sách sản phẩm từ API.");
        }
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = form.name.trim();
        const description = form.description.trim();
        const price = Number(form.price);
        const stockQuantity = Number(form.stockQuantity);
        const categoryId = Number(form.categoryId);

        if (!name || !description || Number.isNaN(price) || Number.isNaN(stockQuantity) || Number.isNaN(categoryId)) {
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage("");
        setSubmitError("");

        try {
            const payload = { name, description, price, stockQuantity, categoryId };

            if (selectedId) {
                await updateProduct(selectedId, payload);
                setSubmitMessage("Đã cập nhật sản phẩm.");
            } else {
                await createProduct(payload);
                setSubmitMessage("Đã tạo sản phẩm mới.");
            }

            await reload();
            clearForm();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Không thể lưu sản phẩm.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (productId: number) => {
        const confirmed = window.confirm("Xóa sản phẩm này?");
        if (!confirmed) return;

        setIsSubmitting(true);
        setSubmitMessage("");
        setSubmitError("");

        try {
            await deleteProduct(productId);
            await reload();
            if (selectedId === productId) {
                clearForm();
            }
            setSubmitMessage("Đã xóa sản phẩm.");
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Không thể xóa sản phẩm.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddMaterial = async () => {
        if (!selectedId) return;

        await addProductMaterialConfiguration(selectedId, {
            materialId: Number(materialId),
            extraPrice: Number(materialExtraPrice),
        });
        await loadConfigurations(selectedId);
    };

    const handleAddPrint = async () => {
        if (!selectedId) return;

        await addProductPrintOptionConfiguration(selectedId, {
            printTypeId: Number(printTypeId),
            extraPrice: Number(printExtraPrice),
        });
        await loadConfigurations(selectedId);
    };

    return (
        <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="order-2 min-w-0 rounded-3xl border border-[#e6e0d8] bg-white p-5 xl:order-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-header">Quản lý sản phẩm</h1>
                        <p className="mt-1 text-sm text-slate-600">CRUD cho sản phẩm và cấu hình product.</p>
                    </div>
                    <button type="button" onClick={clearForm} className="button-secondary">
                        T?o m?i
                    </button>
                </div>

                {loadError ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">{loadError}</p> : null}
                {submitMessage ? <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{submitMessage}</p> : null}
                {submitError ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{submitError}</p> : null}

                <div className="mt-5 hidden overflow-hidden rounded-2xl border border-[#e6e0d8] md:block">
                    <table className="w-full text-left">
                        <thead className="bg-[#fcfaf7] text-xs uppercase tracking-[0.2em] text-slate-500">
                            <tr>
                                <th className="px-3 py-3">ID</th>
                                <th className="px-3 py-3">Tên</th>
                                <th className="px-3 py-3">Danh m?c</th>
                                <th className="px-3 py-3">Giá</th>
                                <th className="px-3 py-3">T?n kho</th>
                                <th className="px-3 py-3">Ký hiệu</th>
                                <th className="px-3 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eee7de] text-sm text-slate-700">
                            {products.map((product) => {
                                const info = getProductDisplayInfo(product);
                                return (
                                    <tr key={product.id} className={`hover:bg-[#fbfaf7] ${selectedId === product.id ? "bg-slate-50" : ""}`}>
                                        <td className="px-3 py-3">{product.id}</td>
                                        <td className="px-3 py-3 font-medium text-header">{product.name}</td>
                                        <td className="px-3 py-3">{product.categoryName || info.cupType}</td>
                                        <td className="px-3 py-3">{formatCurrency(product.price)}</td>
                                        <td className="px-3 py-3">{product.stockQuantity}</td>
                                        <td className="px-3 py-3 text-slate-500">{info.volume} | {info.printOption}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" className="button-secondary px-3 py-2 text-xs" onClick={() => editProduct(product)}>
                                                    S?a
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700"
                                                    onClick={() => void handleDelete(product.id)}
                                                    disabled={isSubmitting}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 space-y-3 md:hidden">
                    {products.map((product) => {
                        const info = getProductDisplayInfo(product);

                        return (
                            <article key={product.id} className="rounded-2xl border border-[#e6e0d8] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-slate-500">#{product.id}</p>
                                        <h3 className="mt-1 font-semibold text-header">{product.name}</h3>
                                        <p className="mt-1 text-sm text-slate-600">{product.categoryName || info.cupType}</p>
                                        <p className="mt-1 text-sm text-slate-600">{formatCurrency(product.price)}</p>
                                        <p className="mt-1 text-sm text-slate-600">{info.volume} | {info.printOption}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button type="button" className="button-secondary px-3 py-2 text-xs" onClick={() => editProduct(product)}>
                                            S?a
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700"
                                            onClick={() => void handleDelete(product.id)}
                                            disabled={isSubmitting}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            <aside className="order-1 min-w-0 rounded-3xl border border-[#e6e0d8] bg-[#fbfaf7] p-5 xl:order-2">
                <h2 className="text-lg font-semibold text-header">{selectedId ? `Sửa sản phẩm #${selectedId}` : "Thêm sản phẩm"}</h2>
                <p className="mt-1 text-xs text-slate-500">{selectedId ? "Cập nhật sản phẩm hiện có bằng API PUT." : "Tạo sản phẩm mới bằng API POST."}</p>

                <form onSubmit={onSubmit} className="mt-4 space-y-3">
                    <input
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Tên s?n ph?m"
                        className="input-modern"
                    />
                    <textarea
                        value={form.description}
                        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder="Mô tả"
                        rows={4}
                        className="input-modern"
                    />
                    <input
                        type="number"
                        value={form.price}
                        onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                        placeholder="Giá"
                        className="input-modern"
                    />
                    <input
                        type="number"
                        value={form.stockQuantity}
                        onChange={(event) => setForm((prev) => ({ ...prev, stockQuantity: event.target.value }))}
                        placeholder="Số lượng tồn"
                        className="input-modern"
                    />
                    <select
                        value={form.categoryId}
                        onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                        className="input-modern"
                    >
                        <option value="">Chọn danh mục</option>
                        {categories.map((category) => (
                            <option key={category.id} value={String(category.id)}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <button type="submit" disabled={isSubmitting} className="button-primary w-full">
                        {isSubmitting ? "Đang lưu..." : selectedId ? "C?p nh?t s?n ph?m" : "Thêm sản phẩm"}
                    </button>
                </form>

                {selectedProduct ? (
                    <div className="mt-6 space-y-3 rounded-2xl border border-[#e6e0d8] bg-white p-4">
                        <h3 className="font-semibold text-header">Cấu hình sản phẩm</h3>
                        <div className="space-y-2 text-sm text-slate-700">
                            {configurations?.materials?.map((item) => (
                                <div key={item.id} className="rounded-xl bg-[#fcfaf7] p-3">
                                    Material: {item.materialName} | +{formatCurrency(item.extraPrice)}
                                </div>
                            ))}
                            {configurations?.printOptions?.map((item) => (
                                <div key={item.id} className="rounded-xl bg-[#fcfaf7] p-3">
                                    Print: {item.printTypeName} | +{formatCurrency(item.extraPrice)}
                                </div>
                            ))}
                        </div>

                        <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className="input-modern">
                            <option value="">Chọn material</option>
                            {materials.map((material) => (
                                <option key={material.id} value={String(material.id)}>
                                    {material.name}
                                </option>
                            ))}
                        </select>
                        <input
                            value={materialExtraPrice}
                            onChange={(e) => setMaterialExtraPrice(e.target.value)}
                            type="number"
                            className="input-modern"
                            placeholder="Phụ thu material"
                        />
                        <button type="button" onClick={() => void handleAddMaterial()} className="button-secondary w-full">
                            Thêm material cho sản phẩm
                        </button>

                        <select value={printTypeId} onChange={(e) => setPrintTypeId(e.target.value)} className="input-modern">
                            <option value="">Chọn print type</option>
                            {printTypes.map((printType) => (
                                <option key={printType.id} value={String(printType.id)}>
                                    {printType.name}
                                </option>
                            ))}
                        </select>
                        <input
                            value={printExtraPrice}
                            onChange={(e) => setPrintExtraPrice(e.target.value)}
                            type="number"
                            className="input-modern"
                            placeholder="Phụ thu print"
                        />
                        <button type="button" onClick={() => void handleAddPrint()} className="button-secondary w-full">
                            Thêm print option cho sản phẩm
                        </button>
                    </div>
                ) : null}
            </aside>
        </div>
    );
}


