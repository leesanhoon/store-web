import Link from "next/link";
import { notFound } from "next/navigation";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import ProductImageGallery from "@/components/mobile-store/ProductImageGallery";
import ProductCard from "@/components/mobile-store/ProductCard";
import {
    BoxIcon,
    DropletIcon,
    LayersIcon,
} from "@/components/mobile-store/icons";
import type { PartnerDto } from "@/lib/api/partners";
import { getCatalogPartner } from "@/lib/data/partners";
import { getCatalogProducts } from "@/lib/data/catalog";

async function loadPartner(id: string) {
    const partnerId = Number(id);
    if (!Number.isInteger(partnerId) || partnerId === 0) return null;
    return getCatalogPartner(partnerId);
}

async function loadSuggestedProducts() {
    try {
        const products = await getCatalogProducts();
        return products.slice(0, 3);
    } catch {
        return [];
    }
}

function getPartnerGallerySources(partner: PartnerDto) {
    const sources: string[] = [];

    if (partner.avatarImageUrl) {
        sources.push(partner.avatarImageUrl);
    }

    const gallerySources = [...partner.galleryImages]
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((image) => image.imageUrl);

    sources.push(...gallerySources);

    return [...new Set(sources)];
}

function formatDate(isoDate: string) {
    try {
        return new Intl.DateTimeFormat("vi-VN", {
            year: "numeric",
            month: "long",
        }).format(new Date(isoDate));
    } catch {
        return "";
    }
}

export default async function PartnerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const partner = await loadPartner(id);
    if (!partner) notFound();

    const gallerySources = getPartnerGallerySources(partner);
    const suggestedProducts = await loadSuggestedProducts();

    const infoItems = [
        { label: "Địa chỉ", value: partner.address, icon: LayersIcon },
        {
            label: "Điện thoại",
            value: partner.phoneNumber ?? "Chưa cập nhật",
            icon: DropletIcon,
        },
        {
            label: "Tham gia",
            value: formatDate(partner.createdAtUtc),
            icon: BoxIcon,
        },
    ];

    return (
        <MobileAppShell>
            <div className="partner-detail-screen">
                <MobileTopBar
                    title="Thông tin đối tác"
                    backHref="/"
                    backLabel="Quay lại trang chủ"
                />

                {gallerySources.length > 0 && (
                    <section className="detail-hero-image">
                        <ProductImageGallery
                            images={gallerySources}
                            productName={partner.name}
                            priorityImage
                        />
                    </section>
                )}

                <section className="partner-info">
                    <span className="detail-eyebrow">Đối tác</span>
                    <h2>{partner.name}</h2>
                    {partner.description && (
                        <p className="partner-description">
                            {partner.description}
                        </p>
                    )}
                </section>

                <section
                    className="partner-info-grid"
                    aria-label="Thông tin đối tác"
                >
                    {infoItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <article key={item.label}>
                                <Icon className="h-6 w-6" />
                                <span>{item.label}</span>
                                <strong>{item.value}</strong>
                            </article>
                        );
                    })}
                </section>

                <section className="detail-section">
                    <div className="mobile-section-heading">
                        <h3>Sản phẩm gợi ý</h3>
                        <Link href="/products">Xem tất cả</Link>
                    </div>
                    {suggestedProducts.length === 0 ? (
                        <p className="mobile-alert">Chưa có sản phẩm nào.</p>
                    ) : (
                        <div className="related-products">
                            {suggestedProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    compact
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </MobileAppShell>
    );
}
