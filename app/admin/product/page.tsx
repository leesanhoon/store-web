import { getCategories } from "@/lib/api/categories";
import { getProducts } from "@/lib/api/products";
import AdminProductClient from "@/components/admin/AdminProductClient";

export default async function AdminProductPage() {
    const [productResult, categoryResult] = await Promise.allSettled([getProducts(), getCategories()]);
    const products = productResult.status === "fulfilled" ? productResult.value : [];
    const categories = categoryResult.status === "fulfilled" ? categoryResult.value : [];

    return <AdminProductClient initialProducts={products} initialCategories={categories} />;
}
