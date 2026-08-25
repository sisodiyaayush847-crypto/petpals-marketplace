import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  business_name: z.string().min(2),
  description: z.string().optional(),
  address_line: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;

  const payload = {
    owner_id: user.id,
    business_name: d.business_name,
    description: d.description || null,
    address_line: d.address_line || null,
    city: d.city,
    state: d.state || null,
    pincode: d.pincode || null,
    latitude: d.latitude ? Number(d.latitude) : null,
    longitude: d.longitude ? Number(d.longitude) : null,
    contact_phone: d.contact_phone || null,
    contact_email: d.contact_email || null,
  };

  const { data: existing } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    // Update — do NOT let vendor change their own status; RLS + omitting it here.
    const { error } = await supabase.from("vendors").update(payload).eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: existing.id });
  }

  const { data, error } = await supabase
    .from("vendors")
    .insert({ ...payload, status: "pending" })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}
