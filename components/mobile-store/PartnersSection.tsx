import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/mobile-store/icons";
import type { PartnerDto } from "@/lib/api/partners";

type Props = {
    partners: PartnerDto[];
};

type DisplayPartner = {
    id: number | string;
    name: string;
    imageUrl: string | null;
    href: string;
    imageCount: number;
};

const DEMO_PARTNERS: DisplayPartner[] = [
    {
        id: "phuc-long",
        name: "Phúc Long",
        imageUrl: null,
        href: "/products",
        imageCount: 0,
    },
    {
        id: "daily-bean",
        name: "Daily Bean",
        imageUrl: null,
        href: "/products",
        imageCount: 0,
    },
    {
        id: "milk-lab",
        name: "Milk Lab",
        imageUrl: null,
        href: "/products",
        imageCount: 0,
    },
    {
        id: "brew-corner",
        name: "Brew Corner",
        imageUrl: null,
        href: "/products",
        imageCount: 0,
    },
];

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

function toDisplayPartners(partners: PartnerDto[]): DisplayPartner[] {
    return partners.map((p) => {
        const firstGallery =
            p.galleryImages.length > 0
                ? [...p.galleryImages].sort(
                      (a, b) => a.displayOrder - b.displayOrder,
                  )[0].imageUrl
                : null;
        return {
            id: p.id,
            name: p.name,
            imageUrl: firstGallery ?? p.avatarImageUrl,
            href: `/partner/${p.id}`,
            imageCount: p.galleryImages.length,
        };
    });
}

export default function PartnersSection({ partners }: Props) {
    const items =
        partners.length > 0 ? toDisplayPartners(partners) : DEMO_PARTNERS;

    return (
        <section className="mobile-section">
            <div className="mobile-section-heading">
                <h2>Đối tác tin dùng</h2>
                <Link href="/products">Xem sản phẩm</Link>
            </div>

            <div className="partners-grid" aria-label="Đối tác nổi bật">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className="partner-tile"
                    >
                        <div className="partner-tile-shell">
                            <div className="partner-tile-image">
                                {item.imageUrl ? (
                                    <Image
                                        src={item.imageUrl}
                                        alt={`Sản phẩm ${item.name}`}
                                        width={400}
                                        height={300}
                                        className="partner-tile-img"
                                    />
                                ) : (
                                    <div className="partner-tile-placeholder">
                                        <span>{getInitials(item.name)}</span>
                                    </div>
                                )}
                                {item.imageCount > 0 ? (
                                    <span className="partner-tile-badge">
                                        {item.imageCount} ảnh
                                    </span>
                                ) : null}
                            </div>
                            <div className="partner-tile-footer">
                                <span className="partner-tile-name">
                                    {item.name}
                                </span>
                                <span className="partner-tile-arrow">
                                    <ChevronRightIcon className="h-3.5 w-3.5" />
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="partners-cta-panel">
                <div className="partners-cta-copy">
                    <strong>Bạn là chủ quán F&B?</strong>
                    <p>
                        Liên hệ để nhận tư vấn mẫu ly, báo giá sỉ và hỗ trợ
                        thiết kế logo miễn phí.
                    </p>
                </div>
                <Link href="/products" className="partners-cta-btn">
                    <span>Yêu cầu báo giá</span>
                    <span className="partners-cta-icon">
                        <ChevronRightIcon className="h-4 w-4" />
                    </span>
                </Link>
            </div>
        </section>
    );
}
