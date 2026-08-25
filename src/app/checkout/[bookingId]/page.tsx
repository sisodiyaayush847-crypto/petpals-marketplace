import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CheckoutClient } from "./CheckoutClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/checkout/${bookingId}`);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, amount, status, scheduled_at, vendor_service:vendor_services(title), vendor:vendors(business_name)"
    )
    .eq("id", bookingId)
    .single();

  if (!booking) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <div className="card mt-4 space-y-1">
          <p className="font-medium">{(booking.vendor as any)?.business_name}</p>
          <p className="text-sm text-gray-600">{(booking.vendor_service as any)?.title}</p>
          <p className="text-sm text-gray-500">
            🗓 {new Date(booking.scheduled_at).toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-2xl font-bold text-accent-600">₹{booking.amount}</p>
        </div>
        <CheckoutClient bookingId={booking.id} amount={Number(booking.amount)} />
      </main>
    </>
  );
}
