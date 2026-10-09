import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import {
    CalendarIcon,
    MapPinIcon,
    PhoneIcon,
} from "@/components/mobile-store/icons";
import type { PartnerDto } from "@/lib/api/partners";
import { getCatalogPartner } from "@/lib/data/partners";
import { SITE } from "@/lib/site";

async function loadPartner(id: string) {
    const partnerId = Number(id);
    if (!Number.isInteger(partnerId) || partnerId === 0) return null;
    return getCatalogPartner(partnerId);
}

// The avatar already sits in the profile card, so it is not repeated in the photo grid.
function getGalleryImages(partner: PartnerDto) {
    const sorted = [...partner.galleryImages]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((img) => img.imageUrl)
        .filter((src) => src !== partner.avatarImageUrl);
    return [...new Set(sorted)];
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
    await connection();
    const { id } = await params;
    const partner = await loadPartner(id);
    if (!partner) notFound();

    const galleryImages = getGalleryImages(partner);

    const infoItems = [
        { label: "Địa chỉ", value: partner.address, icon: MapPinIcon },
        {
            label: "Điện thoại",
            value: partner.phoneNumber ?? "Chưa cập nhật",
            icon: PhoneIcon,
        },
        {
            label: "Tham gia",
            value: formatDate(partner.createdAtUtc),
            icon: CalendarIcon,
        },
    ].filter((item) => item.value);

    return (
        <div className="partner-detail-screen">
            <MobileTopBar
                title="Thông tin đối tác"
                titleAs="p"
                backHref="/"
                backLabel="Quay lại trang chủ"
            />

            <section className="partner-profile-card">
                <div className="partner-profile-avatar">
                    {partner.avatarImageUrl ? (
                        <Image
                            src={partner.avatarImageUrl}
                            alt=""
                            width={128}
                            height={128}
                            className="partner-profile-avatar-img"
                        />
                    ) : (
                        <span aria-hidden="true">
                            {getInitials(partner.name)}
                        </span>
                    )}
                </div>

                <div className="partner-info">
                    <span className="detail-eyebrow">Đối tác F&amp;B</span>
                    <h1>{partner.name}</h1>
                    {partner.description && (
                        <p className="partner-description">
                            {partner.description}
                        </p>
                    )}
                </div>

                <div className="partner-profile-actions">
                    {SITE.zaloHref ? (
                        <a
                            href={SITE.zaloHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button-primary"
                        >
                            Đặt mẫu ly tương tự
                        </a>
                    ) : null}
                    <Link href="/products" className="button-secondary">
                        Xem sản phẩm
                    </Link>
                </div>
            </section>

            <dl className="partner-info-grid">
                {infoItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} className="partner-info-item">
                            <Icon className="h-6 w-6" />
                            <dt>{item.label}</dt>
                            <dd>{item.value}</dd>
                        </div>
                    );
                })}
            </dl>

            {galleryImages.length > 0 ? (
                <section
                    className="partner-gallery-section"
                    aria-labelledby="partner-gallery-title"
                >
                    <div className="partner-gallery-header">
                        <h2 id="partner-gallery-title">
                            Sản phẩm đang sử dụng
                        </h2>
                        <span className="partner-gallery-count">
                            {galleryImages.length} ảnh
                        </span>
                    </div>
                    <ul className="partner-gallery-grid">
                        {galleryImages.map((src, index) => (
                            <li key={src} className="partner-gallery-item">
                                <Image
                                    src={src}
                                    alt={`${partner.name} — sản phẩm ${index + 1}`}
                                    width={800}
                                    height={600}
                                    sizes="(min-width:1024px) 340px, (min-width:768px) 33vw, 50vw"
                                    className="partner-gallery-img"
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </div>
    );
}
