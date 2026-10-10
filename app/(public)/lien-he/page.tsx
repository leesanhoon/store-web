import type { Metadata } from "next";
import Link from "next/link";
import { ChatIcon, PhoneIcon } from "@/components/mobile-store/icons";
import JsonLd, { getLocalBusinessJsonLd } from "@/components/seo/JsonLd";
import {
    CONTACT_DESCRIPTION,
    CONTACT_DETAILS_TITLE,
    CONTACT_LEAD,
    CONTACT_PENDING,
    CONTACT_PENDING_WITH_CHANNELS,
    QUOTE_CTA,
} from "@/lib/content/about";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
    title: "Liên hệ",
    description: CONTACT_DESCRIPTION,
};

type ContactDetail = {
    label: string;
    text: string;
    href?: string;
    /** Liên kết ra ngoài site: mở tab mới. */
    external?: boolean;
};

/** Chỉ giữ trường đã điền trong SITE; điện thoại và Zalo có nút riêng ở đầu trang. */
function getContactDetails(): ContactDetail[] {
    const details: ContactDetail[] = [
        { label: "Email", text: SITE.email, href: `mailto:${SITE.email}` },
        { label: "Địa chỉ", text: SITE.address },
        { label: "Giờ làm việc", text: SITE.hours },
        { label: "Bản đồ", text: SITE.mapUrl && "Xem bản đồ chỉ đường", href: SITE.mapUrl, external: true },
        { label: "Facebook", text: SITE.facebookUrl && "Trang Facebook", href: SITE.facebookUrl, external: true },
        { label: "TikTok", text: SITE.tiktokUrl && "Kênh TikTok", href: SITE.tiktokUrl, external: true },
        { label: "YouTube", text: SITE.youtubeUrl && "Kênh YouTube", href: SITE.youtubeUrl, external: true },
    ];
    return details.filter((detail) => detail.text);
}

export default function ContactPage() {
    const details = getContactDetails();
    const hasChannels = Boolean(SITE.phoneHref || SITE.zaloHref);

    return (
        <>
            {/* First child: content.css keys off the last section being :last-child. */}
            <JsonLd data={getLocalBusinessJsonLd()} />
            <section className="content-section content-hero">
                <div className="site-container">
                    <h1>Liên hệ</h1>
                    <p className="content-lead">{CONTACT_LEAD}</p>
                    {hasChannels ? (
                        <div className="content-actions">
                            {SITE.phoneHref ? (
                                <a href={SITE.phoneHref} className="button-primary">
                                    <PhoneIcon className="h-5 w-5" />
                                    Gọi {SITE.phoneDisplay}
                                </a>
                            ) : null}
                            {SITE.zaloHref ? (
                                <a
                                    href={SITE.zaloHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="button-secondary"
                                >
                                    <ChatIcon className="h-5 w-5" />
                                    Chat Zalo
                                </a>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="content-section">
                <div className="site-container">
                    <div className="mobile-section-heading">
                        <h2>{CONTACT_DETAILS_TITLE}</h2>
                    </div>
                    {details.length > 0 ? (
                        <dl className="content-detail-list">
                            {details.map((detail) => (
                                <div key={detail.label} className="content-detail">
                                    <dt>{detail.label}</dt>
                                    <dd>
                                        {detail.href ? (
                                            <a
                                                href={detail.href}
                                                target={detail.external ? "_blank" : undefined}
                                                rel={detail.external ? "noopener noreferrer" : undefined}
                                            >
                                                {detail.text}
                                            </a>
                                        ) : (
                                            detail.text
                                        )}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    ) : (
                        <p className="mobile-alert">
                            {hasChannels ? CONTACT_PENDING_WITH_CHANNELS : CONTACT_PENDING}
                        </p>
                    )}
                </div>
            </section>

            <section className="content-section">
                <div className="site-container">
                    <div className="content-cta">
                        <div>
                            <h2>{QUOTE_CTA.title}</h2>
                            <p>{QUOTE_CTA.text}</p>
                        </div>
                        <div className="content-actions">
                            <Link href={QUOTE_CTA.href} className="button-primary">
                                {QUOTE_CTA.label}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
