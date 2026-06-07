"use client";

import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import type { ProductDto } from "@/lib/api/products";
import { formatCurrency, getProductDisplayInfo, getProductImageSrc } from "@/lib/products/display";

type Props = {
  product: ProductDto;
  compact?: boolean;
};

export default function ProductCard({ product, compact = false }: Props) {
  const info = getProductDisplayInfo(product);
  const imageSrc = getProductImageSrc(product);
  const detailHref = `/product/${product.id}`;

  return (
    <article className={compact ? "mobile-product-card compact" : "mobile-product-card"}>
      <Link href={detailHref} className="mobile-product-image" aria-label={product.name}>
        <Image
          src={imageSrc}
          alt={product.name}
          width={520}
          height={420}
          className="h-full w-full object-cover"
          loading={compact ? "lazy" : "eager"}
          quality={88}
        />
      </Link>
      <div className="mobile-product-body">
        <h3>{product.name}</h3>
        <p className="mobile-product-price">Từ {formatCurrency(product.price)}</p>
        {!compact ? <p className="mobile-product-moq">MOQ {info.minimumQuantity.replace("Từ ", "")}</p> : null}
      </div>
      {!compact ? (
        <AddToCartButton
          productId={product.id}
          name={product.name}
          price={product.price}
          categoryName={product.categoryName || info.cupType}
          imageSrc={imageSrc}
          label="+ Thêm"
        />
      ) : null}
    </article>
  );
}
