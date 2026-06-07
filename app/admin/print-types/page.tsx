"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPrintType, getPrintTypes, type PrintTypeDto } from "@/lib/api/print-types";
import { AdminCard, AdminField, AdminPrimaryButton, AdminSectionHeader, AdminTextArea, AdminStatusBadge } from "@/components/admin/admin-ui";

export default function AdminPrintTypesPage() {
  const [items, setItems] = useState<PrintTypeDto[]>([]);
  const [name, setName] = useState("");
  const [colorCount, setColorCount] = useState("1");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setItems(await getPrintTypes());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kh�ng th? t?i print types.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    const nextColorCount = Number(colorCount);
    if (!nextName || Number.isNaN(nextColorCount)) return;
    setError("");
    setMessage("");
    try {
      await createPrintType({ name: nextName, colorCount: nextColorCount, description: description.trim() });
      setItems(await getPrintTypes());
      setName("");
      setColorCount("1");
      setDescription("");
      setMessage("�� t?o print type.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kh�ng th? t?o print type.");
    }
  };

  return (
    <div className="space-y-4 text-[#0b1b3b]">
      <AdminSectionHeader title="Qu?n l� print types" subtitle="Thi?t l?p c�c ki?u in d? d�ng th?ng nh?t trong admin v� tr�n s?n ph?m." />

      {loading ? <AdminCard className="p-4 text-sm text-slate-500">�ang t?i...</AdminCard> : null}
      {error ? <AdminCard className="border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</AdminCard> : null}
      {message ? <AdminCard className="border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{message}</AdminCard> : null}

      <section className="space-y-3">
        {items.length === 0 ? <AdminCard className="p-4 text-sm font-medium text-slate-600">Chua c� print type n�o.</AdminCard> : null}
        {items.map((item) => (
          <AdminCard key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Print type #{item.id}</p>
                <h2 className="mt-1 text-lg font-semibold text-[#0b1b3b]">{item.name}</h2>
              </div>
              <AdminStatusBadge tone="info">{item.colorCount} m�u</AdminStatusBadge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.description || "Chua c� m� t?"}</p>
          </AdminCard>
        ))}
      </section>

      <AdminCard className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Th�m ki?u in</p>
        <h2 className="mt-2 text-xl font-semibold text-[#0b1b3b]">T?o print type m?i</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block text-[11px] font-extrabold">T�n print type <AdminField placeholder="T�n print type" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></label>
          <label className="block text-[11px] font-extrabold">S? m�u <AdminField type="number" placeholder="S? m�u" value={colorCount} onChange={(e) => setColorCount(e.target.value)} className="mt-1" /></label>
          <label className="block text-[11px] font-extrabold">M� t? <AdminTextArea rows={3} placeholder="M� t?" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" /></label>
          <AdminPrimaryButton className="w-full" type="submit">Th�m print type</AdminPrimaryButton>
        </form>
      </AdminCard>
    </div>
  );
}