import Link from "next/link";

const products = [
    {
        id: 1,
        name: "iPhone 15 Pro Max",
        price: 34990000,
        description:
            "iPhone 15 Pro Max với thiết kế titan mới, chip A17 Pro mạnh mẽ và hệ thống camera tiên tiến nhất.",
        image: "📱",
        category: "Điện thoại",
        specs: [
            "Màn hình 6.7 inch",
            "Chip A17 Pro",
            "Camera 48MP",
            "Pin lên đến 29 giờ",
        ],
    },
    {
        id: 2,
        name: "MacBook Pro M3",
        price: 45990000,
        description:
            "Hiệu năng vượt trội với chip M3, thời lượng pin ấn tượng và màn hình Liquid Retina XDR sắc nét.",
        image: "💻",
        category: "Laptop",
        specs: ["Màn hình 14 inch", "Chip M3", "16GB RAM", "512GB SSD"],
    },
    {
        id: 3,
        name: "iPad Pro M2",
        price: 21990000,
        description:
            "Sức mạnh từ chip M2 trong một thiết kế mỏng nhẹ. Trải nghiệm Apple Pencil tuyệt vời.",
        image: "📟",
        category: "Máy tính bảng",
        specs: ["Màn hình 11 inch", "Chip M2", "Camera Ultra Wide", "Face ID"],
    },
];

export default function ProductDetailPage({
    params,
}: {
    params: { id: string };
}) {
    // Find product or default to first one for demo
    const product =
        products.find((p) => p.id.toString() === params.id) || products[0];

    return (
        <div className="container mx-auto px-4 py-12">
            <Link
                href="/"
                className="text-blue-600 hover:underline mb-8 inline-block flex items-center gap-2"
            >
                ← Quay lại trang chủ
            </Link>

            <div className="flex flex-col md:flex-row gap-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-50">
                {/* Product Image */}
                <div className="md:w-1/2 bg-gray-50 rounded-xl flex items-center justify-center text-9xl aspect-square">
                    {product.image}
                </div>

                {/* Product Info */}
                <div className="md:w-1/2">
                    <span className="text-blue-600 font-semibold px-3 py-1 bg-blue-50 rounded-full text-sm">
                        {product.category}
                    </span>
                    <h1 className="text-4xl font-bold mt-4 mb-2 text-gray-900">
                        {product.name}
                    </h1>
                    <p className="text-2xl font-bold text-blue-600 mb-6">
                        {product.price.toLocaleString("vi-VN")} ₫
                    </p>
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                        {product.description}
                    </p>

                    <div className="mb-8">
                        <h3 className="font-bold text-gray-900 mb-4">
                            Thông số kỹ thuật:
                        </h3>
                        <ul className="grid grid-cols-2 gap-3">
                            {product.specs.map((spec, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-2 text-gray-600"
                                >
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    {spec}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-4">
                        <button className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg">
                            Thêm vào giỏ hàng
                        </button>
                        <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6 text-gray-600"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Related Products Placeholder */}
            <div className="mt-16">
                <h2 className="text-2xl font-bold mb-8">Sản phẩm tương tự</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 opacity-50">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-gray-100 h-48 rounded-xl animate-pulse"
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
