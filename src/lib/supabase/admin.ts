import { createClient } from "@supabase/supabase-js";

// Service-role client — BYPASSES RLS. SERVER ONLY.
// Use for webhooks, payment writes, and admin operations. Never import this
// into a "use client" file.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
