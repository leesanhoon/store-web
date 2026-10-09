import type { Metadata } from "next";
import { connection } from "next/server";
import GalleryImageCard from "@/components/GalleryImageCard";
import MobileTopBar from "@/components/mobile-store/MobileTopBar";
import { getGalleryItems } from "@/lib/data/gallery";

export const metadata: Metadata = { title: "Mẫu thực tế" };

async function loadGalleryItems() {
    try {
        return { galleryItems: await getGalleryItems(), error: false };
    } catch (error) {
        console.error("Không tải được ảnh mẫu thực tế:", error);
        return { galleryItems: [], error: true };
    }
}

export default async function GalleryPage() {
    await connection();
    const { galleryItems, error } = await loadGalleryItems();

    return (
        <div className="catalog-screen">
            <MobileTopBar title="Mẫu thực tế" />

            <p className="max-w-prose text-body">
                Bộ ảnh thật của sản phẩm, dùng để chốt mẫu, chất liệu và kiểu in
                trước khi sản xuất.
            </p>

            {error ? (
                <p className="mobile-alert">
                    Không tải được ảnh mẫu. Vui lòng thử lại sau ít phút.
                </p>
            ) : null}
            {!error && galleryItems.length === 0 ? (
                <p className="mobile-alert">Chưa có ảnh mẫu nào.</p>
            ) : null}

            <ul className="catalog-grid gallery-grid" aria-label="Danh sách ảnh mẫu thực tế">
                {galleryItems.map((item) => (
                    <li key={item.id}>
                        <GalleryImageCard
                            src={item.imageUrl}
                            label={item.label}
                            description={item.description}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}
