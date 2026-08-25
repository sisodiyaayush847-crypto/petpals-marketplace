import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { booking_id } = await req.json();

  // Ownership check via RLS-respecting client.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, amount, customer_id")
    .eq("id", booking_id)
    .single();

  if (!booking || booking.customer_id !== user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const rzp = getRazorpay();
  const admin = createAdminClient();
  const amountPaise = Math.round(Number(booking.amount) * 100);

  // --- MOCK MODE: no Razorpay keys configured -> simulate an order ---
  if (!rzp) {
    const mockOrderId = `order_mock_${booking.id.slice(0, 12)}`;
    await admin.from("payments").upsert(
      {
        booking_id: booking.id,
        razorpay_order_id: mockOrderId,
        amount: booking.amount,
        status: "created",
      },
      { onConflict: "razorpay_order_id" }
    );
    return NextResponse.json({
      mock: true,
      order_id: mockOrderId,
      amount: amountPaise,
      currency: "INR",
    });
  }

  // --- REAL MODE ---
  const order = await rzp.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `bk_${booking.id.slice(0, 20)}`,
    notes: { booking_id: booking.id },
  });

  await admin.from("payments").upsert(
    {
      booking_id: booking.id,
      razorpay_order_id: order.id,
      amount: booking.amount,
      status: "created",
    },
    { onConflict: "razorpay_order_id" }
  );

  return NextResponse.json({
    mock: false,
    order_id: order.id,
    amount: amountPaise,
    currency: "INR",
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
