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
        <div className="bg-surface min-h-screen">
            <div className="container mx-auto px-6 py-12">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-brand-light via-white to-brand-sage/20 rounded-3xl p-8 md:p-20 mb-16 shadow-soft border border-brand-emerald/10">
                    <div className="relative z-10 md:w-2/3">
                        <span className="inline-block px-4 py-1 bg-brand-emerald/10 backdrop-blur-md text-brand-forest rounded-full text-sm font-bold mb-6 border border-brand-emerald/20">
                            ✨ Giải pháp bao bì F&B toàn diện
                        </span>
                        <h1 className="heading-primary mb-6 leading-tight">
                            Ly Nhựa{" "}
                            <span className="text-brand-emerald">
                                Chuyên Nghiệp
                            </span>
                            <br />& In Ấn{" "}
                            <span className="text-brand-forest">
                                Thương Hiệu
                            </span>
                        </h1>
                        <p className="text-premium mb-10 max-w-lg font-medium">
                            Nâng tầm thương hiệu đồ uống của bạn với sản phẩm
                            chất lượng cao, thiết kế tinh tế và dịch vụ tận tâm
                            từ DTP.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="bg-brand-forest text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-brand-forest/20 hover:bg-brand-emerald transition-all transform hover:-translate-y-1 focus:ring-4 focus:ring-brand-forest/30">
                                Đặt in ngay
                            </button>
                            <button className="bg-white text-brand-forest px-10 py-4 rounded-2xl font-bold border-2 border-brand-forest/10 hover:border-brand-forest hover:bg-brand-forest/5 transition-all transform hover:-translate-y-1 focus:ring-4 focus:ring-brand-emerald/20">
                                Xem mẫu ly
                            </button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-brand-emerald/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-20 w-64 h-64 bg-brand-sage/20 rounded-full blur-2xl"></div>
                    <div className="hidden md:block absolute right-20 top-1/2 -translate-y-1/2 text-[15rem] opacity-10 text-brand-forest rotate-12 drop-shadow-2xl select-none">
                        🌿
                    </div>
                </section>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    <div className="bg-white p-8 rounded-3xl shadow-soft border border-brand-emerald/5 flex items-center gap-6 group hover:border-brand-emerald/30 transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center text-3xl text-brand-forest group-hover:scale-110 transition-transform shadow-inner">
                            💎
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-brand-forest">
                                Chất Lượng Cao
                            </h3>
                            <p className="text-brand-forest/70 font-medium">
                                Nhựa nguyên sinh, an toàn chuẩn quốc tế.
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-soft border border-brand-emerald/5 flex items-center gap-6 group hover:border-brand-emerald/30 transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center text-3xl text-brand-forest group-hover:scale-110 transition-transform shadow-inner">
                            🎨
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-brand-forest">
                                Thiết Kế Tinh Tế
                            </h3>
                            <p className="text-brand-forest/70 font-medium">
                                In ấn sắc nét, dẫn đầu xu hướng F&B.
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-soft border border-brand-emerald/5 flex items-center gap-6 group hover:border-brand-emerald/30 transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center text-3xl text-brand-forest group-hover:scale-110 transition-transform shadow-inner">
                            ⚡
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-brand-forest">
                                Dịch Vụ Tận Tâm
                            </h3>
                            <p className="text-brand-forest/70 font-medium">
                                Giao hàng siêu tốc, đúng hẹn 100%.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Products */}
                <section className="mb-24">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                        <div>
                            <h2 className="text-4xl font-black text-brand-forest mb-3">
                                Sản phẩm & Dịch vụ
                            </h2>
                            <p className="text-brand-forest/70 text-lg font-medium">
                                Lựa chọn các giải pháp tối ưu cho thương hiệu
                                của bạn.
                            </p>
                        </div>
                        <Link
                            href="/products"
                            className="px-8 py-3 bg-brand-forest text-white rounded-full font-bold shadow-lg shadow-brand-forest/20 hover:bg-brand-emerald transition-all transform hover:scale-105"
                        >
                            Xem tất cả sản phẩm
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="group relative bg-white rounded-3xl p-5 shadow-soft border border-transparent hover:border-brand-emerald/20 transition-all duration-300 overflow-hidden hover:shadow-2xl"
                            >
                                <div className="aspect-[4/5] bg-brand-light/50 rounded-2xl flex items-center justify-center text-8xl mb-6 relative overflow-hidden group-hover:bg-brand-light transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent"></div>
                                    <span className="group-hover:scale-110 transition-transform duration-500 drop-shadow-xl select-none">
                                        {product.image}
                                    </span>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white text-brand-forest rounded-full text-xs font-bold shadow-md border border-brand-forest/5">
                                            {product.badge}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-1">
                                    <span className="text-xs font-bold text-brand-emerald tracking-widest uppercase mb-2 block">
                                        {product.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-brand-forest mb-4 group-hover:text-brand-emerald transition-colors leading-snug">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-black text-brand-forest">
                                            {product.price > 0
                                                ? `${product.price.toLocaleString("vi-VN")}đ`
                                                : "Miễn phí"}
                                        </div>
                                        <button
                                            className="w-12 h-12 bg-brand-forest text-white rounded-2xl flex items-center justify-center group-hover:bg-brand-emerald transition-all shadow-lg shadow-brand-forest/10 hover:shadow-brand-emerald/20 active:scale-95"
                                            aria-label={`Thêm ${product.name} vào giỏ hàng`}
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

                {/* CTA Section */}
                <section className="bg-brand-forest rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                            Sẵn sàng nâng tầm{" "}
                            <span className="text-brand-sage">
                                thương hiệu?
                            </span>
                        </h2>
                        <p className="text-brand-light/80 mb-10 text-lg font-medium">
                            Đội ngũ DTP sẵn sàng đồng hành cùng bạn tạo ra những
                            sản phẩm bao bì ấn tượng, chuyên nghiệp và dẫn đầu
                            thị trường.
                        </p>
                        <button className="bg-brand-sage text-brand-forest px-12 py-5 rounded-3xl font-black text-lg shadow-xl shadow-brand-forest/10 hover:bg-white hover:scale-105 transition-all focus:ring-4 focus:ring-white/30">
                            Tư vấn qua Zalo 💬
                        </button>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none select-none">
                        <div className="absolute -top-10 -left-10 text-[10rem] text-white/50">
                            🌿
                        </div>
                        <div className="absolute -bottom-10 -right-10 text-[10rem] text-white/50">
                            🍃
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem] blur-[100px] bg-brand-emerald/20 rounded-full w-[500px] h-[500px]"></div>
                    </div>
                </section>
            </div>
        </div>
    );
}
