import type { Metadata } from "next";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import {
    CalendarIcon,
    MapPinIcon,
    PhoneIcon,
} from "@/components/mobile-store/icons";
import type { PartnerDto } from "@/lib/api/partners";
import { getCatalogPartner } from "@/lib/data/partners";
import { SITE } from "@/lib/site";

// cache(): generateMetadata and the page share one backend request.
const loadPartner = cache(async (id: string) => {
    const partnerId = Number(id);
    if (!Number.isInteger(partnerId) || partnerId === 0) return null;
    return getCatalogPartner(partnerId);
});

const META_DESCRIPTION_MAX = 155;

function getMetaDescription(partner: PartnerDto) {
    const text = (partner.description ?? "").replace(/\s+/g, " ").trim();
    if (!text) return `${partner.name} là đối tác F&B của ${SITE.name}.`;
    return text.length > META_DESCRIPTION_MAX
        ? `${text.slice(0, META_DESCRIPTION_MAX - 1).trimEnd()}…`
        : text;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    // A failing API must not break metadata: the page itself still reports the error.
    const partner = await loadPartner(id).catch(() => null);
    if (!partner) return {};

    return {
        title: partner.name,
        description: getMetaDescription(partner),
        alternates: SITE.url
            ? { canonical: `/partner/${partner.id}` }
            : undefined,
        openGraph: {
            images: partner.avatarImageUrl
                ? [partner.avatarImageUrl]
                : undefined,
        },
    };
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
