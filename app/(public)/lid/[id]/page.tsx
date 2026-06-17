import { connection } from "next/server";
import { notFound } from "next/navigation";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import ProductImageGallery from "@/components/mobile-store/ProductImageGallery";
import LidDetailClient from "@/components/mobile-store/LidDetailClient";
import { getLid, type LidDto } from "@/lib/api/lids";

async function loadLid(id: string): Promise<LidDto | null> {
    const lidId = Number(id);
    if (!Number.isInteger(lidId) || lidId === 0) return null;
    try {
        return await getLid(lidId);
    } catch {
        return null;
    }
}

function getLidGallerySources(lid: LidDto): string[] {
    const sources: string[] = [];
    if (lid.avatarImageUrl) sources.push(lid.avatarImageUrl);
    const gallerySources = [...(lid.galleryImages ?? [])]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((img) => img.imageUrl);
    sources.push(...gallerySources);
    if (sources.length === 0) sources.push("/images/ly/coc-nhua-dung-tau-hu-7.png");
    return [...new Set(sources)];
}

export default async function LidDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await connection();
    const { id } = await params;
    const lid = await loadLid(id);
    if (!lid) notFound();

    const gallerySources = getLidGallerySources(lid);
    const imageSrc = gallerySources[0];

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
                        productName={lid.name}
                        priorityImage
                    />
                </section>

                <section className="detail-product-copy">
                    <span className="detail-eyebrow">{lid.categoryName}</span>
                    <h2>{lid.name}</h2>
                    {lid.description ? (
                        <p className="detail-description">{lid.description}</p>
                    ) : null}
                </section>

                <LidDetailClient lid={lid} imageSrc={imageSrc} />
            </div>
        </MobileAppShell>
    );
}
