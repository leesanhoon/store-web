import type { ProductDto } from "@/lib/api/products";
import { getMaxPrice, getMinPrice } from "@/lib/products/display";
import { SITE } from "@/lib/site";

type JsonLdData = Record<string, unknown>;

/**
 * Inline structured data. `<` is escaped so no field can close the script tag.
 * Builders below leave empty SITE fields as `undefined`, which JSON.stringify drops.
 */
export default function JsonLd({ data }: { data: JsonLdData | null }) {
    if (!data) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    ...data,
                }).replace(/</g, "\\u003c"),
            }}
        />
    );
}

/** Fields shared by Organization and LocalBusiness. */
function getOrganizationFields() {
    const sameAs = [SITE.facebookUrl, SITE.tiktokUrl, SITE.youtubeUrl].filter(
        Boolean,
    );

    return {
        name: SITE.name,
        legalName: SITE.legalName || undefined,
        url: SITE.url || undefined,
        logo: SITE.url ? `${SITE.url}/images/logo.png` : undefined,
        email: SITE.email || undefined,
        sameAs: sameAs.length > 0 ? sameAs : undefined,
    };
}

/** Organization on every site; WebSite only once the site has a URL to describe. */
export function getSiteJsonLd(): JsonLdData {
    return {
        "@graph": [
            { "@type": "Organization", ...getOrganizationFields() },
            ...(SITE.url
                ? [{ "@type": "WebSite", name: SITE.name, url: SITE.url }]
                : []),
        ],
    };
}

/** Null until the branch address is filled in (a LocalBusiness without one is not eligible for rich results). */
export function getLocalBusinessJsonLd(): JsonLdData | null {
    if (!SITE.address) return null;

    return {
        "@type": "LocalBusiness",
        ...getOrganizationFields(),
        address: {
            "@type": "PostalAddress",
            streetAddress: SITE.address,
            addressCountry: "VN",
        },
        telephone: SITE.phoneDisplay || undefined,
        hasMap: SITE.mapUrl || undefined,
    };
}

/** No `offers` while prices are hidden, and never `availability` or ratings: the backend has neither. */
export function getProductJsonLd(product: ProductDto): JsonLdData {
    const lowPrice = getMinPrice(product);
    const offerCount = product.variants.reduce(
        (total, variant) => total + variant.priceTiers.length,
        0,
    );

    return {
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        image: product.avatarImageUrl || undefined,
        category: product.categoryName || undefined,
        url: SITE.url ? `${SITE.url}/product/${product.id}` : undefined,
        offers:
            SITE.showPrices && lowPrice !== null
                ? {
                      "@type": "AggregateOffer",
                      priceCurrency: "VND",
                      lowPrice,
                      highPrice: getMaxPrice(product),
                      offerCount,
                  }
                : undefined,
    };
}
