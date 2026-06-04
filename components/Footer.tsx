import Link from "next/link";

export default function Footer() {
  return (
    <footer id="footer" className="mt-16 border-t border-[#e7ddd1] bg-slate-950 text-white">
      <div className="page-shell py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.9fr_.9fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-2">
                <span className="font-display text-xl font-semibold">cup store</span>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/70">A premium showroom experience for PET, PP, and paper cups with clear ordering, printing, and Gmail quote handoff.</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Quick links</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li><Link href="/products">Danh sách sản phẩm</Link></li>
              <li><Link href="/cart">Giỏ hàng</Link></li>
              <li><Link href="/track-order">Tra cứu đơn</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Liên hệ</h4>
            <p className="mt-4 text-sm leading-7 text-white/70">Gửi brief qua Gmail để được báo giá và xác nhận mẫu in nhanh hơn.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
