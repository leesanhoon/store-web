import { getLids } from "@/lib/api/lids";
import { getCategories } from "@/lib/api/categories";
import AdminLidClient from "@/components/admin/AdminLidClient";

export default async function AdminLidPage() {
    const [lidResult, categoryResult] = await Promise.allSettled([getLids(), getCategories()]);
    const lids = lidResult.status === "fulfilled" ? lidResult.value : [];
    const categories = categoryResult.status === "fulfilled" ? categoryResult.value : [];

    return <AdminLidClient initialLids={lids} initialCategories={categories} />;
}
