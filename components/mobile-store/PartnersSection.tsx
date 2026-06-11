import Image from "next/image";
import Link from "next/link";
import type { PartnerDto } from "@/lib/api/partners";

type Props = {
    partners: PartnerDto[];
};

type DisplayPartner = {
    id: number | string;
    name: string;
    subtitle: string;
    avatarUrl: string | null;
    href: string;
};

const DEMO_PARTNERS: DisplayPartner[] = [
    {
        id: "phuc-long",
        name: "Phúc Long",
        subtitle: "Chuỗi cafe & trà",
        avatarUrl: null,
        href: "/products",
    },
    {
        id: "daily-bean",
        name: "Daily Bean",
        subtitle: "Coffee kiosk",
        avatarUrl: null,
        href: "/products",
    },
    {
        id: "milk-lab",
        name: "Milk Lab",
        subtitle: "Trà sữa & dessert",
        avatarUrl: null,
        href: "/products",
    },
    {
        id: "brew-corner",
        name: "Brew Corner",
        subtitle: "Specialty coffee",
        avatarUrl: null,
        href: "/products",
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
    return partners.map((p) => ({
        id: p.id,
        name: p.name,
        subtitle: p.description ?? p.address,
        avatarUrl: p.avatarImageUrl,
        href: `/partner/${p.id}`,
    }));
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

            <div className="partners-scroll" aria-label="Đối tác nổi bật">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className="partner-card"
                    >
                        <div className="partner-avatar-shell">
                            <div className="partner-avatar-core">
                                {item.avatarUrl ? (
                                    <Image
                                        src={item.avatarUrl}
                                        alt={item.name}
                                        width={96}
                                        height={96}
                                        className="partner-avatar-img"
                                    />
                                ) : (
                                    <span className="partner-avatar-initials">
                                        {getInitials(item.name)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className="partner-name">{item.name}</span>
                        <span className="partner-subtitle">{item.subtitle}</span>
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
                    Yêu cầu báo giá
                </Link>
            </div>
        </section>
    );
}
