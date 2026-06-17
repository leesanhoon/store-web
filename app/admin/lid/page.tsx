import { connection } from "next/server";
import { getLids } from "@/lib/api/lids";
import { getCategories } from "@/lib/api/categories";
import AdminLidClient from "@/components/admin/AdminLidClient";

export default async function AdminLidPage() {
    await connection();
    const [lidResult, categoryResult] = await Promise.allSettled([
        getLids({ page: 1, pageSize: 10 }),
        getCategories(),
    ]);
    const lids = lidResult.status === "fulfilled" ? lidResult.value.items : [];
    const categories = categoryResult.status === "fulfilled" ? categoryResult.value : [];

    return <AdminLidClient initialLids={lids} initialCategories={categories} />;
}
