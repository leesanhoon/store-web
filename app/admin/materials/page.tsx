"use client";

import { useEffect, useState } from "react";
import { getMaterials } from "@/lib/api/materials";
import { AdminCard, AdminField, AdminPrimaryButton, AdminSectionHeader, AdminTextArea, AdminStatusBadge } from "@/components/admin/admin-ui";

type MaterialItem = { id: number; name: string; description?: string | null };

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setMaterials(await getMaterials());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kh�ng th? t?i materials.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4 text-[#0b1b3b]">
      <AdminSectionHeader title="Qu?n l� materials" subtitle="Qu?n l� c�c ch?t li?u du?c d�ng trong c?u h�nh s?n ph?m v� b�o gi�." />

      {loading ? <AdminCard className="p-4 text-sm text-slate-500">�ang t?i...</AdminCard> : null}
      {error ? <AdminCard className="border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</AdminCard> : null}
      {message ? <AdminCard className="border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{message}</AdminCard> : null}

      <section className="space-y-3">
        {materials.length === 0 ? <AdminCard className="p-4 text-sm font-medium text-slate-600">Chua c� v?t li?u n�o.</AdminCard> : null}
        {materials.map((item) => (
          <AdminCard key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Material #{item.id}</p>
                <h2 className="mt-1 text-lg font-semibold text-[#0b1b3b]">{item.name}</h2>
              </div>
              <AdminStatusBadge tone="success">Ho?t d?ng</AdminStatusBadge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.description || "Chua c� m� t?"}</p>
          </AdminCard>
        ))}
      </section>

      <AdminCard className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Th�m v?t li?u</p>
        <h2 className="mt-2 text-xl font-semibold text-[#0b1b3b]">T?o material m?i</h2>
        <form className="mt-4 space-y-3">
          <label className="block text-[11px] font-extrabold">T�n v?t li?u <AdminField value={name} onChange={(event) => setName(event.target.value)} placeholder="VD: PET" className="mt-1" /></label>
          <label className="block text-[11px] font-extrabold">M� t? <AdminTextArea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="M� t? ng?n" className="mt-1" /></label>
          <AdminPrimaryButton type="button" onClick={() => setMessage("�� luu material m?u.")}>Th�m material</AdminPrimaryButton>
        </form>
      </AdminCard>
    </div>
  );
}