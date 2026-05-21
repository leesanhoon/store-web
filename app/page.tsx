import Link from "next/link";

const products = [
    {
        id: 1,
        name: "Ly Nhựa PET 500ml",
        price: 1500,
        image: "🥤",
        category: "Ly Nhựa",
        badge: "Bán chạy",
    },
    {
        id: 2,
        name: "In Logo Thương Hiệu",
        price: 500,
        image: "🎨",
        category: "Dịch Vụ In",
        badge: "Sáng tạo",
    },
    {
        id: 3,
        name: "Ly Nhựa PP 700ml",
        price: 1800,
        image: "🥤",
        category: "Ly Nhựa",
        badge: "Phổ biến",
    },
    {
        id: 4,
        name: "Thiết Kế Free",
        price: 0,
        image: "✏️",
        category: "Dịch Vụ",
        badge: "Ưu đãi",
    },
];

export default function Home() {
    return (
        <div className="bg-[#F3F4F6] min-h-screen">
            <div className="container mx-auto px-6 py-12">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 md:p-24 mb-24 shadow-layered-lg border border-white/60">
                    {/* Layered Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-accent/5 pointer-events-none"></div>
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="relative z-10 md:w-3/5 text-center md:text-left mx-auto md:mx-0">
                        <span className="inline-block px-4 py-1.5 bg-white/80 text-brand-primary rounded-full text-xs font-black mb-8 uppercase tracking-widest border border-brand-primary/20 shadow-sm backdrop-blur-sm">
                            ✨ Giải pháp bao bì F&B bền vững
                        </span>
                        <h1 className="heading-primary mb-8 leading-tight drop-shadow-sm">
                            Bao bì sạch cho <br />
                            <span className="text-brand-primary">
                                Thương hiệu sạch
                            </span>
                        </h1>
                        <p className="text-header/70 mb-12 max-w-lg font-semibold text-lg leading-relaxed">
                            DTP Packaging cung cấp giải pháp in ấn ly nhựa, ly
                            giấy chất lượng cao, giúp thương hiệu của bạn tỏa
                            sáng tại Quảng Ngãi.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-5 justify-center md:justify-start">
                            <button className="w-full sm:w-auto bg-brand-accent text-white px-12 py-5 rounded-2xl font-black shadow-layered-md hover:bg-brand-accent/90 transition-all transform hover:-translate-y-1.5 active:scale-95">
                                Đặt in ngay
                            </button>
                            <button className="w-full sm:w-auto bg-white/80 backdrop-blur-sm text-header px-12 py-5 rounded-2xl font-black border border-white hover:border-brand-primary/30 hover:bg-white transition-all shadow-layered-sm transform hover:-translate-y-1 active:scale-95">
                                Khám phá mẫu
                            </button>
                        </div>
                    </div>
                    {/* Visual elements */}
                    <div className="hidden lg:block absolute right-24 top-1/2 -translate-y-1/2 text-[20rem] opacity-[0.07] text-header rotate-12 select-none leading-none filter blur-[2px]">
                        📦
                    </div>
                </section>

                {/* Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-32">
                    <div className="bg-white/70 backdrop-blur-sm p-10 rounded-[2rem] shadow-layered-sm border border-white/50 group hover:-translate-y-2 hover:bg-white hover:shadow-layered-md transition-all duration-500">
                        <div className="w-20 h-20 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                            🌱
                        </div>
                        <h3 className="font-black text-2xl text-header mb-4">
                            Nguyên liệu Sạch
                        </h3>
                        <p className="text-header/60 font-semibold leading-relaxed">
                            Sử dụng nhựa nguyên sinh và giấy cao cấp, an toàn
                            tuyệt đối cho sức khỏe người dùng.
                        </p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm p-10 rounded-[2rem] shadow-layered-sm border border-white/50 group hover:-translate-y-2 hover:bg-white hover:shadow-layered-md transition-all duration-500">
                        <div className="w-20 h-20 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                            🖌️
                        </div>
                        <h3 className="font-black text-2xl text-header mb-4">
                            In ấn Sắc nét
                        </h3>
                        <p className="text-header/60 font-semibold leading-relaxed">
                            Công nghệ in hiện đại từ Nhật Bản, đảm bảo màu sắc
                            trung thực và độ bền cao.
                        </p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm p-10 rounded-[2rem] shadow-layered-sm border border-white/50 group hover:-translate-y-2 hover:bg-white hover:shadow-layered-md transition-all duration-500">
                        <div className="w-20 h-20 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                            🤝
                        </div>
                        <h3 className="font-black text-2xl text-header mb-4">
                            Đồng hành Tin cậy
                        </h3>
                        <p className="text-header/60 font-semibold leading-relaxed">
                            Hỗ trợ thiết kế miễn phí và tư vấn chuyên sâu cho
                            hơn 1000+ quán F&B tại Quảng Ngãi.
                        </p>
                    </div>
                </div>

                {/* Product Section */}
                <section className="mb-32">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 px-4">
                        <div className="text-center md:text-left">
                            <h2 className="text-4xl font-black text-header mb-4 tracking-tight">
                                Giải pháp Đóng gói
                            </h2>
                            <div className="h-1.5 w-20 bg-brand-primary rounded-full mb-6 mx-auto md:mx-0"></div>
                            <p className="text-header/60 text-lg font-semibold">
                                Tìm kiếm sản phẩm phù hợp nhất cho quán của bạn.
                            </p>
                        </div>
                        <Link
                            href="/products"
                            className="group flex items-center gap-4 px-6 py-3 bg-white rounded-full shadow-layered-sm border border-gray-100 font-extrabold text-brand-primary hover:text-brand-primary/80 transition-all hover:shadow-layered-md"
                        >
                            Xem tất cả sản phẩm
                            <span className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                                →
                            </span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="group bg-white rounded-[2rem] p-6 shadow-layered-md border border-gray-50/50 hover:border-brand-primary/30 transition-all duration-500 hover:shadow-layered-lg hover:-translate-y-3"
                            >
                                <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center text-8xl mb-8 relative overflow-hidden group-hover:bg-brand-primary/5 transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="group-hover:scale-110 transition-transform duration-700 drop-shadow-2xl select-none z-10">
                                        {product.image}
                                    </span>
                                    {product.badge && (
                                        <div className="absolute top-4 left-4 z-20">
                                            <span className="px-4 py-1.5 bg-white/95 backdrop-blur-sm text-header rounded-xl font-black text-[10px] shadow-layered-sm uppercase border border-gray-100 italic tracking-tighter">
                                                {product.badge}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="px-2">
                                    <span className="text-[11px] font-black text-brand-primary/70 tracking-[0.2em] uppercase mb-3 block">
                                        {product.category}
                                    </span>
                                    <h3 className="text-xl font-black text-header mb-6 group-hover:text-brand-primary transition-colors line-clamp-1">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-black text-header tracking-tight">
                                            {product.price > 0
                                                ? `${product.price.toLocaleString("vi-VN")}đ`
                                                : "Miễn phí"}
                                        </div>
                                        <button
                                            className="w-14 h-14 bg-header text-white rounded-2xl flex items-center justify-center group-hover:bg-brand-primary transition-all shadow-layered-md active:scale-90 hover:rotate-6"
                                            aria-label={`Thêm ${product.name}`}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2.5}
                                                stroke="currentColor"
                                                className="w-6 h-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 4.5v15m7.5-7.5h-15"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Zalo CTA Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-emerald to-brand-forest rounded-[3rem] p-12 md:p-24 text-center shadow-layered-lg mb-24">
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 max-w-3xl mx-auto">
                        <span className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-sm font-black mb-8 uppercase tracking-[0.3em] border border-white/20">
                            Liên hệ ngay
                        </span>
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight drop-shadow-md">
                            Nâng tầm Thương hiệu <br /> ngay hôm nay
                        </h2>
                        <p className="text-white/90 mb-14 text-xl font-semibold max-w-xl mx-auto leading-relaxed">
                            Liên hệ tư vấn thiết kế logo miễn phí và nhận báo
                            giá ưu đãi đặc biệt cho các quán tại Quảng Ngãi.
                        </p>
                        <button className="group relative bg-brand-accent text-white px-20 py-7 rounded-2xl font-black text-2xl shadow-layered-md hover:bg-brand-accent/90 transform hover:scale-105 hover:-translate-y-1 transition-all active:scale-95 overflow-hidden">
                            <span className="relative z-10 flex items-center gap-3">
                                Tư vấn qua Zalo
                                <span className="text-3xl group-hover:rotate-12 transition-transform">👋</span>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                        </button>
                    </div>
                    
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
                        <div
                            className="absolute top-0 left-0 w-full h-full"
                            style={{
                                backgroundImage:
                                    "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                                backgroundSize: "32px 32px",
                            }}
                        ></div>
                    </div>
                </section>
            </div>
        </div>
    );
}
