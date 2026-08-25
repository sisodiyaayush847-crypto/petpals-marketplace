"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceCategory } from "@/lib/types";

export function ServicesManager({
  categories,
  services,
}: {
  categories: ServiceCategory[];
  services: any[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    category_id: categories[0]?.id ?? "",
    title: "",
    price: "",
    duration_minutes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/vendor/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setLoading(false);
      return;
    }
    setForm({ ...form, title: "", price: "", duration_minutes: "" });
    setLoading(false);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/vendor/services?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form onSubmit={add} className="card space-y-3">
        <h2 className="font-semibold">Add a service</h2>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Title *</label>
          <input className="input" required value={form.title}
            placeholder="e.g. Full grooming package"
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Price (₹) *</label>
            <input className="input" type="number" min="0" required value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="label">Duration (min)</label>
            <input className="input" type="number" min="0" value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={loading}>
          {loading ? "Adding…" : "Add service"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold">Current services</h2>
        {services.length === 0 && <p className="text-sm text-gray-500">None yet.</p>}
        {services.map((s) => (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-gray-500">
                {s.category?.name} · ₹{s.price}
                {s.duration_minutes ? ` · ${s.duration_minutes}min` : ""}
              </p>
            </div>
            <button onClick={() => remove(s.id)}
              className="text-sm text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
