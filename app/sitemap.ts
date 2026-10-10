import type { MetadataRoute } from "next";
import { getCatalogProducts } from "@/lib/data/catalog";
import { getCatalogPartners } from "@/lib/data/partners";
import { SITE } from "@/lib/site";

// Built per request: a build-time sitemap would freeze the product list (or an API outage) until the next deploy.
export const dynamic = "force-dynamic";

const STATIC_PATHS = ["/", "/products", "/gallery", "/gioi-thieu", "/lien-he"];

async function loadIds(label: string, load: () => Promise<{ id: number }[]>) {
    try {
        return (await load()).map(({ id }) => id);
    } catch (error) {
        console.error(`[sitemap] Không tải được ${label}`, error);
        return [];
    }
}

// Lids are products too and live at /product/{id}; /lid/{id} only redirects there, so it is left out.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Without a configured domain there is no absolute URL to publish.
    if (!SITE.url) return [];

    const [productIds, partnerIds] = await Promise.all([
        loadIds("sản phẩm", getCatalogProducts),
        loadIds("đối tác", getCatalogPartners),
    ]);

    return [
        ...STATIC_PATHS,
        ...productIds.map((id) => `/product/${id}`),
        ...partnerIds.map((id) => `/partner/${id}`),
    ].map((path) => ({ url: `${SITE.url}${path}` }));
}
