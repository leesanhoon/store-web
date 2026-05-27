"use client";

import { FormEvent, useEffect, useState } from "react";
import { createProduct, getProducts, ProductDto } from "@/lib/api/products";
import { CategoryDto, getCategories } from "@/lib/api/categories";

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

export default function AdminProductPage() {
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState("");

    const [form, setForm] = useState<ProductForm>(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        const loadProducts = async () => {
            setIsLoading(true);
            setLoadError("");
            try {
                const data = await getProducts();
                setProducts(data);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Khong the tai danh sach san pham.");
            } finally {
                setIsLoading(false);
            }
        };

        loadProducts();
    }, []);

    useEffect(() => {
        const loadCategories = async () => {
            setIsLoadingCategories(true);
            setCategoryError("");
            try {
                const data = await getCategories();
                setCategories(data);
            } catch (error) {
                setCategoryError(error instanceof Error ? error.message : "Khong the tai category.");
            } finally {
                setIsLoadingCategories(false);
            }
        };

        loadCategories();
    }, []);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = form.name.trim();
        const description = form.description.trim();
        const price = Number(form.price);
        const stockQuantity = Number(form.stockQuantity);
        const categoryId = Number(form.categoryId);

        if (!name || !description) return;
        if (Number.isNaN(price) || Number.isNaN(stockQuantity) || Number.isNaN(categoryId)) return;

        setIsSubmitting(true);
        setSubmitMessage("");
        setSubmitError("");

        try {
            await createProduct({ name, description, price, stockQuantity, categoryId });

            const refreshedProducts = await getProducts();
            setProducts(refreshedProducts);

            setForm(initialForm);
            setSubmitMessage("Tao san pham thanh cong.");
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Khong the tao san pham.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <aside className="order-1 min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 xl:order-2">
                <h2 className="text-lg font-black text-emerald-900">Them Product</h2>
                <p className="mt-1 text-xs text-emerald-800">Tao san pham moi bang API POST.</p>

                <form onSubmit={onSubmit} className="mt-4 space-y-3">
                    <input
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Ten san pham"
                        className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
                    />
                    <textarea
                        value={form.description}
                        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder="Mo ta"
                        rows={3}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
                    />
                    <input
                        type="number"
                        value={form.price}
                        onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                        placeholder="Gia"
                        className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
                    />
                    <input
                        type="number"
                        value={form.stockQuantity}
                        onChange={(event) => setForm((prev) => ({ ...prev, stockQuantity: event.target.value }))}
                        placeholder="So luong ton"
                        className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
                    />
                    <select
                        value={form.categoryId}
                        onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                        disabled={isLoadingCategories || categories.length === 0}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <option value="">Chon category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={String(category.id)}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    {isLoadingCategories ? <p className="text-xs text-slate-600">Dang tai category...</p> : null}
                    {categoryError ? <p className="text-xs font-semibold text-rose-700">{categoryError}</p> : null}

                    <button
                        type="submit"
                        disabled={isSubmitting || isLoadingCategories || categories.length === 0}
                        className="w-full rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Dang tao..." : "Them san pham"}
                    </button>

                    {submitMessage ? <p className="text-xs font-semibold text-emerald-700">{submitMessage}</p> : null}
                    {submitError ? <p className="text-xs font-semibold text-rose-700">{submitError}</p> : null}
                </form>
            </aside>

            <div className="order-2 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 xl:order-1">
                <h1 className="text-2xl font-black text-slate-900">Quan Ly Product</h1>
                <p className="mt-1 text-sm text-slate-600">Danh sach san pham hien co tu API backend.</p>

                {isLoading ? <p className="mt-4 text-sm text-slate-500">Dang tai danh sach san pham...</p> : null}
                {loadError ? <p className="mt-4 text-sm font-semibold text-rose-700">{loadError}</p> : null}

                <div className="mt-4 hidden w-full overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] text-left">
                        <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-3 py-2">Id</th>
                                <th className="px-3 py-2">Ten</th>
                                <th className="px-3 py-2">Mo ta</th>
                                <th className="px-3 py-2">Gia</th>
                                <th className="px-3 py-2">Ton kho</th>
                                <th className="px-3 py-2">Category</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2">{product.id}</td>
                                    <td className="px-3 py-2 font-semibold">{product.name}</td>
                                    <td className="px-3 py-2 text-slate-500">{product.description}</td>
                                    <td className="px-3 py-2">{product.price.toLocaleString("vi-VN")}</td>
                                    <td className="px-3 py-2">{product.stockQuantity}</td>
                                    <td className="px-3 py-2">{product.categoryName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 space-y-3 md:hidden">
                    {products.map((product) => (
                        <article key={product.id} className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">#{product.id}</p>
                            <h3 className="mt-1 font-bold text-slate-900">{product.name}</h3>
                            <p className="mt-1 text-sm text-slate-600">{product.description}</p>
                            <p className="mt-2 text-sm text-slate-700">Gia: {product.price.toLocaleString("vi-VN")}</p>
                            <p className="text-sm text-slate-700">Ton kho: {product.stockQuantity}</p>
                            <p className="text-sm text-slate-700">Category: {product.categoryName}</p>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
