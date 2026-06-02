import { getCategories } from "@/lib/api/categories";
import { getProducts } from "@/lib/api/products";
import AdminProductClient from "@/components/admin/AdminProductClient";

export default async function AdminProductPage() {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);

    return <AdminProductClient initialProducts={products} initialCategories={categories} />;
}
