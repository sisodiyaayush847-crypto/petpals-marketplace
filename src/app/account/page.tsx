import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-700",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, scheduled_at, amount, pet_name, vendor:vendors(business_name, city), vendor_service:vendor_services(title)"
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <div className="mt-6 space-y-3">
          {(bookings ?? []).map((b: any) => (
            <div key={b.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{b.vendor?.business_name}</p>
                <p className="text-sm text-gray-600">{b.vendor_service?.title}</p>
                <p className="text-sm text-gray-500">
                  🗓 {new Date(b.scheduled_at).toLocaleString("en-IN")} · 📍 {b.vendor?.city}
                </p>
              </div>
              <div className="text-right">
                <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLE[b.status]}`}>
                  {b.status}
                </span>
                <p className="mt-1 font-bold text-accent-600">₹{b.amount}</p>
              </div>
            </div>
          ))}
          {(!bookings || bookings.length === 0) && (
            <p className="text-gray-500">No bookings yet. Browse services to get started!</p>
          )}
        </div>
      </main>
    </>
  );
}
