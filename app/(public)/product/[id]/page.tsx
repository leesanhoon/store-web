import { connection } from "next/server";
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
import LidDetailClient from "@/components/mobile-store/LidDetailClient";
import type { ProductDto } from "@/lib/api/products";
import { getCompatibleLids, isLidProduct } from "@/lib/api/products";
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

const MOCKUP_GALLERY: Record<string, string[]> = {
    pet: [
        "/images/mockups/pet-500-amber.png",
        "/images/mockups/pet-700-velvet.png",
        "/images/mockups/logo-cup-500-urban.png",
    ],
    paper: [
        "/images/mockups/paper-360-linen.png",
        "/images/mockups/logo-cup-500-urban.png",
        "/images/mockups/hero-cups.png",
    ],
    default: [
        "/images/mockups/hero-cups.png",
        "/images/mockups/paper-360-linen.png",
        "/images/mockups/pet-500-amber.png",
    ],
};

function getMockupGallery(product: ProductDto) {
    const text = `${product.name} ${product.categoryName ?? ""}`.toLowerCase();
    if (text.includes("pet")) return MOCKUP_GALLERY.pet;
    if (text.includes("giấy") || text.includes("paper"))
        return MOCKUP_GALLERY.paper;
    return MOCKUP_GALLERY.default;
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

    // if (sources.length <= 1) {
    //     const primary = sources[0] ?? fallbackImageSrc;
    //     const mockups = getMockupGallery(product).filter(
    //         (src) => src !== primary,
    //     );
    //     sources.length = 0;
    //     sources.push(primary, ...mockups);
    // }

    return [...new Set(sources)];
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
    const minPrice = getMinPrice(product) ?? 0;
    const minMoq = getMinMoq(product);

    const [relatedProducts, compatibleLids] = await Promise.all([
        loadRelatedProducts(product),
        isLid ? Promise.resolve([]) : loadCompatibleLids(product.id),
    ]);

    if (isLid) {
        return (
            <MobileAppShell>
                <div className="product-detail-screen">
                    <MobileTopBar
                        title="Chi tiết nắp ly"
                        backHref="/products?category=Nắp ly"
                        backLabel="Quay lại danh mục"
                    />

                    <section className="detail-hero-image">
                        <ProductImageGallery
                            images={gallerySources}
                            productName={product.name}
                            priorityImage
                        />
                    </section>

                    <section className="detail-product-copy">
                        <span className="detail-eyebrow">{product.categoryName}</span>
                        <h2>{product.name}</h2>
                        {product.description ? (
                            <p className="detail-description">{product.description}</p>
                        ) : null}
                    </section>

                    <LidDetailClient product={product} imageSrc={imageSrc} />
                </div>
            </MobileAppShell>
        );
    }

    const specs = [
        { label: "Dung tích", value: info.volume, icon: DropletIcon },
        { label: "Chất liệu", value: info.material, icon: LayersIcon },
        {
            label: "Đặt tối thiểu",
            value: minMoq
                ? `${new Intl.NumberFormat("vi-VN").format(minMoq)} ly`
                : "1.000 ly",
            icon: BoxIcon,
        },
        { label: "In logo", value: "theo yêu cầu", icon: PencilIcon },
    ];

    return (
        <MobileAppShell>
            <div className="product-detail-screen">
                <MobileTopBar
                    title="Chi tiết sản phẩm"
                    backHref="/products"
                    backLabel="Quay lại danh mục"
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
                    <span className="detail-eyebrow">
                        {product.categoryName}
                    </span>
                    <h2>{product.name}</h2>
                    <p className="detail-price">{formatPriceRange(product)}</p>
                    {product.description ? (
                        <p className="detail-description">
                            {product.description}
                        </p>
                    ) : null}
                </section>

                <section
                    className="detail-spec-grid"
                    aria-label="Thông số sản phẩm"
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
