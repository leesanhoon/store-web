import { connection } from "next/server";
import { getProducts, isLidProduct } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import AdminLidClient from "@/components/admin/AdminLidClient";

export default async function AdminLidPage() {
    await connection();
    const [productResult, categoryResult] = await Promise.allSettled([
        getProducts({ page: 1, pageSize: 50 }),
        getCategories(),
    ]);
    const paginatedProducts = productResult.status === "fulfilled" ? productResult.value : { items: [], totalCount: 0 };
    const products = Array.isArray(paginatedProducts) ? paginatedProducts : paginatedProducts.items || [];
    const lids = products.filter(isLidProduct);
    const totalCount = !Array.isArray(paginatedProducts) ? paginatedProducts.totalCount : 0;
    const initialHasMore = products.length >= 50 && totalCount > products.length;
    const categories = categoryResult.status === "fulfilled" ? categoryResult.value : [];

    return <AdminLidClient initialLids={lids} initialHasMore={initialHasMore} initialCategories={categories} />;
}
