import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  return (
    <>
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1 text-sm">
            <Link href="/admin" className="block rounded px-3 py-2 hover:bg-gray-100">📊 Overview</Link>
            <Link href="/admin/vendors" className="block rounded px-3 py-2 hover:bg-gray-100">🏪 Vendors</Link>
            <Link href="/admin/bookings" className="block rounded px-3 py-2 hover:bg-gray-100">📦 Bookings</Link>
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </>
  );
}
