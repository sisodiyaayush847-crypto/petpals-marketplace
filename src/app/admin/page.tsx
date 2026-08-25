import { createClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  const supabase = await createClient();

  // Admin RLS lets these queries see everything.
  const [vendors, pendingVendors, bookings, paidPayments] = await Promise.all([
    supabase.from("vendors").select("id", { count: "exact", head: true }),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("amount").eq("status", "paid"),
  ]);

  const gmv = (paidPayments.data ?? []).reduce((s, p: any) => s + Number(p.amount), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total vendors" value={vendors.count ?? 0} />
        <Stat label="Pending approval" value={pendingVendors.count ?? 0} accent />
        <Stat label="Total bookings" value={bookings.count ?? 0} />
        <Stat label="GMV (paid)" value={`₹${gmv}`} />
      </div>
      <p className="mt-6 text-sm text-gray-500">
        Use the sidebar to approve vendors and monitor bookings across the platform.
      </p>
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
