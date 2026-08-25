import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { BookingForm } from "./BookingForm";

export default async function BookPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/book/${serviceId}`);

  const { data: svc } = await supabase
    .from("vendor_services")
    .select(
      "id, title, price, duration_minutes, vendor:vendors!inner(id, business_name, city, address_line)"
    )
    .eq("id", serviceId)
    .single();

  if (!svc) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Book: {svc.title}</h1>
        <div className="card mt-4">
          <p className="font-medium">{(svc.vendor as any).business_name}</p>
          <p className="text-sm text-gray-500">📍 {(svc.vendor as any).city}</p>
          <p className="mt-2 text-lg font-bold text-accent-600">₹{svc.price}</p>
        </div>
        <BookingForm
          serviceId={svc.id}
          amount={Number(svc.price)}
        />
      </main>
    </>
  );
}
