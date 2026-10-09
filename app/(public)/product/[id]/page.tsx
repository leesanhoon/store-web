import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImageGallery from "@/components/mobile-store/ProductImageGallery";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import ProductActions from "@/components/mobile-store/ProductActions";
import ProductCard from "@/components/mobile-store/ProductCard";
import { ChatIcon, CheckIcon } from "@/components/mobile-store/icons";
import LidDetailClient from "@/components/mobile-store/LidDetailClient";
import type { ProductDto, ProductVariantDto } from "@/lib/api/products";
import { getCompatibleLids, isLidProduct } from "@/lib/api/products";
import { getCatalogProduct, getCatalogProducts } from "@/lib/data/catalog";
import {
    formatCurrency,
    formatPriceRange,
    getMinMoq,
    getMinPrice,
    getProductDisplayInfo,
    getProductImageSrc,
    getVariantLabel,
} from "@/lib/products/display";
import { SITE } from "@/lib/site";

async function loadProduct(id: string) {
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId === 0) return null;
    return getCatalogProduct(productId);
}

async function loadRelatedProducts(currentProduct: ProductDto) {
    try {
        const products = await getCatalogProducts();
        return products
            .filter(
                (product) =>
                    product.id !== currentProduct.id &&
                    !isLidProduct(product) &&
                    product.categoryId === currentProduct.categoryId,
            )
            .slice(0, 4);
    } catch {
        return [];
    }
}

async function loadCompatibleLids(productId: number) {
    try {
        return await getCompatibleLids(productId);
    } catch {
        return [];
    }
}

function getProductGallerySources(
    product: ProductDto,
    fallbackImageSrc: string,
) {
    const sources: string[] = [];

    if (product.avatarImageUrl) {
        sources.push(product.avatarImageUrl);
    }

    const gallerySources = [...(product.galleryImages ?? [])]
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((image) => image.imageUrl);

    sources.push(...gallerySources);

    const uniqueSources = [...new Set(sources)];
    return uniqueSources.length > 0 ? uniqueSources : [fallbackImageSrc];
}

