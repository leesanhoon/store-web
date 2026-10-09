import Image from "next/image";
import Link from "next/link";
import type { PartnerDto } from "@/lib/api/partners";
import { SITE } from "@/lib/site";

type Props = {
    partners: PartnerDto[];
};

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

function toDisplayPartners(partners: PartnerDto[]) {
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
    if (partners.length === 0) return null;

    return (
        <section className="home-section">
            <div className="site-container">
                <div className="mobile-section-heading">
                    <h2>Đối tác tin dùng</h2>
                </div>

                <ul className="partners-grid">
                    {toDisplayPartners(partners).map((item) => (
                        <li key={item.id}>
                            <Link href={item.href} className="partner-tile">
                                <span className="partner-tile-image">
                                    {item.imageUrl ? (
                                        <Image
                                            src={item.imageUrl}
                                            alt=""
                                            width={400}
                                            height={300}
                                            sizes="(min-width:1024px) 260px, (min-width:768px) 25vw, 50vw"
                                        />
                                    ) : (
                                        <span aria-hidden="true">
                                            {getInitials(item.name)}
                                        </span>
                                    )}
                                </span>
                                <span className="partner-tile-body">
                                    <span className="partner-tile-name">
                                        {item.name}
                                    </span>
                                    {item.imageCount > 0 ? (
                                        <span className="partner-tile-meta">
                                            {item.imageCount} ảnh mẫu
                                        </span>
                                    ) : null}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="partners-cta-panel">
                    <div>
                        <h3>Bạn là chủ quán F&amp;B?</h3>
                        <p>
                            Liên hệ để nhận tư vấn mẫu ly, báo giá sỉ và hỗ trợ
                            thiết kế logo miễn phí.
                        </p>
                    </div>
                    {SITE.zaloHref ? (
                        <a
                            href={SITE.zaloHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button-primary"
                        >
                            Đặt mẫu tương tự
                        </a>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
