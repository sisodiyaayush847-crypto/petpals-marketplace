"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Vendor, VendorStatus } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  suspended: "bg-orange-100 text-orange-800",
  rejected: "bg-red-100 text-red-800",
};

export function VendorRow({ vendor }: { vendor: Vendor }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: VendorStatus) {
    setLoading(true);
    await fetch("/api/admin/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_id: vendor.id, status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{vendor.business_name}</p>
          <p className="text-sm text-gray-600">
            📍 {vendor.city}
            {vendor.state ? `, ${vendor.state}` : ""}{" "}
            {vendor.pincode ? `— ${vendor.pincode}` : ""}
          </p>
          {vendor.description && (
            <p className="mt-1 text-sm text-gray-500">{vendor.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {vendor.contact_phone} · {vendor.contact_email}
          </p>
        </div>
        <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLE[vendor.status]}`}>
          {vendor.status}
        </span>
      </div>
      <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
        {vendor.status !== "approved" && (
          <button onClick={() => setStatus("approved")} disabled={loading}
            className="btn-primary text-sm">Approve</button>
        )}
        {vendor.status !== "rejected" && (
          <button onClick={() => setStatus("rejected")} disabled={loading}
            className="btn-outline text-sm">Reject</button>
        )}
        {vendor.status === "approved" && (
          <button onClick={() => setStatus("suspended")} disabled={loading}
            className="btn-outline text-sm">Suspend</button>
        )}
      </div>
    </div>
  );
}
