import { redirect } from "next/navigation";

export default async function LidDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    redirect(`/product/${id}`);
}
