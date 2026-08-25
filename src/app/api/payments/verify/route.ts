import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { order_id, payment_id, signature, mock } = body;
  const admin = createAdminClient();

  // Mock mode -> auto-confirm.
  const isValid = mock
    ? true
    : verifyPaymentSignature(order_id, payment_id, signature);

  if (!isValid) {
    await admin.from("payments").update({ status: "failed" }).eq("razorpay_order_id", order_id);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // Mark payment paid + move booking to "accepted-pending-vendor" state.
  const { data: payment } = await admin
    .from("payments")
    .update({
      status: "paid",
      razorpay_payment_id: mock ? `pay_mock_${order_id}` : payment_id,
      razorpay_signature: mock ? "mock" : signature,
    })
    .eq("razorpay_order_id", order_id)
    .select("booking_id")
    .single();

  if (payment?.booking_id) {
    // Booking stays "pending" for vendor to accept; payment is captured.
    await admin.from("bookings").update({ status: "pending" }).eq("id", payment.booking_id);
  }

  return NextResponse.json({ ok: true, booking_id: payment?.booking_id });
}
