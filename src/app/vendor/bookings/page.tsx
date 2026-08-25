import { createClient } from "@/lib/supabase/server";
import { BookingActions } from "./BookingActions";

export default async function VendorBookings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user!.id)
    .maybeSingle();

  if (!vendor) return <p className="text-gray-500">Set up your business first.</p>;

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, scheduled_at, amount, pet_name, pet_type, service_address, notes, vendor_service:vendor_services(title)"
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
      <div className="mt-6 space-y-3">
        {(bookings ?? []).map((b: any) => (
          <div key={b.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{b.vendor_service?.title}</p>
                <p className="text-sm text-gray-600">
                  🐾 {b.pet_name || "—"} ({b.pet_type || "—"})
                </p>
                <p className="text-sm text-gray-500">
                  🗓 {new Date(b.scheduled_at).toLocaleString("en-IN")}
                </p>
                {b.service_address && (
                  <p className="text-sm text-gray-500">📍 {b.service_address}</p>
                )}
                {b.notes && <p className="mt-1 text-sm text-gray-400">“{b.notes}”</p>}
              </div>
              <div className="text-right">
                <p className="font-bold text-accent-600">₹{b.amount}</p>
                <span className="text-xs uppercase text-gray-500">{b.status}</span>
              </div>
            </div>
            <BookingActions id={b.id} status={b.status} />
          </div>
        ))}
        {(!bookings || bookings.length === 0) && (
          <p className="text-gray-500">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
