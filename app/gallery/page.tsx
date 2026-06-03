import Link from "next/link";
import CupMockArt from "@/components/CupMockArt";
import { getGalleryItems } from "@/lib/data/gallery";

export default function GalleryPage() {
    const galleryItems = getGalleryItems();

    return (
        <div className="surface-gradient">
            <div className="page-shell py-6 sm:py-8">
                <section className="panel-strong p-6 sm:p-8 md:p-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Gallery mẫu ly</p>
                    <h1 className="mt-3 text-4xl font-semibold text-header md:text-5xl">Mockup ly nhựa và ly giấy</h1>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                        Bộ mẫu mô phỏng phong cách quán chuỗi cà phê, không dùng logo thương hiệu thật. Bạn có thể dùng đây làm
                        khung để chốt màu, chất liệu và kiểu in trước khi làm sản phẩm thật.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link href="/products" className="button-primary">
                            Xem sản phẩm
                        </Link>
                        <Link href="/cart" className="button-secondary">
                            Gửi yêu cầu báo giá
                        </Link>
                    </div>
                </section>

                <section className="section-gap grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {galleryItems.map((item) => (
                        <article key={item.label} className="space-y-4">
                            <CupMockArt src={item.src} label={item.label} />
                            <div className="panel p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.title}</p>
                                <h2 className="mt-2 text-xl font-semibold text-header">{item.label}</h2>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </div>
    );
}
