import Link from "next/link";
import GalleryImageCard from "@/components/GalleryImageCard";
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
                    : "Khong the tai gallery tu API.",
        };
    }
}

export default async function GalleryPage() {
    const { galleryItems, error } = await loadGalleryItems();

    return (
        <div className="surface-gradient">
            <div className="page-shell py-6 sm:py-8">
                <section className="panel-strong p-6 sm:p-8 md:p-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Gallery ly
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold text-header md:text-5xl">
                        Anh that ly nhua va ly giay
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                        Bo anh that cua san pham, dung de chot mau, chat lieu va
                        kieu in truoc khi san xuat.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link href="/products" className="button-primary">
                            Xem san pham
                        </Link>
                        <Link href="/cart" className="button-secondary">
                            Gui yeu cau bao gia
                        </Link>
                    </div>
                </section>

                {error ? (
                    <div className="section-gap panel p-5 text-sm font-medium text-rose-700">
                        {error}
                    </div>
                ) : null}
                {!error && galleryItems.length === 0 ? (
                    <div className="section-gap panel p-8 text-center text-sm font-medium text-slate-600">
                        Chua co anh gallery trong he thong.
                    </div>
                ) : null}

                <section className="section-gap grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {galleryItems.map((item) => (
                        <article key={item.id} className="space-y-4">
                            <GalleryImageCard
                                src={item.imageUrl}
                                label={item.label}
                            />
                            <div className="panel p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    {item.title}
                                </p>
                                <h2 className="mt-2 text-xl font-semibold text-header">
                                    {item.label}
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    {item.description}
                                </p>
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </div>
    );
}
