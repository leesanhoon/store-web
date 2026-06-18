"use client";

import Image from "next/image";
import Link from "next/link";
import type { ProductDto } from "@/lib/api/products";
import {
    formatLidPriceRange,
    getCatalogItemImage,
    getLidSizes,
    type CatalogLid,
} from "@/lib/products/catalog-item";

type Props = {
    lid: ProductDto;
    compact?: boolean;
};

export default function LidCard({ lid, compact = false }: Props) {
    const item: CatalogLid = { kind: "lid", data: lid };
    const imageSrc = getCatalogItemImage(item);
    const detailHref = `/product/${lid.id}`;
    const sizes = getLidSizes(lid);

    return (
        <article
            className={
                compact ? "mobile-product-card compact" : "mobile-product-card"
            }
        >
            <Link
                href={detailHref}
                className="mobile-product-image"
                aria-label={lid.name}
            >
                <Image
                    src={imageSrc}
                    alt={lid.name}
                    width={520}
                    height={420}
                    className="h-full w-full object-cover"
                    loading={compact ? "lazy" : "eager"}
                    quality={88}
                />
            </Link>
            <div className="mobile-product-body">
                <h3>{lid.name}</h3>
                <p className="mobile-product-price">
                    {formatLidPriceRange(lid)}
                </p>
                {!compact && sizes ? (
                    <p className="mobile-product-moq">{sizes}</p>
                ) : null}
            </div>
            {/* {!compact ? (
                <Link href={detailHref} className="button-primary w-full text-center block">
                    + Thêm
                </Link>
            ) : null} */}
        </article>
    );
}
