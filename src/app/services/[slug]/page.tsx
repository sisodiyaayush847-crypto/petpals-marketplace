import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { NearbyListings } from "./NearbyListings";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("service_categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        <p className="mt-1 text-gray-600">{category.description}</p>

        <NearbyListings categoryId={category.id} categoryName={category.name} />
      </main>
    </>
  );
}
