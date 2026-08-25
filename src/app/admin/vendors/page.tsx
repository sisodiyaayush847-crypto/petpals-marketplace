import { createClient } from "@/lib/supabase/server";
import { VendorRow } from "./VendorRow";

export default async function AdminVendors() {
  const supabase = await createClient();
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
      <div className="mt-6 space-y-3">
        {(vendors ?? []).map((v: any) => (
          <VendorRow key={v.id} vendor={v} />
        ))}
        {(!vendors || vendors.length === 0) && (
          <p className="text-gray-500">No vendors yet.</p>
        )}
      </div>
    </div>
  );
}
