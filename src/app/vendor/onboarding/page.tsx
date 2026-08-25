import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("owner_id", user!.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
      <p className="mt-1 text-sm text-gray-500">
        {vendor
          ? `Status: ${vendor.status.toUpperCase()} — update your details below.`
          : "Tell us about your business. An admin will review & approve it."}
      </p>
      <OnboardingForm existing={vendor} />
    </div>
  );
}
