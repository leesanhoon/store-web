import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { getProducts, ProductDto } from "@/lib/api/products";
import { formatCurrency, getFeaturedProducts, getProductDisplayInfo } from "@/lib/products/display";

async function loadProducts(): Promise<{ products: ProductDto[]; error: string }> {
    try {
        const products = await getProducts();
        return { products: getFeaturedProducts(products), error: "" };
    } catch (error) {
        return {
            products: [],
            error: error instanceof Error ? error.message : "Không thể tải sản phẩm từ API.",
        };
    }
}

const featureCards = [
    ["Nguyên liệu an toàn", "Ly nhựa nguyên sinh và giấy thực phẩm phù hợp đồ uống mang đi."],
    ["In ấn sắc nét", "Tư vấn quy cách in logo, màu in và số lượng phù hợp ngân sách."],
    ["Bán theo cây/thùng", "Hỗ trợ đặt số lượng nhỏ để dùng thử và số lượng lớn cho chuỗi quán."],
];

export default async function Home() {
    const { products, error } = await loadProducts();

    return (
        <div className="surface-gradient">
            <section className="page-shell pt-6 sm:pt-8">
                <div className="panel-strong overflow-hidden">
                    <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:p-12">
                        <div className="space-y-6">
                            <span className="inline-flex rounded-full border border-[#ddd6cb] bg-[#fbfaf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">
                                DTP Packaging
                            </span>
                            <div className="space-y-4">
                                <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight text-header sm:text-5xl lg:text-6xl">
                                    Ly nhựa, ly giấy và in logo cho quán F&B
                                </h1>
                                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                                    Cung cấp ly PET, PP, ly giấy và dịch vụ in thương hiệu theo số lượng. Tư vấn chọn mẫu, báo giá
                                    nhanh và hỗ trợ thiết kế cho quán cà phê, trà sữa, nước ép.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link href="/products" className="button-primary">
                                    Xem sản phẩm
                                </Link>
                                <Link href="/cart" className="button-secondary">
                                    Yêu cầu báo giá
                                </Link>
                                <Link href="/gallery" className="button-secondary bg-[#fbfaf7]">
                                    Xem gallery mẫu
                                </Link>
                            </div>
                        </div>

                        <div className="panel overflow-hidden p-4">
                            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#fbfaf7]">
                                <Image
                                    src="/images/mockups/hero-cups.png"
                                    alt="Bộ mockup ly nhựa và ly giấy"
                                    fill
                                    priority
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 46vw"
                                />
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {["PET 500ml", "PP 700ml", "Ly giấy", "In logo"].map((item, index) => (
                                    <div
                                        key={item}
                                        className={`rounded-2xl border p-4 ${
                                            index === 0 ? "border-[#ddd6cb] bg-[#fbfaf7]" : "border-[#e6e0d8] bg-white"
                                        }`}
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                            {index < 2 ? "Cup" : "Service"}
                                        </p>
                                        <p className="font-display mt-2 text-lg font-semibold text-header">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="page-shell section-gap grid gap-4 md:grid-cols-3">
                {featureCards.map(([title, description]) => (
                    <article key={title} className="panel p-5 sm:p-6">
                        <h2 className="font-display text-xl font-semibold text-header">{title}</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                    </article>
                ))}
            </section>

            <section className="page-shell section-gap">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="font-display text-3xl font-semibold text-header">Sản phẩm nổi bật</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                            Dữ liệu được tải trực tiếp từ API sản phẩm .NET Core.
                        </p>
                    </div>
                    <Link href="/products" className="text-sm font-semibold text-slate-900 transition hover:text-brand-accent">
                        Xem tất cả sản phẩm →
                    </Link>
                </div>

                {error ? <div className="panel border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700">{error}</div> : null}

                {!error && products.length === 0 ? (
                    <div className="panel p-8 text-center text-sm font-medium text-slate-600">
                        Chưa có sản phẩm để hiển thị.
                    </div>
                ) : null}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {products.map((product) => {
                        const info = getProductDisplayInfo(product);

                        return (
                            <article key={product.id} className="panel overflow-hidden p-4">
                                <Link
                                    href={`/product/${product.id}`}
                                    className="flex aspect-square items-center justify-center rounded-[1.25rem] bg-[#fbfaf7] text-7xl"
                                >
                                    {info.icon}
                                </Link>
                                <div className="space-y-4 p-1 pt-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        {product.categoryName || info.cupType}
                                    </p>
                                    <h3 className="font-display line-clamp-2 min-h-14 text-xl font-semibold leading-tight text-header">
                                        {product.name}
                                    </h3>
                                    <p className="text-2xl font-semibold text-header">{formatCurrency(product.price)}</p>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
                                        <span className="rounded-full bg-[#fbfaf7] px-3 py-2">{info.volume}</span>
                                        <span className="rounded-full bg-[#fbfaf7] px-3 py-2">{info.unit}</span>
                                        <span className="rounded-full bg-[#fbfaf7] px-3 py-2">{info.minimumQuantity}</span>
                                        <span className="rounded-full bg-[#fbfaf7] px-3 py-2">{info.printOption}</span>
                                    </div>
                                    <AddToCartButton
                                        productId={product.id}
                                        name={product.name}
                                        price={product.price}
                                        categoryName={product.categoryName || info.cupType}
                                    />
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
