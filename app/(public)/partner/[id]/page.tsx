import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import {
    ChevronRightIcon,
    BoxIcon,
    DropletIcon,
    LayersIcon,
} from "@/components/mobile-store/icons";
import type { PartnerDto } from "@/lib/api/partners";
import { getCatalogPartner } from "@/lib/data/partners";

async function loadPartner(id: string) {
    const partnerId = Number(id);
    if (!Number.isInteger(partnerId) || partnerId === 0) return null;
    return getCatalogPartner(partnerId);
}

function getGalleryImages(partner: PartnerDto) {
    const sorted = [...partner.galleryImages]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((img) => img.imageUrl);
    const sources = partner.avatarImageUrl
        ? [partner.avatarImageUrl, ...sorted]
        : sorted;
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

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
}

export default async function PartnerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const partner = await loadPartner(id);
    if (!partner) notFound();

    const galleryImages = getGalleryImages(partner);
    const phoneHref = partner.phoneNumber
        ? `tel:${partner.phoneNumber.replace(/[^\d+]/g, "")}`
        : null;

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

                {/* Profile Card */}
                <section className="partner-profile-card">
                    <div className="partner-profile-core">
                        <div className="partner-profile-avatar">
                            {partner.avatarImageUrl ? (
                                <Image
                                    src={partner.avatarImageUrl}
                                    alt={partner.name}
                                    width={128}
                                    height={128}
                                    className="partner-profile-avatar-img"
                                />
                            ) : (
                                <span>{getInitials(partner.name)}</span>
                            )}
                        </div>

                        <div className="partner-info">
                            <span className="detail-eyebrow">
                                Đối tác F&B
                            </span>
                            <h2>{partner.name}</h2>
                            {partner.description && (
                                <p className="partner-description">
                                    {partner.description}
                                </p>
                            )}
                        </div>

                        <div className="partner-profile-actions">
                            {phoneHref ? (
                                <Link
                                    href={phoneHref}
                                    className="partner-contact-btn"
                                >
                                    <span>Gọi đối tác</span>
                                </Link>
                            ) : null}
                            <Link
                                href="/products"
                                className="partner-products-btn"
                            >
                                <span>Xem sản phẩm</span>
                                <span className="partner-products-icon">
                                    <ChevronRightIcon className="h-4 w-4" />
                                </span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Info Grid */}
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

                {/* Product Gallery */}
                {galleryImages.length > 0 ? (
                    <section className="partner-gallery-section">
                        <div className="partner-gallery-header">
                            <h3>Sản phẩm đang sử dụng</h3>
                            <span className="partner-gallery-count">
                                {galleryImages.length} ảnh
                            </span>
                        </div>
                        <div className="partner-gallery-grid">
                            {galleryImages.map((src, index) => (
                                <div
                                    key={src}
                                    className={`partner-gallery-item ${index === 0 ? "partner-gallery-item-featured" : ""}`}
                                >
                                    <Image
                                        src={src}
                                        alt={`${partner.name} — sản phẩm ${index + 1}`}
                                        width={600}
                                        height={400}
                                        className="partner-gallery-img"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </MobileAppShell>
    );
}
