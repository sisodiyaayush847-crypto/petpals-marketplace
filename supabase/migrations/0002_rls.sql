-- ============================================================
-- Row-Level Security — the multi-tenant safety net.
-- Run AFTER 0001_init.sql.
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.service_categories enable row level security;
alter table public.vendors            enable row level security;
alter table public.vendor_services    enable row level security;
alter table public.bookings           enable row level security;
alter table public.payments           enable row level security;
alter table public.reviews            enable row level security;
alter table public.chat_messages      enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- helper: does the current user own this vendor?
create or replace function public.owns_vendor(v_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vendors where id = v_id and owner_id = auth.uid());
$$;

-- ---------- profiles ----------
create policy "read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());

-- ---------- service_categories (public read, admin write) ----------
create policy "categories public read" on public.service_categories
  for select using (true);
create policy "categories admin write" on public.service_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- vendors ----------
-- Anyone can browse APPROVED vendors; owners & admins see their own regardless.
create policy "vendors public read approved" on public.vendors
  for select using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy "vendor owner insert" on public.vendors
  for insert with check (owner_id = auth.uid());
create policy "vendor owner update" on public.vendors
  for update using (owner_id = auth.uid() or public.is_admin());
create policy "vendor admin delete" on public.vendors
  for delete using (public.is_admin());

-- ---------- vendor_services ----------
create policy "vs public read" on public.vendor_services
  for select using (active = true or public.owns_vendor(vendor_id) or public.is_admin());
create policy "vs owner write" on public.vendor_services
  for all using (public.owns_vendor(vendor_id) or public.is_admin())
  with check (public.owns_vendor(vendor_id) or public.is_admin());

-- ---------- bookings ----------
-- Customer sees own; vendor sees bookings for their business; admin sees all.
create policy "bookings read" on public.bookings
  for select using (
    customer_id = auth.uid() or public.owns_vendor(vendor_id) or public.is_admin()
  );
create policy "bookings customer insert" on public.bookings
  for insert with check (customer_id = auth.uid());
-- Customer can cancel; vendor can update status; admin anything.
create policy "bookings update" on public.bookings
  for update using (
    customer_id = auth.uid() or public.owns_vendor(vendor_id) or public.is_admin()
  );

-- ---------- payments ----------
-- Read if you own the underlying booking (as customer or vendor) or admin.
create policy "payments read" on public.payments
  for select using (
    public.is_admin() or exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or public.owns_vendor(b.vendor_id))
    )
  );
-- Writes go through the service-role server client (bypasses RLS), so no
-- client insert/update policy is granted here on purpose.

-- ---------- reviews ----------
create policy "reviews public read" on public.reviews
  for select using (true);
create policy "reviews customer write" on public.reviews
  for insert with check (customer_id = auth.uid());
create policy "reviews customer update own" on public.reviews
  for update using (customer_id = auth.uid());

-- ---------- chat_messages ----------
create policy "chat read own" on public.chat_messages
  for select using (user_id = auth.uid() or user_id is null);
create policy "chat insert own" on public.chat_messages
  for insert with check (user_id = auth.uid() or user_id is null);
