import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogProduct } from "@/lib/data/catalog";
import { formatCurrency, getProductDisplayInfo } from "@/lib/products/display";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";

async function loadProduct(id: string) {
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
        return null;
    }

    return getCatalogProduct(productId);
}

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const product = await loadProduct(id);

    if (!product) notFound();

    const info = getProductDisplayInfo(product);

    return (
        <div className="surface-gradient">
            <div className="page-shell py-6 sm:py-8">
                <Link href="/products" className="mb-6 inline-flex text-sm font-semibold text-slate-700 hover:text-slate-950">
                    ← Quay lại danh sách sản phẩm
                </Link>

                <section className="grid gap-8 rounded-[1.75rem] border border-[#e5ddd1] bg-white p-6 shadow-[var(--shadow-soft)] lg:grid-cols-[0.92fr_1.08fr] lg:p-8">
                    <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-[#fcfaf7] p-8 text-9xl">
                        {info.icon}
                    </div>

                    <div>
                        <p className="inline-flex rounded-full border border-[#dbcfc0] bg-[#fcfaf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">
                            {product.categoryName || info.cupType}
                        </p>
                        <h1 className="mt-5 text-3xl font-semibold leading-tight text-header sm:text-4xl">{product.name}</h1>
                        <p className="mt-4 text-3xl font-semibold text-header">{formatCurrency(product.price)}</p>
                        <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">{product.description}</p>

                        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {[
                                ["Loại ly", info.cupType],
                                ["Dung tích", info.volume],
                                ["Đơn vị bán", info.unit],
                                ["Số lượng tối thiểu", info.minimumQuantity],
                                ["Tùy chọn in", info.printOption],
                                ["Tồn kho", `${product.stockQuantity.toLocaleString("vi-VN")} sản phẩm`],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-2xl bg-[#fcfaf7] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
                                    <p className="mt-2 font-semibold text-header">{value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link href="/cart" className="button-primary flex-1">
                                Yêu cầu báo giá
                            </Link>
                            <a
                                href="https://zalo.me/"
                                className="button-secondary flex-1 border-[#d8c2aa] bg-[#fff8ef] text-brand-accent hover:border-brand-accent"
                            >
                                Liên hệ Zalo
                            </a>
                        </div>

                        <ProductPurchasePanel
                            productId={product.id}
                            name={product.name}
                            price={product.price}
                            categoryName={product.categoryName || info.cupType}
                        />
                    </div>
                </section>

                <section className="section-gap panel p-6">
                    <h2 className="text-2xl font-semibold text-header">Gợi ý khi đặt in</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {[
                            ["Chuẩn bị logo", "Ưu tiên file vector, PDF hoặc PNG nền trong để bản in sắc nét."],
                            ["Chọn số lượng", "Đơn càng nhiều thì đơn giá càng tốt; đơn in logo nên bắt đầu từ 1.000 ly."],
                            ["Duyệt mẫu", "Luôn kiểm tra mockup trước khi sản xuất để tránh sai màu hoặc sai vị trí in."],
                        ].map(([title, description]) => (
                            <article key={title} className="rounded-2xl bg-[#fcfaf7] p-5">
                                <h3 className="font-semibold text-header">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
