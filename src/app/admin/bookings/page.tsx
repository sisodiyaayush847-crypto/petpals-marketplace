import { createClient } from "@/lib/supabase/server";

export default async function AdminBookings() {
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, scheduled_at, amount, vendor:vendors(business_name, city), vendor_service:vendor_services(title)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr className="border-b">
              <th className="py-2">Vendor</th>
              <th>Service</th>
              <th>When</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map((b: any) => (
              <tr key={b.id} className="border-b">
                <td className="py-2">{b.vendor?.business_name}</td>
                <td>{b.vendor_service?.title}</td>
                <td>{new Date(b.scheduled_at).toLocaleString("en-IN")}</td>
                <td>₹{b.amount}</td>
                <td className="uppercase text-gray-600">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!bookings || bookings.length === 0) && (
          <p className="mt-4 text-gray-500">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
