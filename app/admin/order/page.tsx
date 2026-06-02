"use client";

import { useState } from "react";
import { syncOrdersFromQuotes } from "@/lib/orders";
import AdminOrderClient from "@/components/admin/AdminOrderClient";

export default function AdminOrderPage() {
    const [orders] = useState(() => syncOrdersFromQuotes());
    return <AdminOrderClient initialOrders={orders} />;
}
