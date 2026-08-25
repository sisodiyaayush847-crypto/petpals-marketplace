import { createClient } from "@/lib/supabase/server";
import { ServicesManager } from "./ServicesManager";

export default async function VendorServices() {
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

  const [{ data: categories }, { data: services }] = await Promise.all([
    supabase.from("service_categories").select("*").eq("active", true).order("name"),
    supabase
      .from("vendor_services")
      .select("id, title, price, duration_minutes, active, category_id, category:service_categories(name)")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
      <ServicesManager categories={categories ?? []} services={services ?? []} />
    </div>
  );
}
