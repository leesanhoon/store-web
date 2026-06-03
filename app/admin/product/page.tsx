import { getCatalogCategories, getCatalogProducts } from "@/lib/data/catalog";
import AdminProductClient from "@/components/admin/AdminProductClient";

export default async function AdminProductPage() {
    const [products, categories] = await Promise.all([getCatalogProducts(), getCatalogCategories()]);

    return <AdminProductClient initialProducts={products} initialCategories={categories} />;
}
