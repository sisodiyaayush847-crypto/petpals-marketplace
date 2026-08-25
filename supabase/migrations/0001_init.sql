-- ============================================================
-- PetPals Marketplace — initial schema
-- Run in Supabase SQL Editor (or `supabase db push`)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- ENUM types ----------
do $$ begin
  create type user_role as enum ('customer', 'vendor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vendor_status as enum ('pending', 'approved', 'suspended', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('created', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- service catalog (global) ----------
create table if not exists public.service_categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,          -- grooming, training, walking, veterinary, store
  name text not null,
  description text,
  icon text,
  base_price_hint numeric(10,2),
  active boolean not null default true
);

-- ---------- vendors ----------
create table if not exists public.vendors (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  description text,
  status vendor_status not null default 'pending',
  -- location
  address_line text,
  city text not null,
  state text,
  pincode text,
  latitude double precision,
  longitude double precision,
  -- contact / meta
  contact_phone text,
  contact_email text,
  logo_url text,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_vendors_city on public.vendors (city);
create index if not exists idx_vendors_status on public.vendors (status);
create index if not exists idx_vendors_owner on public.vendors (owner_id);

-- ---------- vendor_services (what each vendor offers + price) ----------
create table if not exists public.vendor_services (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  category_id uuid not null references public.service_categories(id),
  title text not null,
  price numeric(10,2) not null,
  duration_minutes int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_vs_vendor on public.vendor_services (vendor_id);
create index if not exists idx_vs_category on public.vendor_services (category_id);

-- ---------- bookings ----------
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  vendor_service_id uuid not null references public.vendor_services(id),
  status booking_status not null default 'pending',
  scheduled_at timestamptz not null,
  service_address text,
  pet_name text,
  pet_type text,
  notes text,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_bookings_customer on public.bookings (customer_id, created_at desc);
create index if not exists idx_bookings_vendor on public.bookings (vendor_id, status, created_at desc);

-- ---------- payments ----------
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(10,2) not null,
  currency text not null default 'INR',
  status payment_status not null default 'created',
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_booking on public.payments (booking_id);
create unique index if not exists idx_payments_order on public.payments (razorpay_order_id);

-- ---------- reviews ----------
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id)
);
create index if not exists idx_reviews_vendor on public.reviews (vendor_id);

-- ---------- chat_messages (chatbot history) ----------
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  session_id text not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_session on public.chat_messages (session_id, created_at);

-- ============================================================
-- Auto-create a profile row when a new auth user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Keep vendor rating aggregate in sync
-- ============================================================
create or replace function public.refresh_vendor_rating()
returns trigger language plpgsql as $$
begin
  update public.vendors v set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where vendor_id = v.id), 0),
    rating_count = (select count(*) from public.reviews where vendor_id = v.id)
  where v.id = coalesce(new.vendor_id, old.vendor_id);
  return null;
end; $$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_vendor_rating();
