import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function VendorDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("owner_id", user!.id)
    .maybeSingle();

  if (!vendor) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold">Welcome! 🏪</h2>
        <p className="mt-2 text-gray-600">
          You haven't set up your business yet.
        </p>
        <Link href="/vendor/onboarding" className="btn-primary mt-4">
          Set up your business
        </Link>
      </div>
    );
  }

  // Simple stats.
  const { count: totalBookings } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendor.id);

  const { count: pendingBookings } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendor.id)
    .eq("status", "pending");

  const { data: completed } = await supabase
    .from("bookings")
    .select("amount")
    .eq("vendor_id", vendor.id)
    .eq("status", "completed");
  const revenue = (completed ?? []).reduce((s, b: any) => s + Number(b.amount), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      {vendor.status !== "approved" && (
        <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
          Your business is <b>{vendor.status}</b>. Customers can only see you once an admin
          approves your profile.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total bookings" value={totalBookings ?? 0} />
        <Stat label="Pending" value={pendingBookings ?? 0} accent />
        <Stat label="Revenue (completed)" value={`₹${revenue}`} />
        <Stat label="Rating" value={`⭐ ${Number(vendor.rating_avg).toFixed(1)}`} />
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/vendor/bookings" className="btn-primary">View bookings</Link>
        <Link href="/vendor/services" className="btn-outline">Manage services</Link>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-accent-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
