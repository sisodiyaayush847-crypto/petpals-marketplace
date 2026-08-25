import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

const SERVICES = [
  { slug: "grooming", label: "Grooming" },
  { slug: "training", label: "Training" },
  { slug: "walking", label: "Walking" },
  { slug: "veterinary", label: "Veterinary" },
  { slug: "store", label: "Pet Store" },
];

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = data?.role ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-extrabold text-brand-700">
          🐾 PetPals
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="text-sm text-gray-700 hover:text-brand-600"
            >
              {s.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link href="/login" className="text-sm text-gray-700 hover:text-brand-600">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                Sign Up
              </Link>
            </>
          )}
          {user && (
            <>
              {role === "admin" && (
                <Link href="/admin" className="text-sm text-gray-700 hover:text-brand-600">
                  Admin
                </Link>
              )}
              {role === "vendor" && (
                <Link href="/vendor" className="text-sm text-gray-700 hover:text-brand-600">
                  Vendor Dashboard
                </Link>
              )}
              <Link href="/account" className="text-sm text-gray-700 hover:text-brand-600">
                My Bookings
              </Link>
              <LogoutButton />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
