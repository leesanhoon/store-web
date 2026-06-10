import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import ProductImageGallery from "@/components/mobile-store/ProductImageGallery";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import ProductActions from "@/components/mobile-store/ProductActions";
import ProductCard from "@/components/mobile-store/ProductCard";
import {
    BoxIcon,
    DropletIcon,
    LayersIcon,
    PencilIcon,
} from "@/components/mobile-store/icons";
import type { ProductDto } from "@/lib/api/products";
import { getCompatibleLids } from "@/lib/api/products";
import { getCatalogProduct, getCatalogProducts } from "@/lib/data/catalog";
import {
    formatCurrency,
    formatPriceRange,
    getMinMoq,
    getMinPrice,
    getProductDisplayInfo,
    getProductImageSrc,
} from "@/lib/products/display";

async function loadProduct(id: string) {
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId === 0) return null;
    return getCatalogProduct(productId);
}

async function loadRelatedProducts(currentProduct: ProductDto) {
    try {
        const products = await getCatalogProducts();
        return products
            .filter((product) => product.id !== currentProduct.id)
            .slice(0, 3);
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

function getProductGallerySources(product: ProductDto, fallbackImageSrc: string) {
    const sources: string[] = [];

    if (product.avatarImageUrl) {
        sources.push(product.avatarImageUrl);
    }

    const gallerySources = [...(product.galleryImages ?? [])]
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((image) => image.imageUrl);

    sources.push(...gallerySources);

    if (sources.length === 0) {
        sources.push(fallbackImageSrc);
    }

    return [...new Set(sources)];
}

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const product = await loadProduct(id);
    if (!product) notFound();

    const info = getProductDisplayInfo(product);
    const imageSrc = getProductImageSrc(product);
    const gallerySources = getProductGallerySources(product, imageSrc);
    const minPrice = getMinPrice(product) ?? 0;
    const minMoq = getMinMoq(product);
    const [relatedProducts, compatibleLids] = await Promise.all([
        loadRelatedProducts(product),
        loadCompatibleLids(product.id),
    ]);

    const specs = [
        { label: "Dung tich", value: info.volume, icon: DropletIcon },
        { label: "Chat lieu", value: info.material, icon: LayersIcon },
        {
            label: "MOQ",
            value: minMoq
                ? new Intl.NumberFormat("vi-VN").format(minMoq)
                : "1.000",
            icon: BoxIcon,
        },
        { label: "In logo", value: "theo yeu cau", icon: PencilIcon },
    ];

    return (
        <MobileAppShell>
            <div className="product-detail-screen">
                <MobileTopBar
                    title="Chi tiet san pham"
                    backHref="/products"
                    backLabel="Quay lai danh muc"
                    rightSlot={
                        <ProductActions
                            productId={product.id}
                            name={product.name}
                        />
                    }
                />

                <section className="detail-hero-image">
                    <ProductImageGallery
                        images={gallerySources}
                        productName={product.name}
                        priorityImage
                    />
                </section>

                <section className="detail-product-copy">
                    <h2>{product.name}</h2>
                    <p className="detail-price">{formatPriceRange(product)}</p>
                    <p className="detail-description">{product.description}</p>
                </section>

                <section
                    className="detail-spec-grid"
                    aria-label="Thong so san pham"
                >
                    {specs.map((spec) => {
                        const Icon = spec.icon;
                        return (
                            <article key={spec.label}>
                                <Icon className="h-6 w-6" />
                                <span>{spec.label}</span>
                                <strong>{spec.value}</strong>
                            </article>
                        );
                    })}
                </section>

                <section className="detail-section">
                    <div className="mobile-section-heading">
                        <h3>Sản phẩm liên quan</h3>
                        <Link href="/products">Xem tất cả</Link>
                    </div>
                    {relatedProducts.length === 0 ? (
                        <p className="mobile-alert">Chưa có sản phẩm nào.</p>
                    ) : (
                        <div className="related-products">
                            {relatedProducts.map((relatedProduct) => (
                                <ProductCard
                                    key={relatedProduct.id}
                                    product={relatedProduct}
                                    compact
                                />
                            ))}
                        </div>
                    )}
                </section>

                <div className="detail-sticky-cta">
                    <AddToCartButton
                        productId={product.id}
                        name={product.name}
                        price={minPrice}
                        categoryName={product.categoryName || info.cupType}
                        variants={product.variants}
                        compatibleLids={compatibleLids}
                        imageSrc={imageSrc}
                        label="Thêm vào giỏ hàng"
                    />
                </div>
            </div>
        </MobileAppShell>
    );
}
