import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/vendor");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "vendor" && profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1 text-sm">
            <Link href="/vendor" className="block rounded px-3 py-2 hover:bg-gray-100">
              📊 Dashboard
            </Link>
            <Link href="/vendor/bookings" className="block rounded px-3 py-2 hover:bg-gray-100">
              📥 Bookings
            </Link>
            <Link href="/vendor/services" className="block rounded px-3 py-2 hover:bg-gray-100">
              🧰 My Services
            </Link>
            <Link href="/vendor/onboarding" className="block rounded px-3 py-2 hover:bg-gray-100">
              🏪 Business Profile
            </Link>
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </>
  );
}
