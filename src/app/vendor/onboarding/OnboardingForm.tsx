"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Vendor } from "@/lib/types";

export function OnboardingForm({ existing }: { existing: Vendor | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: existing?.business_name ?? "",
    description: existing?.description ?? "",
    address_line: existing?.address_line ?? "",
    city: existing?.city ?? "",
    state: existing?.state ?? "",
    pincode: existing?.pincode ?? "",
    latitude: existing?.latitude?.toString() ?? "",
    longitude: existing?.longitude?.toString() ?? "",
    contact_phone: existing?.contact_phone ?? "",
    contact_email: existing?.contact_email ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  function upd(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      upd("latitude", pos.coords.latitude.toFixed(6));
      upd("longitude", pos.coords.longitude.toFixed(6));
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(false);
    const res = await fetch("/api/vendor/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save");
      setLoading(false);
      return;
    }
    setOk(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4">
      <div>
        <label className="label">Business name *</label>
        <input className="input" required value={form.business_name}
          onChange={(e) => upd("business_name", e.target.value)} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={3} value={form.description}
          onChange={(e) => upd("description", e.target.value)} />
      </div>

      <div>
        <label className="label">Address</label>
        <input className="input" value={form.address_line}
          onChange={(e) => upd("address_line", e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">City *</label>
          <input className="input" required value={form.city}
            onChange={(e) => upd("city", e.target.value)} />
        </div>
        <div>
          <label className="label">State</label>
          <input className="input" value={form.state}
            onChange={(e) => upd("state", e.target.value)} />
        </div>
        <div>
          <label className="label">Pincode</label>
          <input className="input" value={form.pincode}
            onChange={(e) => upd("pincode", e.target.value)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label">Geo location (lat/lng)</label>
          <button type="button" onClick={useMyLocation}
            className="text-xs font-medium text-brand-600">
            📍 Use my current location
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Latitude" value={form.latitude}
            onChange={(e) => upd("latitude", e.target.value)} />
          <input className="input" placeholder="Longitude" value={form.longitude}
            onChange={(e) => upd("longitude", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Contact phone</label>
          <input className="input" value={form.contact_phone}
            onChange={(e) => upd("contact_phone", e.target.value)} />
        </div>
        <div>
          <label className="label">Contact email</label>
          <input className="input" type="email" value={form.contact_email}
            onChange={(e) => upd("contact_email", e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-green-600">Saved! Awaiting admin approval.</p>}
      <button className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : existing ? "Update Profile" : "Submit for Approval"}
      </button>
    </form>
  );
}
