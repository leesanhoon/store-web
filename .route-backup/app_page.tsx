import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { getCatalogProducts } from "@/lib/data/catalog";
import {
    formatCurrency,
    getFeaturedProducts,
    getProductDisplayInfo,
} from "@/lib/products/display";
import { getHomeFeatures } from "@/lib/data/gallery";

async function loadProducts(): Promise<{
    products: Awaited<ReturnType<typeof getCatalogProducts>>;
    error: string;
}> {
    try {
        const products = await getCatalogProducts();
        return { products: getFeaturedProducts(products, 8), error: "" };
    } catch (error) {
        return {
            products: [],
            error:
                error instanceof Error
                    ? error.message
                    : "Không thể tải sản phẩm từ API.",
        };
    }
}

const showcaseCategories = [
    {
        title: "Ly PET",
        description: "Trong, sáng, phù hợp trà trái cây và cold brew.",
        image: "/images/mockups/pet-500-amber.png",
    },
    {
        title: "Ly PP",
        description: "Dày dặn, an toàn cho đồ uống nóng và giao hàng.",
        image: "/images/mockups/pet-700-velvet.png",
    },
    {
        title: "Ly giấy",
        description: "Tinh gọn, sạch mắt, hợp quán cà phê và thương hiệu xanh.",
        image: "/images/mockups/paper-360-linen.png",
    },
    {
        title: "In logo",
        description: "Thiết kế nhận diện, mockup và duyệt mẫu trước in.",
        image: "/images/mockups/logo-cup-500-urban.png",
    },
];

const testimonials = [
    {
        quote: "Mẫu ly lên hình rất đẹp, khách nhìn là nhận ra thương hiệu ngay.",
        name: "Annie Quân",
        role: "Chủ quán cà phê",
    },
    {
        quote: "Đặt số lượng lớn nhưng vẫn giữ được độ sắc nét của logo và màu in.",
        name: "Brands",
        role: "Chuỗi đồ uống",
    },
    {
        quote: "Tư vấn nhanh, chốt mẫu gọn, rất hợp cho team marketing cần ra mắt sớm.",
        name: "Tony John",
        role: "Quản lý vận hành",
    },
];

