"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BookingForm({
  serviceId,
  amount,
}: {
  serviceId: string;
  amount: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    scheduled_at: "",
    service_address: "",
    pet_name: "",
    pet_type: "Dog",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function upd(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_service_id: serviceId, ...form }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }
    router.push(`/checkout/${data.booking_id}`);
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4">
      <div>
        <label className="label">Preferred date & time</label>
        <input type="datetime-local" className="input" required
          value={form.scheduled_at} onChange={(e) => upd("scheduled_at", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Pet name</label>
          <input className="input" value={form.pet_name}
            onChange={(e) => upd("pet_name", e.target.value)} />
        </div>
        <div>
          <label className="label">Pet type</label>
          <select className="input" value={form.pet_type}
            onChange={(e) => upd("pet_type", e.target.value)}>
            <option>Dog</option>
            <option>Cat</option>
            <option>Bird</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Service address</label>
        <input className="input" placeholder="Where should the service happen?"
          value={form.service_address} onChange={(e) => upd("service_address", e.target.value)} />
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <textarea className="input" rows={3} value={form.notes}
          onChange={(e) => upd("notes", e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Creating booking…" : `Continue to Payment · ₹${amount}`}
      </button>
    </form>
  );
}
