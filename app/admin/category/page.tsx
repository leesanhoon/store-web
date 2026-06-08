"use client";

import Image from "next/image";
import { useState } from "react";
import { AdminCard, AdminField, AdminPrimaryButton, AdminSectionHeader, AdminSelect, AdminStatusBadge, AdminTextArea } from "@/components/admin/admin-ui";

type Banner = { id: number; title: string; description: string; image: string; visible: boolean };

const initialBanners: Banner[] = [
  { id: 1, title: "Ly nhựa & in logo", description: "Báo giá nhanh trong 24h", image: "/images/mockups/logo-cup-500-urban.png", visible: true },
  { id: 2, title: "Ly giấy thân thiện", description: "Phù hợp quán cà phê mang đi", image: "/images/mockups/paper-360-linen.png", visible: true },
  { id: 3, title: "Nắp & phụ kiện", description: "Đa dạng lựa chọn theo size ly", image: "/images/ly/coc-nhua-dung-tau-hu-7.png", visible: true },
];

export default function AdminCategoryPage() {
  const [banners, setBanners] = useState(initialBanners);
  const [title, setTitle] = useState("Ly nhựa & in logo");
  const [description, setDescription] = useState("Chọn mẫu ly, gửi logo và nhận báo giá nhanh.");
  const [cta, setCta] = useState("Xem sản phẩm");
  const [status, setStatus] = useState("Hiển thị");
  const [order, setOrder] = useState(1);
  const [message, setMessage] = useState("");

  const toggleVisible = (id: number) => setBanners((current) => current.map((banner) => (banner.id === id ? { ...banner, visible: !banner.visible } : banner)));
  const save = () => {
    setMessage("Đã lưu thay đổi banner.");
    window.setTimeout(() => setMessage(""), 1800);
  };

  return (
    <div className="space-y-3 text-[#0b1b3b]">
      <AdminSectionHeader title="Cấu hình hiển thị" subtitle="Quản lý banner và nội dung hiển thị trên trang chủ." />

      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold">Banner trang chủ</h2>
        <AdminPrimaryButton type="button" className="h-9 min-h-9 rounded-[13px] px-3 text-[13px]">+ Thêm banner</AdminPrimaryButton>
      </div>

      <section className="space-y-2.5">
        {banners.map((banner) => (
          <AdminCard key={banner.id} className="grid grid-cols-[18px_1fr_auto_24px] items-center gap-2.5 p-2.5">
            <span className="text-lg font-bold text-slate-400">=</span>
            <div className="grid grid-cols-[64px_1fr] gap-2.5">
              <Image src={banner.image} alt={banner.title} width={90} height={60} className="h-12 w-16 rounded-xl object-cover" />
              <div className="min-w-0">
                <h2 className="truncate text-[12px] font-extrabold">{banner.title}</h2>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{banner.description}</p>
              </div>
            </div>
            <label className="grid justify-items-center gap-1 text-[9px] font-bold text-slate-500">
              Hiển thị
              <input type="checkbox" checked={banner.visible} onChange={() => toggleVisible(banner.id)} className="peer sr-only" />
              <span className="h-5 w-9 rounded-full bg-slate-200 p-0.5 transition peer-checked:bg-emerald-600">
                <span className={`block h-4 w-4 rounded-full bg-white transition ${banner.visible ? "translate-x-4" : ""}`} />
              </span>
            </label>
            <button type="button" className="text-lg font-extrabold text-slate-500" aria-label="Tùy chọn banner">⋯</button>
          </AdminCard>
        ))}
      </section>

      {message ? <AdminCard className="border-emerald-200 bg-emerald-50 p-3 text-[12px] font-bold text-emerald-700">{message}</AdminCard> : null}

      <AdminCard className="p-3.5">
        <div className="space-y-3">
          <label className="block text-[11px] font-extrabold">Tiêu đề <span className="text-rose-500">*</span><AdminField value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" /></label>
          <label className="block text-[11px] font-extrabold">Mô tả <span className="text-rose-500">*</span><AdminTextArea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1" /></label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block text-[11px] font-extrabold">CTA
              <AdminSelect value={cta} onChange={(event) => setCta(event.target.value)} className="mt-1">
                <option>Xem sản phẩm</option>
                <option>Yêu cầu báo giá</option>
                <option>Liên hệ ngay</option>
              </AdminSelect>
            </label>
            <label className="block text-[11px] font-extrabold">Trạng thái
              <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1">
                <option>Hiển thị</option>
                <option>Ẩn</option>
              </AdminSelect>
            </label>
          </div>
          <div className="grid grid-cols-[1fr_110px] gap-2.5">
            <div>
              <p className="text-[11px] font-extrabold">Hình ảnh <span className="text-rose-500">*</span></p>
              <div className="mt-1 flex items-center gap-2 rounded-2xl border border-[#eadfce] bg-white p-2">
                <Image src="/images/mockups/logo-cup-500-urban.png" alt="Banner preview" width={72} height={54} className="h-12 w-16 rounded-xl object-cover" />
                <button type="button" className="rounded-xl border border-[#eadfce] px-3 py-2 text-[10px] font-extrabold text-slate-600">Đổi ảnh</button>
              </div>
              <p className="mt-1 text-[9px] font-semibold text-slate-500">JPG, PNG tối đa 2MB</p>
            </div>
            <div>
              <p className="text-[11px] font-extrabold">Thứ tự</p>
              <div className="mt-1 grid grid-cols-3 overflow-hidden rounded-xl border border-[#eadfce] bg-white text-center">
                <button type="button" onClick={() => setOrder((value) => Math.max(1, value - 1))} className="py-2 text-sm font-bold text-slate-500">-</button>
                <span className="border-x border-[#eadfce] py-2 text-[12px] font-extrabold">{order}</span>
                <button type="button" onClick={() => setOrder((value) => value + 1)} className="py-2 text-sm font-bold text-slate-500">+</button>
              </div>
            </div>
          </div>
          <AdminStatusBadge tone={status === "Hiển thị" ? "success" : "neutral"}>{status}</AdminStatusBadge>
          <AdminPrimaryButton type="button" onClick={save} className="w-full">Lưu thay đổi</AdminPrimaryButton>
        </div>
      </AdminCard>
    </div>
  );
}
