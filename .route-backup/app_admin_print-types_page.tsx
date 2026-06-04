"use client";

import { FormEvent, useEffect, useState } from "react";
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
        <div className="space-y-6">
            <section className="panel-strong p-6"><h1 className="text-3xl font-semibold text-header">Qu?n l� print types</h1></section>
            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="panel p-5">
                    {loading ? <p className="text-sm text-slate-500">�ang t?i...</p> : null}
                    {error ? <p className="mt-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
                    <div className="mt-4 grid gap-3">
                        {items.map((item) => (
                            <article key={item.id} className="rounded-2xl border border-[#e6e0d8] p-4">
                                <h2 className="font-semibold text-header">{item.name}</h2>
                                <p className="mt-1 text-sm text-slate-600">{item.colorCount} m�u</p>
                                <p className="mt-1 text-sm text-slate-600">{item.description || "Chua c� m� t?"}</p>
                            </article>
                        ))}
                    </div>
                </div>
                <aside className="panel p-5">
                    <form onSubmit={onSubmit} className="space-y-3">
                        <input className="input-modern" placeholder="T�n print type" value={name} onChange={(e) => setName(e.target.value)} />
                        <input className="input-modern" type="number" placeholder="S? m�u" value={colorCount} onChange={(e) => setColorCount(e.target.value)} />
                        <textarea className="input-modern" rows={4} placeholder="M� t?" value={description} onChange={(e) => setDescription(e.target.value)} />
                        <button className="button-primary w-full" type="submit">Th�m print type</button>
                        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
                    </form>
                </aside>
            </section>
        </div>
    );
}