/** One collapsible price table per variant: a product can have 5+ sizes with 5 tiers each. */
function PriceTierTable({
    variant,
    open,
}: {
    variant: ProductVariantDto;
    open: boolean;
}) {
    const minPrice = getMinPrice({ variants: [variant] });
    const tiers = [...variant.priceTiers].sort(
        (a, b) => a.minQuantity - b.minQuantity,
    );

    return (
        <details className="detail-tier-wrap" open={open}>
            <summary>
                <span>{getVariantLabel(variant)}</span>
                {minPrice !== null ? (
                    <span>Từ {formatCurrency(minPrice)}</span>
                ) : null}
            </summary>
            <table className="detail-tier-table">
                <caption className="sr-only">{getVariantLabel(variant)}</caption>
                <thead>
                    <tr>
                        <th scope="col">Số lượng</th>
                        <th scope="col">Đơn giá</th>
                    </tr>
                </thead>
                <tbody>
                    {tiers.map((tier) => (
                        <tr key={tier.id}>
                            <th scope="row">
                                Từ {tier.minQuantity.toLocaleString("vi-VN")} ly
                            </th>
                            <td>
                                {formatCurrency(tier.unitPrice)}
                                <span> /ly</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </details>
    );
}

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await connection();
    const { id } = await params;
    const product = await loadProduct(id);
    if (!product) notFound();

    const isLid = isLidProduct(product);
    const info = getProductDisplayInfo(product);
    const imageSrc = getProductImageSrc(product);
    const gallerySources = getProductGallerySources(product, imageSrc);
    const minPrice = getMinPrice(product);
    const minMoq = getMinMoq(product);
    const backHref = product.categoryName
        ? `/products?category=${encodeURIComponent(product.categoryName)}`
        : "/products";
    const pricedVariants = product.variants.filter(
        (variant) => variant.priceTiers.length > 0,
    );

    const [relatedProducts, compatibleLids] = await Promise.all([
        isLid ? Promise.resolve([]) : loadRelatedProducts(product),
        isLid ? Promise.resolve([]) : loadCompatibleLids(product.id),
    ]);

    return (
        <div className="product-detail-screen">
            <MobileTopBar
                title="Sản phẩm"
                titleAs="p"
                backHref={backHref}
                backLabel="Quay lại danh sách sản phẩm"
                rightSlot={
                    isLid ? undefined : <ProductActions name={product.name} />
                }
            />

            <div className="detail-layout">
                <div className="detail-media">
                    <ProductImageGallery
                        images={gallerySources}
                        productName={product.name}
                        priorityImage
                    />
                </div>

                <div className="detail-info">
                    <div className="detail-product-copy">
                        {product.categoryName ? (
                            <span className="detail-eyebrow">
                                {product.categoryName}
                            </span>
                        ) : null}
                        <h1>{product.name}</h1>
                        {isLid ? null : (
                            <>
                                <p className="detail-price">
                                    {formatPriceRange(product)}
                                    {minPrice !== null ? (
                                        <span> /ly</span>
                                    ) : null}
                                </p>
                                {minMoq ? (
                                    <p className="detail-moq">
                                        Tối thiểu{" "}
                                        {minMoq.toLocaleString("vi-VN")} ly
                                    </p>
                                ) : null}
                            </>
                        )}
                    </div>

                    {isLid ? (
                        <>
                            {product.description ? (
                                <p className="detail-description">
                                    {product.description}
                                </p>
                            ) : null}
                            <LidDetailClient
                                product={product}
                                imageSrc={imageSrc}
                            />
                        </>
                    ) : (
                        <>
                            {/* Early in the DOM so the buy action stays above the fold on desktop; fixed to the bottom on mobile. */}
                            <div className="detail-sticky-cta">
                                <AddToCartButton
                                    productId={product.id}
                                    name={product.name}
                                    price={minPrice ?? 0}
                                    categoryName={
                                        product.categoryName || info.cupType
                                    }
                                    variants={product.variants}
                                    compatibleLids={compatibleLids}
                                    imageSrc={imageSrc}
                                    label="Thêm vào giỏ"
                                />
                                {SITE.zaloHref ? (
                                    <a
                                        href={SITE.zaloHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="button-secondary"
                                    >
                                        <ChatIcon className="h-5 w-5" />
                                        Hỏi qua Zalo
                                    </a>
                                ) : null}
                            </div>

                            {product.description ? (
                                <p className="detail-description">
                                    {product.description}
                                </p>
                            ) : null}

                            {product.variants.length > 0 ? (
                                <div className="detail-section">
                                    <h2 className="detail-subheading">
                                        Dung tích
                                    </h2>
                                    <ul className="detail-chips">
                                        {product.variants.map((variant) => (
                                            <li key={variant.id}>
                                                {getVariantLabel(variant)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            {pricedVariants.length > 0 ? (
                                <div className="detail-section">
                                    <h2 className="detail-subheading">
                                        Bảng giá theo số lượng
                                    </h2>
                                    {pricedVariants.map((variant, index) => (
                                        <PriceTierTable
                                            key={variant.id}
                                            variant={variant}
                                            open={index === 0}
                                        />
                                    ))}
                                </div>
                            ) : null}

                            {compatibleLids.length > 0 ? (
                                <div className="detail-section">
                                    <h2 className="detail-subheading">
                                        Nắp ly tương thích
                                    </h2>
                                    <ul className="detail-lid-list">
                                        {compatibleLids.map((lid) => (
                                            <li key={lid.id}>
                                                <CheckIcon className="h-4 w-4" />
                                                {lid.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            </div>

            {relatedProducts.length > 0 ? (
                <section className="detail-section">
                    <div className="mobile-section-heading">
                        <h2>Sản phẩm liên quan</h2>
                        <Link href={backHref}>Xem tất cả</Link>
                    </div>
                    <div className="related-products">
                        {relatedProducts.map((relatedProduct) => (
                            <ProductCard
                                key={relatedProduct.id}
                                product={relatedProduct}
                                compact
                            />
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