export default async function Home() {
    const { products, error } = await loadProducts();
    const featureCards = getHomeFeatures();

    return (
        <div className="bg-[#f6f8fb] text-slate-900">
            <section className="page-shell pt-4 sm:pt-6 lg:pt-8">
                <div className="overflow-hidden rounded-[2rem] border border-[#e5ebf2] bg-[#eaf2fa] shadow-[0_24px_70px_-44px_rgba(15,23,42,0.3)]">
                    <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
                        <div className="flex flex-col justify-center gap-6">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex rounded-full bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-600 backdrop-blur">
                                    Kalles-inspired In ly sờ to
                                </span>
                            </div>
                            <div className="space-y-4">
                                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                                    Shop ly mang tinh thần template Kalles,
                                    nhưng dành riêng cho đồ uống của bạn
                                </h1>
                                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                                    Tái sử dụng bố cục thương mại điện tử hiện
                                    đại để bán ly PET, PP, ly giấy và dịch vụ in
                                    logo với trải nghiệm rõ ràng, thoáng và dễ
                                    chuyển đổi.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/products"
                                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Mua ngay
                                </Link>
                                <Link
                                    href="/gallery"
                                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
                                >
                                    Xem mẫu ly
                                </Link>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {[
                                    ["04", "Danh mục chính"],
                                    ["08", "Sản phẩm nổi bật"],
                                    ["24h", "Tư vấn nhanh"],
                                ].map(([value, label]) => (
                                    <div
                                        key={label}
                                        className="rounded-2xl border border-white/70 bg-white/65 p-4 backdrop-blur"
                                    >
                                        <div className="text-2xl font-semibold text-slate-950">
                                            {value}
                                        </div>
                                        <div className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                                            {label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                New collection
                            </div>
                            <div className="overflow-hidden rounded-[1.75rem] bg-white/65 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)]">
                                <div className="grid gap-4 lg:grid-cols-[0.6fr_0.4fr]">
                                    <div className="relative min-h-[340px] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#f7fbff] to-[#e6eef7]">
                                        <Image
                                            src="/images/mockups/hero-cups.png"
                                            alt="Hero cups"
                                            fill
                                            className="object-cover"
                                            priority
                                            sizes="(max-width: 1024px) 100vw, 60vw"
                                        />
                                    </div>
                                    <div className="grid gap-4">
                                        {[
                                            "/images/mockups/pet-500-amber.png",
                                            "/images/mockups/paper-360-linen.png",
                                            "/images/mockups/logo-cup-500-urban.png",
                                        ].map((src) => (
                                            <div
                                                key={src}
                                                className="relative min-h-[100px] overflow-hidden rounded-[1.25rem] bg-white"
                                            >
                                                <Image
                                                    src={src}
                                                    alt="Preview cup"
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 1024px) 100vw, 20vw"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="page-shell mt-10">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                            Latest products
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                            Sản phẩm nổi bật
                        </h2>
                    </div>
                    <Link
                        href="/products"
                        className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                        Xem tất cả sản phẩm →
                    </Link>
                </div>

                {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700">
                        {error}
                    </div>
                ) : null}

                {!error && products.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-600">
                        Chưa có sản phẩm nào từ API.
                    </div>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {products.map((product) => {
                        const info = getProductDisplayInfo(product);

                        return (
                            <article
                                key={product.id}
                                className="overflow-hidden rounded-[1.5rem] border border-[#e5ebf2] bg-white shadow-[0_18px_40px_-34px_rgba(15,23,42,0.22)]"
                            >
                                <Link
                                    href={`/product/${product.id}`}
                                    className="flex aspect-square items-center justify-center bg-gradient-to-b from-[#f8fbff] to-[#eef5fb] text-7xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
                                >
                                    {info.icon}
                                </Link>
                                <div className="space-y-4 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        {product.categoryName || info.cupType}
                                    </p>
                                    <h3 className="min-h-14 text-xl font-semibold tracking-tight text-slate-950">
                                        {product.name}
                                    </h3>
                                    <p className="text-2xl font-semibold text-slate-950">
                                        {formatCurrency(product.price)}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
                                        <span className="rounded-full bg-slate-100 px-3 py-2">
                                            {info.volume}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-2">
                                            {info.unit}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-2">
                                            {info.minimumQuantity}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-2">
                                            {info.printOption}
                                        </span>
                                    </div>
                                    <AddToCartButton
                                        productId={product.id}
                                        name={product.name}
                                        price={product.price}
                                        categoryName={
                                            product.categoryName || info.cupType
                                        }
                                    />
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section className="page-shell mt-10">
                <div className="overflow-hidden rounded-[2rem] border border-[#e5ebf2] bg-[#f6faf7] p-6 sm:p-8">
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                            Our services
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                            Dịch vụ tốt cho shop đồ uống
                        </h2>
                    </div>
                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        {featureCards.slice(0, 2).map((feature) => (
                            <article
                                key={feature.title}
                                className="rounded-[1.5rem] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)]"
                            >
                                <h3 className="text-xl font-semibold text-slate-950">
                                    {feature.title}
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                    {feature.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="page-shell mt-10">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                        Recent projects
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                        Mẫu ly cho mọi thương hiệu
                    </h2>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {showcaseCategories.map((category) => (
                        <article
                            key={category.title}
                            className="group relative overflow-hidden rounded-[1.5rem] bg-slate-900"
                        >
                            <Image
                                src={category.image}
                                alt={category.title}
                                fill
                                className="object-cover opacity-80 transition duration-500 group-hover:scale-105"
                                sizes="(max-width: 1280px) 100vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                            <div className="relative flex h-[22rem] flex-col justify-end p-5 text-white">
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/65">
                                    Category
                                </p>
                                <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                                    {category.title}
                                </h3>
                                <p className="mt-3 max-w-xs text-sm leading-7 text-white/80">
                                    {category.description}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="page-shell mt-10 pb-10">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                        Testimonials
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                        Khách hàng hài lòng
                    </h2>
                </div>
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                    {testimonials.map((item) => (
                        <article
                            key={item.name}
                            className="rounded-[1.5rem] border border-[#e5ebf2] bg-white p-6 text-center shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)]"
                        >
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                                ★
                            </div>
                            <p className="mt-4 text-sm leading-7 text-slate-600">
                                {item.quote}
                            </p>
                            <h3 className="mt-5 text-base font-semibold text-slate-950">
                                {item.name}
                            </h3>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                {item.role}
                            </p>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
