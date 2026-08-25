"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@/lib/types";

// Which status transitions the vendor may trigger from each current status.
const NEXT: Record<string, { label: string; to: BookingStatus; style: string }[]> = {
  pending: [
    { label: "Accept", to: "accepted", style: "btn-primary" },
    { label: "Reject", to: "rejected", style: "btn-outline" },
  ],
  accepted: [{ label: "Start service", to: "in_progress", style: "btn-primary" }],
  in_progress: [{ label: "Mark completed", to: "completed", style: "btn-accent" }],
};

export function BookingActions({ id, status }: { id: string; status: BookingStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const actions = NEXT[status] ?? [];

  if (actions.length === 0) return null;

  async function move(to: BookingStatus) {
    setLoading(true);
    await fetch("/api/vendor/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: id, status: to }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
      {actions.map((a) => (
        <button key={a.to} onClick={() => move(a.to)} disabled={loading}
          className={`${a.style} text-sm`}>
          {a.label}
        </button>
      ))}
    </div>
  );
}
