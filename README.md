# 🐾 PetPals — Multi-Vendor Pet Care Marketplace

A production-ready **starter** for a Swiggy-style pet-care marketplace: customers book
services, vendors accept bookings, admins oversee everything. Built with **Next.js 15 +
Supabase + Razorpay + Claude**, deployable to **Vercel**.

## What's included

| Portal | Routes | Features |
|---|---|---|
| **Customer** | `/`, `/services/[slug]`, `/book/...`, `/checkout/...`, `/account` | Browse by service + city, book, pay (Razorpay), track bookings |
| **Vendor** | `/vendor`, `/vendor/onboarding`, `/vendor/services`, `/vendor/bookings` | Business profile w/ location, list services + pricing, accept/reject bookings, dashboard |
| **Admin** | `/admin`, `/admin/vendors`, `/admin/bookings` | Platform stats (GMV, counts), approve/reject/suspend vendors, all bookings |
| **Chatbot** | floating widget | Claude-powered assistant with rule-based fallback |

Auth (Supabase), Row-Level Security, Razorpay payments (+ webhook), and a Claude chatbot
are all wired up.

---

## 1. Prerequisites

- Node.js 20+ (22 recommended)
- A [Supabase](https://supabase.com) account (free tier is fine to start)
- A [Razorpay](https://razorpay.com) account (Test Mode keys to begin)
- Optional: an [Anthropic](https://console.anthropic.com) API key for the AI chatbot
- A [Vercel](https://vercel.com) account for deployment

---

## 2. Database setup (Supabase)

1. Create a new project at **supabase.com** → note the project URL and keys.
2. Open **SQL Editor** in the Supabase dashboard.
3. Run the migrations **in order** (copy-paste each file, or use the Supabase CLI):
   - `supabase/migrations/0001_init.sql`  — tables, triggers
   - `supabase/migrations/0002_rls.sql`   — Row-Level Security policies
   - `supabase/migrations/0003_seed.sql`  — service catalog
4. **Auth settings** → for local testing you can disable "Confirm email"
   (Authentication → Providers → Email) so signups log in immediately.
5. **Storage** (optional, for logos later) → create a public bucket named `logos`.

### Make yourself an admin
After signing up once with your email, run this in the SQL Editor:
```sql
update public.profiles set role='admin'
where id = (select id from auth.users where email='YOUR_EMAIL');
```

> **Why RLS matters:** every table has policies so a vendor can only see their own
> bookings/services, customers only their own data, and admins everything. This is your
> multi-tenant safety net — never disable it.

---

## 3. Local environment

```bash
cp .env.example .env.local
# then fill in the values (see below)
npm install
npm run dev
# open http://localhost:3000
```

### Environment variables

| Var | Where to get it | Required? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (secret!) | ✅ |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay → Settings → API Keys | for real payments |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same as `RAZORPAY_KEY_ID` | for real payments |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Settings → Webhooks | for webhook |
| `ANTHROPIC_API_KEY` | console.anthropic.com | optional (AI chat) |

> **Payments work without Razorpay keys** — the app runs in **mock mode** and auto-confirms
> payments so you can test the full flow. Add real keys when ready.
>
> **Chatbot works without an Anthropic key** — it falls back to smart rule-based replies.

---

## 4. Try the full flow locally

1. **Sign up as a vendor** (`/signup?role=vendor`) → fill the business profile (use "Use my
   current location" for lat/lng) → add a service with a price.
2. **Sign in as admin** (your admin account) → `/admin/vendors` → **Approve** the vendor.
3. **Sign up as a customer** → browse the service → filter by the vendor's city → **Book Now**
   → checkout (mock pay) → see it in **My Bookings**.
4. Back as the **vendor** → `/vendor/bookings` → **Accept** → **Start** → **Complete**.
5. Watch the **admin overview** stats update.

---

## 5. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On **vercel.com** → **New Project** → import the repo.
3. Add **all** the env vars from `.env.local` in Vercel → Project → Settings → Environment
   Variables. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL.
4. Deploy. Vercel auto-detects Next.js.
5. **Razorpay webhook:** in the Razorpay dashboard → Settings → Webhooks → add
   `https://YOUR-APP.vercel.app/api/webhooks/razorpay`, select `payment.captured` and
   `payment.failed`, and set the secret to match `RAZORPAY_WEBHOOK_SECRET`.
6. **Supabase redirect URLs:** Authentication → URL Configuration → add your Vercel URL.

---

## 6. Scaling notes (toward "lakhs of users")

This foundation is built to grow. When traffic climbs:

- **Database:** Use Supabase's **connection pooler** (Supavisor) URL for serverless — already
  the default. Add indexes as query patterns emerge (hot ones are already in `0001_init.sql`).
- **Reads:** Cache service/vendor listings with Next.js `revalidate`, and paginate everything
  (already limited to 50–200 rows per query).
- **Payments:** The Razorpay **webhook** is the source of truth — never rely only on the
  browser callback in production.
- **Realtime:** Supabase Realtime can push booking-status changes to vendor/customer screens.
- **Search by location:** For "near me", enable PostGIS and index `latitude/longitude` for
  radius queries; or add a city/pincode index (present) for coarse filtering.
- **Rate limiting:** Add Vercel/Upstash rate limits on `/api/*` before heavy launch.
- **Media:** Serve vendor logos/pet images via Supabase Storage + a CDN.

---

## 7. Suggested next features

- Vendor payouts / commission split (Razorpay Route)
- Reviews & ratings UI (schema + triggers already exist)
- Availability calendar / time-slot conflicts
- Email/SMS notifications on booking status changes
- Map view of nearby vendors (Leaflet/Mapbox)
- Multi-city / multi-language support

---

## Project structure

```
src/
  app/
    (auth)/login, signup        # auth pages
    services/[slug]             # browse providers by service + city
    book/[serviceId]           # booking form
    checkout/[bookingId]       # Razorpay payment
    account/                   # customer: my bookings
    vendor/                    # vendor portal (dashboard, onboarding, services, bookings)
    admin/                     # admin portal (overview, vendors, bookings)
    api/                       # bookings, payments, vendor, admin, chat, webhooks
  components/                  # Navbar, Chatbot, LogoutButton
  lib/
    supabase/{client,server,admin}.ts   # 3 Supabase clients
    razorpay.ts, types.ts
  middleware.ts                # session refresh + route guards
supabase/migrations/          # 0001 schema, 0002 RLS, 0003 seed
```
