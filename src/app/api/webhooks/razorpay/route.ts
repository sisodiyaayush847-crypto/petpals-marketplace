import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Razorpay -> our server. Configure this URL in the Razorpay dashboard
// (Settings -> Webhooks) with events: payment.captured, payment.failed.
export async function POST(req: Request) {
  const signature = req.headers.get("x-razorpay-signature") || "";
  const raw = await req.text();

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw);
  const admin = createAdminClient();
  const entity = event?.payload?.payment?.entity;
  const orderId = entity?.order_id;

  if (!orderId) return NextResponse.json({ ok: true });

  if (event.event === "payment.captured") {
    await admin
      .from("payments")
      .update({ status: "paid", razorpay_payment_id: entity.id })
      .eq("razorpay_order_id", orderId);
  } else if (event.event === "payment.failed") {
    await admin.from("payments").update({ status: "failed" }).eq("razorpay_order_id", orderId);
  }

  return NextResponse.json({ ok: true });
}
