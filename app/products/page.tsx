import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { getProducts, ProductDto } from "@/lib/api/products";
import { formatCurrency, getProductDisplayInfo } from "@/lib/products/display";

async function loadProducts(): Promise<{ products: ProductDto[]; error: string }> {
    try {
        return { products: await getProducts(), error: "" };
    } catch (error) {
        return {
            products: [],
            error: error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm.",
        };
    }
}

export default async function ProductsPage() {
    const { products, error } = await loadProducts();

    return (
        <div className="surface-gradient">
            <div className="page-shell py-6 sm:py-8">
                <section className="panel-strong p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Danh mục sản phẩm</p>
                    <h1 className="font-display mt-3 text-3xl font-semibold text-header sm:text-4xl">
                        Ly nhựa, ly giấy và dịch vụ in
                    </h1>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                        Chọn sản phẩm theo dung tích, đơn vị bán và nhu cầu in logo. Giá hiển thị là giá cơ bản từ API, báo giá cuối
                        sẽ phụ thuộc số lượng và quy cách in.
                    </p>
                </section>

                {error ? <div className="section-gap panel border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700">{error}</div> : null}

                {!error && products.length === 0 ? (
                    <div className="section-gap panel p-8 text-center text-sm font-medium text-slate-600">
                        Chưa có sản phẩm trong hệ thống.
                    </div>
                ) : null}

                <section className="section-gap grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => {
                        const info = getProductDisplayInfo(product);

                        return (
                            <article key={product.id} className="panel overflow-hidden p-4">
                                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                                    <Link
                                        href={`/product/${product.id}`}
                                        className="flex aspect-square items-center justify-center rounded-[1.25rem] bg-[#fbfaf7] text-6xl"
                                    >
                                        {info.icon}
                                    </Link>
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                            {product.categoryName || info.cupType}
                                        </p>
                                        <h2 className="font-display text-xl font-semibold text-header">{product.name}</h2>
                                        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</p>
                                        <p className="text-2xl font-semibold text-header">{formatCurrency(product.price)}</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 md:grid-cols-4">
                                    <span className="rounded-full bg-[#fbfaf7] px-3 py-2">{info.cupType}</span>
                                    <span className="rounded-full bg-[#fbfaf7] px-3 py-2">{info.volume}</span>
                                    <span className="rounded-full bg-[#fbfaf7] px-3 py-2">{info.unit}</span>
                                    <span className="rounded-full bg-[#fbfaf7] px-3 py-2">{info.printOption}</span>
                                </div>
                                <div className="mt-4">
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
                </section>
            </div>
        </div>
    );
}
