import { connection } from "next/server";
import GalleryImageCard from "@/components/GalleryImageCard";
import MobileAppShell from "@/components/mobile-store/MobileAppShell";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import { getGalleryItems } from "@/lib/data/gallery";

async function loadGalleryItems() {
    try {
        return { galleryItems: await getGalleryItems(), error: "" };
    } catch (error) {
        return {
            galleryItems: [],
            error:
                error instanceof Error
                    ? error.message
                    : "Không thể tải gallery từ API.",
        };
    }
}

export default async function GalleryPage() {
    await connection();
    const { galleryItems, error } = await loadGalleryItems();

    return (
        <MobileAppShell>
            <div className="catalog-screen">
                <MobileTopBar title="Gallery ảnh thật" backHref="/" backLabel="Quay lại trang chủ" />

                <p className="text-sm leading-6 text-slate-600">
                    Bộ ảnh thật của sản phẩm, dùng để chốt mẫu, chất liệu và kiểu in
                    trước khi sản xuất.
                </p>

                {error ? <p className="mobile-alert">{error}</p> : null}
                {!error && galleryItems.length === 0 ? (
                    <p className="mobile-alert">
                        Chưa có ảnh gallery trong hệ thống.
                    </p>
                ) : null}

                <section className="catalog-grid" aria-label="Danh sách ảnh gallery">
                    {galleryItems.map((item) => (
                        <article key={item.id} className="space-y-2">
                            <GalleryImageCard src={item.imageUrl} label={item.label} />
                            <p className="px-1 text-xs leading-5 text-slate-500">
                                {item.description}
                            </p>
                        </article>
                    ))}
                </section>
            </div>
        </MobileAppShell>
    );
}
