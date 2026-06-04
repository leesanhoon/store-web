import { getOrders } from "@/lib/api/orders";
import AdminOrderClient from "@/components/admin/AdminOrderClient";

export default async function AdminOrderPage() {
    const orders = await getOrders();
    return <AdminOrderClient initialOrders={orders} />;
}
