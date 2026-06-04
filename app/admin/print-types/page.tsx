"use client";

import { useEffect, useState, FormEvent } from "react";
import { createPrintType, getPrintTypes, type PrintTypeDto } from "@/lib/api/print-types";

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
        setError(err instanceof Error ? err.message : "Không thể tải print types.");
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
    try {
      await createPrintType({ name: nextName, colorCount: nextColorCount, description: description.trim() });
      setItems(await getPrintTypes());
      setName("");
      setColorCount("1");
      setDescription("");
      setMessage("Đã tạo print type.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo print type.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="panel-strong p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Print types</p>
        <h1 className="mt-2 text-3xl font-semibold text-header">Quản lý print types</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Thiết lập các kiểu in để dùng thống nhất trong admin và trên sản phẩm.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="panel p-5 sm:p-6">
          {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
          {error ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-[1.5rem] border border-[#dbe5ef] bg-white p-4 shadow-[var(--shadow-card)]">
                <h2 className="font-semibold text-header">{item.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.colorCount} màu</p>
                <p className="mt-1 text-sm text-slate-600">{item.description || "Chưa có mô tả"}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel p-5 sm:p-6">
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="input-modern" placeholder="Tên print type" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input-modern" type="number" placeholder="Số màu" value={colorCount} onChange={(e) => setColorCount(e.target.value)} />
            <textarea className="input-modern" rows={4} placeholder="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="button-primary w-full" type="submit">Thêm print type</button>
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          </form>
        </aside>
      </section>
    </div>
  );
}
