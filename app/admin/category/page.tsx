"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CategoryDto, getCategories } from "@/lib/api/categories";
import {
  AdminCard,
  AdminField,
  AdminPrimaryButton,
  AdminSectionHeader,
  AdminSelect,
  AdminStatusBadge,
  AdminTextArea,
} from "@/components/admin/admin-ui";

type Banner = {
  id: number;
  title: string;
  description: string;
  image: string;
  visible: boolean;
};

const categoryImages = [
  "/images/mockups/logo-cup-500-urban.png",
  "/images/mockups/paper-360-linen.png",
  "/images/ly/coc-nhua-dung-tau-hu-7.png",
];

function toBanner(category: CategoryDto, index: number): Banner {
  return {
    id: category.id,
    title: category.name,
    description: category.description || "Chua cap nhat mo ta danh muc.",
    image: categoryImages[index % categoryImages.length],
    visible: true,
  };
}

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cta, setCta] = useState("Xem san pham");
  const [status, setStatus] = useState("Hien thi");
  const [order, setOrder] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    void getCategories()
      .then((result) => {
        if (!mounted) return;
        setCategories(result);
        if (result[0]) {
          setTitle(result[0].name);
          setDescription(result[0].description || "Chua cap nhat mo ta danh muc.");
        }
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : "Khong the tai danh muc.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const banners = useMemo(() => categories.map(toBanner), [categories]);

  const save = () => {
    setMessage("Da luu thay doi banner.");
    window.setTimeout(() => setMessage(""), 1800);
  };

  return (
    <div className="space-y-3 text-[#101a36]">
      <AdminSectionHeader title="Cau hinh hien thi" subtitle="Lay danh muc tu backend de tao danh sach banner trang chu." />

      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold">Banner trang chu</h2>
        <AdminPrimaryButton type="button" className="h-9 min-h-9 rounded-[13px] px-3 text-[13px]">
          + Lam moi
        </AdminPrimaryButton>
      </div>

      {loading ? <AdminCard className="p-3 text-[12px] font-semibold text-slate-500">Dang tai danh muc tu API...</AdminCard> : null}
      {loadError ? <AdminCard className="p-3 text-[12px] font-semibold text-rose-700">{loadError}</AdminCard> : null}

      <section className="space-y-2.5">
        {banners.map((banner) => (
          <AdminCard key={banner.id} className="grid grid-cols-[18px_1fr_auto] items-center gap-2.5 p-2.5">
            <span className="text-lg font-bold text-slate-400">=</span>
            <div className="grid grid-cols-[64px_1fr] gap-2.5">
              <Image src={banner.image} alt={banner.title} width={90} height={60} className="h-12 w-16 rounded-xl object-cover" />
              <div className="min-w-0">
                <h2 className="truncate text-[12px] font-extrabold">{banner.title}</h2>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{banner.description}</p>
              </div>
            </div>
            <AdminStatusBadge tone={banner.visible ? "success" : "neutral"}>{banner.visible ? "Hien thi" : "An"}</AdminStatusBadge>
          </AdminCard>
        ))}
        {!loading && !loadError && banners.length === 0 ? (
          <AdminCard className="p-4 text-center text-[12px] font-bold text-slate-500">Chua co danh muc nao tu backend.</AdminCard>
        ) : null}
      </section>

      {message ? <AdminCard className="border-emerald-200 bg-emerald-50 p-3 text-[12px] font-bold text-emerald-700">{message}</AdminCard> : null}

      <AdminCard className="p-3.5">
        <div className="space-y-3">
          <label className="block text-[11px] font-extrabold">
            Tieu de <span className="text-rose-500">*</span>
            <AdminField value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" />
          </label>
          <label className="block text-[11px] font-extrabold">
            Mo ta <span className="text-rose-500">*</span>
            <AdminTextArea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1" />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block text-[11px] font-extrabold">
              CTA
              <AdminSelect value={cta} onChange={(event) => setCta(event.target.value)} className="mt-1">
                <option>Xem san pham</option>
                <option>Yeu cau bao gia</option>
                <option>Lien he ngay</option>
              </AdminSelect>
            </label>
            <label className="block text-[11px] font-extrabold">
              Trang thai
              <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1">
                <option>Hien thi</option>
                <option>An</option>
              </AdminSelect>
            </label>
          </div>
          <div className="grid grid-cols-[1fr_110px] gap-2.5">
            <div>
              <p className="text-[11px] font-extrabold">Hinh anh</p>
              <div className="mt-1 flex items-center gap-2 rounded-2xl border border-[#eadfce] bg-white p-2">
                <Image
                  src={banners[0]?.image ?? categoryImages[0]}
                  alt="Banner preview"
                  width={72}
                  height={54}
                  className="h-12 w-16 rounded-xl object-cover"
                />
                <span className="text-[10px] font-extrabold text-slate-600">Anh preview dang duoc map tam tu category.</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-extrabold">Thu tu</p>
              <div className="mt-1 grid grid-cols-3 overflow-hidden rounded-xl border border-[#eadfce] bg-white text-center">
                <button type="button" onClick={() => setOrder((value) => Math.max(1, value - 1))} className="py-2 text-sm font-bold text-slate-500">-</button>
                <span className="border-x border-[#eadfce] py-2 text-[12px] font-extrabold">{order}</span>
                <button type="button" onClick={() => setOrder((value) => value + 1)} className="py-2 text-sm font-bold text-slate-500">+</button>
              </div>
            </div>
          </div>
          <AdminStatusBadge tone={status === "Hien thi" ? "success" : "neutral"}>{status}</AdminStatusBadge>
          <AdminPrimaryButton type="button" onClick={save} className="w-full">Luu thay doi</AdminPrimaryButton>
        </div>
      </AdminCard>
    </div>
  );
}
