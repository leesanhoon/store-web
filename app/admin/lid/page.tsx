import { connection } from "next/server";
import { getProducts, isLidProduct } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import AdminLidClient from "@/components/admin/AdminLidClient";

export default async function AdminLidPage() {
    await connection();
    const [productResult, categoryResult] = await Promise.allSettled([
        getProducts(),
        getCategories(),
    ]);
    const allProducts = productResult.status === "fulfilled" ? productResult.value : [];
    const lids = allProducts.filter(isLidProduct);
    const categories = categoryResult.status === "fulfilled" ? categoryResult.value : [];

    return <AdminLidClient initialLids={lids} initialCategories={categories} />;
}
