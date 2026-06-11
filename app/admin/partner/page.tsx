import { Suspense } from "react";
import { getPartners } from "@/lib/api/partners";
import AdminPartnerClient from "@/components/admin/AdminPartnerClient";

export default async function AdminPartnerPage() {
    const { items: partners } = await getPartners({ pageSize: 100 }).catch(
        () => ({ items: [] }),
    );

    return (
        <Suspense fallback={null}>
            <AdminPartnerClient initialPartners={partners} />
        </Suspense>
    );
}
