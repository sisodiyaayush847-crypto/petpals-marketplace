import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  category_id: z.string().uuid(),
  title: z.string().min(2),
  price: z.string().min(1),
  duration_minutes: z.string().optional(),
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

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!vendor) return NextResponse.json({ error: "No vendor profile" }, { status: 400 });

  // RLS also enforces ownership; this insert passes the owns_vendor check.
  const { error } = await supabase.from("vendor_services").insert({
    vendor_id: vendor.id,
    category_id: d.category_id,
    title: d.title,
    price: Number(d.price),
    duration_minutes: d.duration_minutes ? Number(d.duration_minutes) : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // RLS ensures the vendor can only delete their own service rows.
  const { error } = await supabase.from("vendor_services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
