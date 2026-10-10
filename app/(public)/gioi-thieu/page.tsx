import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "@/components/mobile-store/icons";
import {
    ABOUT_COMMITMENTS,
    ABOUT_COMMITMENTS_TITLE,
    ABOUT_DESCRIPTION,
    ABOUT_LEAD,
    ABOUT_OFFERINGS,
    ABOUT_OFFERINGS_TITLE,
    QUOTE_CTA,
} from "@/lib/content/about";

export const metadata: Metadata = {
    title: "Giới thiệu",
    description: ABOUT_DESCRIPTION,
};

export default function AboutPage() {
    return (
        <>
            <section className="content-section content-hero">
                <div className="site-container content-hero-inner">
                    <div>
                        <h1>Giới thiệu</h1>
                        <p className="content-lead">{ABOUT_LEAD}</p>
                    </div>
                    <Image
                        src="/images/mockups/logo-cup-500-urban.png"
                        alt="Ly giấy có nắp, ảnh minh họa"
                        width={1122}
                        height={1402}
                        sizes="(min-width:1024px) 380px, 320px"
                        className="content-hero-image"
                    />
                </div>
            </section>

            <section className="content-section">
                <div className="site-container">
                    <div className="mobile-section-heading">
                        <h2>{ABOUT_OFFERINGS_TITLE}</h2>
                    </div>
                    <ul className="content-card-grid content-card-grid-four">
                        {ABOUT_OFFERINGS.map((item) => (
                            <li key={item.title} className="content-card">
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="content-section content-band on-dark">
                <div className="site-container">
                    <h2 className="content-band-title">{ABOUT_COMMITMENTS_TITLE}</h2>
                    <ul className="content-card-grid content-card-grid-three">
                        {ABOUT_COMMITMENTS.map((item) => (
                            <li key={item.title} className="content-card">
                                <CheckIcon className="content-card-icon h-6 w-6" />
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </li>
                        ))}
                    </ul>
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
                            <Link href="/lien-he" className="button-secondary">
                                Liên hệ
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
