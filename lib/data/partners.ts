import { getPartner, getPartners, type PartnerDto } from "@/lib/api/partners";

function isMissing(error: unknown) {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return message.includes("404") || message.includes("not found");
}

export async function getCatalogPartners(): Promise<PartnerDto[]> {
    const result = await getPartners({ page: 1, pageSize: 100 });
    return result.items;
}

export async function getCatalogPartner(
    id: number,
): Promise<PartnerDto | null> {
    try {
        return await getPartner(id);
    } catch (error) {
        if (isMissing(error)) return null;
        throw error;
    }
}
