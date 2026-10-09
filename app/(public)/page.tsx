import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import PartnersSection from "@/components/mobile-store/PartnersSection";
import ProductCard from "@/components/mobile-store/ProductCard";
import { CheckIcon, ChevronRightIcon } from "@/components/mobile-store/icons";
import type { CategoryTreeNode } from "@/lib/api/categories";
import { isLidProduct } from "@/lib/api/products";
import { getCatalogCategoryTree, getCatalogProducts } from "@/lib/data/catalog";
import { getCatalogPartners } from "@/lib/data/partners";
import { SITE } from "@/lib/site";

const HERO_POINTS = ["Thiết kế miễn phí", "In nhanh 3-5 ngày", "Giao toàn quốc"];

const PROCESS_STEPS = [
    {
        title: "Chọn mẫu ly",
        text: "Chọn loại ly, dung tích và số lượng trong danh mục sản phẩm.",
    },
    {
        title: "Gửi yêu cầu báo giá",
        text: "Gửi yêu cầu báo giá từ giỏ hàng. Phí in sẽ được báo trong báo giá.",
    },
    {
        title: "Duyệt thiết kế miễn phí",
        text: "Bạn xem và duyệt mẫu logo trên ly trước khi sản xuất.",
    },
    {
        title: "Sản xuất & giao 3-5 ngày",
        text: "In nhanh 3-5 ngày, giao toàn quốc.",
    },
];

async function loadProducts() {
    try {
        return { products: await getCatalogProducts(), error: "" };
    } catch (error) {
        console.error("[home] Không tải được sản phẩm", error);
        return {
            products: [],
            error: "Không tải được sản phẩm. Vui lòng thử lại sau ít phút.",
        };
    }
}

async function loadCategories() {
    const tree = await getCatalogCategoryTree().catch(
        (): CategoryTreeNode[] => [],
    );
    return tree.flatMap((node) => node.children);
}

async function loadPartners() {
    try {
        return await getCatalogPartners();
    } catch {
        return [];
    }
}

export default async function Home() {
    await connection();
    const [{ products, error }, categories, partners] = await Promise.all([
        loadProducts(),
        loadCategories(),
        loadPartners(),
    ]);
    const featured = products.filter((p) => !isLidProduct(p)).slice(0, 8);

    return (
        <div className="home-screen">
            <section className="home-section home-hero">
                <div className="site-container home-hero-inner">
                    <div>
                        <h1>In ly nhựa, ly giấy in logo cho quán của bạn</h1>
                        <p className="home-hero-lead">
                            Ly PET, PP và ly giấy in logo cho quán café, trà
                            sữa. Chọn mẫu ly, gửi yêu cầu và nhận báo giá nhanh.
                        </p>
                        <div className="home-hero-actions">
                            <Link href="/products" className="button-primary">
                                Xem sản phẩm
                            </Link>
                            {SITE.zaloHref ? (
                                <a
                                    href={SITE.zaloHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="button-secondary"
                                >
                                    Nhận báo giá qua Zalo
                                </a>
                            ) : null}
                        </div>
                        <ul className="home-hero-points">
                            {HERO_POINTS.map((point) => (
                                <li key={point}>
                                    <CheckIcon className="h-5 w-5" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Image
                        src="/images/mockups/hero-cups.png"
                        alt="Mẫu ly nhựa và ly giấy in logo"
                        width={1706}
                        height={922}
                        preload
                        sizes="(min-width:1024px) 520px, 100vw"
                        className="home-hero-image"
                    />
                </div>
            </section>

            {categories.length > 0 ? (
                <section className="home-section home-band">
                    <div className="site-container">
                        <div className="mobile-section-heading">
                            <h2>Danh mục sản phẩm</h2>
                        </div>
                        <ul className="home-category-grid">
                            {categories.map((category) => (
                                <li key={category.id}>
                                    <Link
                                        href={`/products?category=${encodeURIComponent(category.name)}`}
                                        className="home-category-tile"
                                    >
                                        <span>{category.name}</span>
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            ) : null}

            <section className="home-section">
                <div className="site-container">
                    <div className="mobile-section-heading">
                        <h2>Sản phẩm nổi bật</h2>
                        <Link href="/products">Xem tất cả</Link>
                    </div>
                    {error || featured.length === 0 ? (
                        <p className="mobile-alert">
                            {error || "Chưa có sản phẩm nào."}
                        </p>
                    ) : (
                        <div className="home-product-grid">
                            {featured.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    priority={index < 4}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="home-section home-band home-process on-dark">
                <div className="site-container">
                    <h2 className="home-process-title">Quy trình đặt in</h2>
                    <ol className="home-process-steps">
                        {PROCESS_STEPS.map((step, index) => (
                            <li key={step.title} className="home-process-step">
                                <span
                                    className="home-process-index"
                                    aria-hidden="true"
                                >
                                    {index + 1}
                                </span>
                                <h3>{step.title}</h3>
                                <p>{step.text}</p>
                            </li>
                        ))}
                    </ol>
                    {SITE.zaloHref ? (
                        <a
                            href={SITE.zaloHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button-on-dark home-process-cta"
                        >
                            Nhận báo giá qua Zalo
                        </a>
                    ) : null}
                </div>
            </section>

            <PartnersSection partners={partners} />
        </div>
    );
}
