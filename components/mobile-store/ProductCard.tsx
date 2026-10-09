import Image from "next/image";
import Link from "next/link";
import { isLidProduct, type ProductDto } from "@/lib/api/products";
import { getCatalogItemImage, getLidSizes } from "@/lib/products/catalog-item";
import {
    formatCurrency,
    getMinMoq,
    getMinPrice,
    getProductImageSrc,
} from "@/lib/products/display";

type Props = {
    product: ProductDto;
    compact?: boolean;
    /** Above-the-fold cards: preload the image instead of lazy loading it. */
    priority?: boolean;
};

export default function ProductCard({
    product,
    compact = false,
    priority = false,
}: Props) {
    const isLid = isLidProduct(product);
    const imageSrc = isLid
        ? getCatalogItemImage({ kind: "lid", data: product })
        : getProductImageSrc(product);
    const minPrice = getMinPrice(product);
    const minMoq = getMinMoq(product);
    const detail = isLid
        ? getLidSizes(product)
        : minMoq
          ? `Tối thiểu ${minMoq.toLocaleString("vi-VN")} ly`
          : "";

    return (
        <Link
            href={`/product/${product.id}`}
            className={
                compact ? "mobile-product-card compact" : "mobile-product-card"
            }
        >
            <div className="mobile-product-image">
                <Image
                    src={imageSrc}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 260px, (min-width:768px) 33vw, 50vw"
                    preload={priority}
                    className="object-cover"
                />
            </div>
            <div className="mobile-product-body">
                <h3>{product.name}</h3>
                <p className="mobile-product-price">
                    {minPrice === null ? (
                        "Liên hệ"
                    ) : (
                        <>
                            Từ {formatCurrency(minPrice)}{" "}
                            <span>/{isLid ? "nắp" : "ly"}</span>
                        </>
                    )}
                </p>
                {!compact && detail ? (
                    <p className="mobile-product-moq">{detail}</p>
                ) : null}
            </div>
        </Link>
    );
}
