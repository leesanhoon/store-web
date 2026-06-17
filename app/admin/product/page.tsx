import { connection } from "next/server";
import { getCategories } from "@/lib/api/categories";
import { getProducts } from "@/lib/api/products";
import AdminProductClient from "@/components/admin/AdminProductClient";

export default async function AdminProductPage() {
    await connection();
    const [productResult, categoryResult] = await Promise.allSettled([
        getProducts({ page: 1, pageSize: 10 }),
        getCategories(),
    ]);
    const products =
        productResult.status === "fulfilled" ? productResult.value.items : [];
    const categories =
        categoryResult.status === "fulfilled" ? categoryResult.value : [];

    return (
        <AdminProductClient
            initialProducts={products}
            initialCategories={categories}
        />
    );
}
