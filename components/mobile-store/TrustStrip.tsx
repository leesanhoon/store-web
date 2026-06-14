const trustItems = [
    { icon: "🚚", label: "Giao toàn quốc" },
    { icon: "🎨", label: "Thiết kế miễn phí" },
    { icon: "📦", label: "MOQ linh hoạt" },
    { icon: "⚡", label: "In nhanh 3-5 ngày" },
];

export default function TrustStrip() {
    return (
        <section className="trust-strip" aria-label="Cam kết dịch vụ">
            {trustItems.map((item) => (
                <div key={item.label} className="trust-strip-item">
                    <span className="trust-strip-icon" aria-hidden="true">{item.icon}</span>
                    <span className="trust-strip-label">{item.label}</span>
                </div>
            ))}
        </section>
    );
}
