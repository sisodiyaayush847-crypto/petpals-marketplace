"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutClient({
  bookingId,
  amount,
}: {
  bookingId: string;
  amount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify(payload: any) {
    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Verification failed");
    router.push(`/account?booked=1`);
    router.refresh();
  }

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Could not create order");

      // Mock mode -> skip Razorpay widget, confirm directly.
      if (order.mock) {
        await verify({ order_id: order.order_id, mock: true });
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Failed to load payment gateway");

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "PetPals",
        description: "Pet service booking",
        order_id: order.order_id,
        handler: async (resp: any) => {
          try {
            await verify({
              order_id: resp.razorpay_order_id,
              payment_id: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
              mock: false,
            });
          } catch (e: any) {
            setError(e.message);
          }
        },
        theme: { color: "#9333ea" },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button onClick={pay} disabled={loading} className="btn-accent w-full">
        {loading ? "Processing…" : `Pay ₹${amount}`}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-center text-xs text-gray-400">
        Payments secured by Razorpay. In test/mock mode no real charge is made.
      </p>
    </div>
  );
}
