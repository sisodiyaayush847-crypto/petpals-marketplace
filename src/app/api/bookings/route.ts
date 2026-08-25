import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  vendor_service_id: z.string().uuid(),
  scheduled_at: z.string().min(1),
  service_address: z.string().optional(),
  pet_name: z.string().optional(),
  pet_type: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const input = parsed.data;

  // Look up the service to get vendor_id + authoritative price (never trust client).
  const { data: svc, error: svcErr } = await supabase
    .from("vendor_services")
    .select("id, price, vendor_id, active")
    .eq("id", input.vendor_service_id)
    .single();

  if (svcErr || !svc || !svc.active) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 400 });
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      vendor_id: svc.vendor_id,
      vendor_service_id: svc.id,
      scheduled_at: new Date(input.scheduled_at).toISOString(),
      service_address: input.service_address,
      pet_name: input.pet_name,
      pet_type: input.pet_type,
      notes: input.notes,
      amount: svc.price,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ booking_id: booking.id });
}
