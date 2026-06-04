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

type ProductForm = { name: string; description: string; price: string; stockQuantity: string; categoryId: string };
const initialForm: ProductForm = { name: "", description: "", price: "", stockQuantity: "", categoryId: "" };

type Props = { initialProducts: ProductDto[]; initialCategories: CategoryDto[] };

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

    useEffect(() => { void getMaterials().then(setMaterials).catch(() => setMaterials([])); void getPrintTypes().then(setPrintTypes).catch(() => setPrintTypes([])); }, []);

    const loadConfigurations = async (productId: number) => {
        try {
            setConfigurations(await getProductConfigurations(productId));
        } catch {
            setConfigurations(null);
        }
    };

    const editProduct = (product: ProductDto) => {
        setSelectedId(product.id);
        setForm({ name: product.name, description: product.description ?? "", price: String(product.price), stockQuantity: String(product.stockQuantity), categoryId: String(product.categoryId) });
        setSubmitMessage("");
        setSubmitError("");
        void loadConfigurations(product.id);
    };

    const clearForm = () => { setSelectedId(null); setForm(initialForm); setConfigurations(null); setSubmitMessage(""); setSubmitError(""); };

    const reload = async () => { setLoadError(""); try { setProducts(await getProducts()); } catch (error) { setLoadError(error instanceof Error ? error.message : "Kh�ng th? t?i l?i danh s�ch s?n ph?m t? API."); } };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = form.name.trim(); const description = form.description.trim(); const price = Number(form.price); const stockQuantity = Number(form.stockQuantity); const categoryId = Number(form.categoryId);
        if (!name || !description || Number.isNaN(price) || Number.isNaN(stockQuantity) || Number.isNaN(categoryId)) return;
        setIsSubmitting(true); setSubmitMessage(""); setSubmitError("");
        try { const payload = { name, description, price, stockQuantity, categoryId }; if (selectedId) { await updateProduct(selectedId, payload); setSubmitMessage("�� c?p nh?t s?n ph?m."); } else { await createProduct(payload); setSubmitMessage("�� t?o s?n ph?m m?i."); } await reload(); clearForm(); } catch (error) { setSubmitError(error instanceof Error ? error.message : "Kh�ng th? luu s?n ph?m."); } finally { setIsSubmitting(false); }
    };

    const handleDelete = async (productId: number) => { const confirmed = window.confirm("X�a s?n ph?m n�y?"); if (!confirmed) return; setIsSubmitting(true); setSubmitMessage(""); setSubmitError(""); try { await deleteProduct(productId); await reload(); if (selectedId === productId) clearForm(); setSubmitMessage("�� x�a s?n ph?m."); } catch (error) { setSubmitError(error instanceof Error ? error.message : "Kh�ng th? x�a s?n ph?m."); } finally { setIsSubmitting(false); } };

    const handleAddMaterial = async () => { if (!selectedId) return; await addProductMaterialConfiguration(selectedId, { materialId: Number(materialId), extraPrice: Number(materialExtraPrice) }); await loadConfigurations(selectedId); };
    const handleAddPrint = async () => { if (!selectedId) return; await addProductPrintOptionConfiguration(selectedId, { printTypeId: Number(printTypeId), extraPrice: Number(printExtraPrice) }); await loadConfigurations(selectedId); };

    return (
        <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="order-2 min-w-0 rounded-3xl border border-[#e6e0d8] bg-white p-5 xl:order-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold text-header">Qu?n l� s?n ph?m</h1><p className="mt-1 text-sm text-slate-600">CRUD cho s?n ph?m v� c?u h�nh product.</p></div><button type="button" onClick={clearForm} className="button-secondary">T?o m?i</button></div>
                {loadError ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">{loadError}</p> : null}
                {submitMessage ? <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{submitMessage}</p> : null}
                {submitError ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{submitError}</p> : null}
                <div className="mt-5 hidden overflow-hidden rounded-2xl border border-[#e6e0d8] md:block"><table className="w-full text-left"><thead className="bg-[#fcfaf7] text-xs uppercase tracking-[0.2em] text-slate-500"><tr><th className="px-3 py-3">ID</th><th className="px-3 py-3">T�n</th><th className="px-3 py-3">Danh m?c</th><th className="px-3 py-3">Gi�</th><th className="px-3 py-3">T?n kho</th><th className="px-3 py-3">K� hi?u</th><th className="px-3 py-3 text-right">Thao t�c</th></tr></thead><tbody className="divide-y divide-[#eee7de] text-sm text-slate-700">{products.map((product) => { const info = getProductDisplayInfo(product); return (<tr key={product.id} className={`hover:bg-[#fbfaf7] ${selectedId === product.id ? "bg-slate-50" : ""}`}><td className="px-3 py-3">{product.id}</td><td className="px-3 py-3 font-medium text-header">{product.name}</td><td className="px-3 py-3">{product.categoryName || info.cupType}</td><td className="px-3 py-3">{formatCurrency(product.price)}</td><td className="px-3 py-3">{product.stockQuantity}</td><td className="px-3 py-3 text-slate-500">{info.volume} | {info.printOption}</td><td className="px-3 py-3"><div className="flex justify-end gap-2"><button type="button" className="button-secondary px-3 py-2 text-xs" onClick={() => editProduct(product)}>S?a</button><button type="button" className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700" onClick={() => void handleDelete(product.id)} disabled={isSubmitting}>X�a</button></div></td></tr>);})}</tbody></table></div>
            </div>
            <aside className="order-1 min-w-0 rounded-3xl border border-[#e6e0d8] bg-[#fbfaf7] p-5 xl:order-2">
                <h2 className="text-lg font-semibold text-header">{selectedId ? `S?a s?n ph?m #${selectedId}` : "Th�m s?n ph?m"}</h2>
                <form onSubmit={onSubmit} className="mt-4 space-y-3">
                    <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="T�n s?n ph?m" className="input-modern" />
                    <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="M� t?" rows={4} className="input-modern" />
                    <input type="number" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="Gi�" className="input-modern" />
                    <input type="number" value={form.stockQuantity} onChange={(event) => setForm((prev) => ({ ...prev, stockQuantity: event.target.value }))} placeholder="S? lu?ng t?n" className="input-modern" />
                    <select value={form.categoryId} onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))} className="input-modern"><option value="">Ch?n danh m?c</option>{categories.map((category) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}</select>
                    <button type="submit" disabled={isSubmitting} className="button-primary w-full">{isSubmitting ? "�ang luu..." : selectedId ? "C?p nh?t s?n ph?m" : "Th�m s?n ph?m"}</button>
                </form>

                {selectedProduct ? (
                    <div className="mt-6 space-y-3 rounded-2xl border border-[#e6e0d8] bg-white p-4">
                        <h3 className="font-semibold text-header">C?u h�nh s?n ph?m</h3>
                        <div className="space-y-2 text-sm text-slate-700">
                            {configurations?.materials?.map((item) => <div key={item.id} className="rounded-xl bg-[#fcfaf7] p-3">Material: {item.materialName} | +{formatCurrency(item.extraPrice)}</div>)}
                            {configurations?.printOptions?.map((item) => <div key={item.id} className="rounded-xl bg-[#fcfaf7] p-3">Print: {item.printTypeName} | +{formatCurrency(item.extraPrice)}</div>)}
                        </div>
                        <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className="input-modern"><option value="">Ch?n material</option>{materials.map((m) => <option key={m.id} value={String(m.id)}>{m.name}</option>)}</select>
                        <input value={materialExtraPrice} onChange={(e) => setMaterialExtraPrice(e.target.value)} type="number" className="input-modern" placeholder="Ph? thu material" />
                        <button type="button" onClick={() => void handleAddMaterial()} className="button-secondary w-full">Th�m material cho s?n ph?m</button>
                        <select value={printTypeId} onChange={(e) => setPrintTypeId(e.target.value)} className="input-modern"><option value="">Ch?n print type</option>{printTypes.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}</select>
                        <input value={printExtraPrice} onChange={(e) => setPrintExtraPrice(e.target.value)} type="number" className="input-modern" placeholder="Ph? thu print" />
                        <button type="button" onClick={() => void handleAddPrint()} className="button-secondary w-full">Th�m print option cho s?n ph?m</button>
                    </div>
                ) : null}
            </aside>
        </div>
    );
}
