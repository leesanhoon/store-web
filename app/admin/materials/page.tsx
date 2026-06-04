"use client";

import { useEffect, useState } from "react";
import { getMaterials } from "@/lib/api/materials";

type MaterialItem = { id: number; name: string; description?: string | null };

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setMaterials(await getMaterials());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải materials.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <section className="panel-strong p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Materials</p>
        <h1 className="mt-2 text-3xl font-semibold text-header">Quản lý materials</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Quản lý các chất liệu được dùng trong cấu hình sản phẩm và báo giá.</p>
      </section>

      <section className="panel p-5 sm:p-6">
        {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
        {error ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {materials.map((item) => (
            <article key={item.id} className="rounded-[1.5rem] border border-[#dbe5ef] bg-white p-4 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold text-header">{item.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.description || "Chưa có mô tả"}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
