# 🚀 Deploying PetPals to Vercel — Full Setup Guide


This walks you through going from the code on your machine to a live, working
marketplace on Vercel — database, auth, payments, chatbot, and location search.

**Estimated time:** ~30–45 minutes the first time.

Order matters: **Supabase first, then GitHub, then Vercel, then post-deploy wiring.**

---

## Overview of what you're connecting

```
  Browser ──► Vercel (Next.js app) ──► Supabase (Postgres + Auth)
                     │
                     ├──► Razorpay (payments)  ◄── webhook ──┐
                     └──► Anthropic (chatbot, optional)      │
                                                             │
                          Razorpay servers ─────────────────┘
```

---

## Step 1 — Create the Supabase project & database

1. Go to **[supabase.com](https://supabase.com)** → **New project**.
   - Pick a name, a strong DB password (save it), and a region **close to your users**
     (e.g. `Mumbai (ap-south-1)` for India).
2. Wait ~2 min for it to provision.
3. Open **SQL Editor** (left sidebar) → **New query**.
4. Run each migration file **in order**. Open each file from `supabase/migrations/`,
   paste its contents, and click **Run**:
   1. `0001_init.sql` — tables, enums, triggers
   2. `0002_rls.sql` — Row-Level Security policies
   3. `0003_seed.sql` — the 5 service categories
   4. `0004_nearby.sql` — the location/distance search function

   > ✅ After each run you should see "Success. No rows returned" (or similar). If one
   > fails, fix it before running the next — they build on each other.

5. **Grab your keys:** Settings (gear icon) → **API**. Copy these three:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "reveal") → `SUPABASE_SERVICE_ROLE_KEY`
     — ⚠️ secret, server-only, never expose in the browser.

6. **Email confirmation (recommended for launch):** Authentication → Providers → Email.
   - Leave "Confirm email" **ON** for production so accounts are verified.
   - For quick testing you may turn it **OFF** so signups log in instantly.

---

## Step 2 — Push the code to GitHub

From the project folder:

```bash
cd /Users/ayush.sisodiya/petpals-marketplace
git init
git add .
git commit -m "Initial commit: PetPals marketplace"
```

Create an **empty** repo on GitHub (no README), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/petpals-marketplace.git
git branch -M main
git push -u origin main
```

> `.gitignore` already excludes `.env*` and `node_modules`, so your secrets are **not**
> pushed. Good.

---

## Step 3 — Import the project into Vercel

1. Go to **[vercel.com](https://vercel.com)** → **Add New… → Project**.
2. **Import** your `petpals-marketplace` GitHub repo.
3. Vercel auto-detects **Next.js** — leave build settings as default.
4. **Before clicking Deploy**, expand **Environment Variables** and add the ones below.

---

## Step 4 — Environment variables (add all in Vercel)

Vercel → Project → **Settings → Environment Variables**. Add each for the
**Production** (and Preview, if you want) environment:

| Variable | Value / source | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secret) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://YOUR-APP.vercel.app` (set after first deploy) | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys | for real payments |
| `RAZORPAY_KEY_SECRET` | Razorpay → Settings → API Keys | for real payments |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same value as `RAZORPAY_KEY_ID` | for real payments |
| `RAZORPAY_WEBHOOK_SECRET` | you set this in Razorpay webhooks (Step 7) | for webhook |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | optional (AI chat) |

> **Graceful degradation is built in:**
> - No Razorpay keys → app runs in **mock payment mode** (auto-confirms, no real charge).
> - No Anthropic key → chatbot uses **rule-based replies**.
>
> So you can deploy with just the 4 Supabase/site vars and everything still works for a demo.

Click **Deploy**. After it finishes you'll get a URL like `https://petpals-xyz.vercel.app`.

---

## Step 5 — Point env + Supabase at your live URL

1. Copy your live Vercel URL.
2. Vercel → Settings → Environment Variables → set **`NEXT_PUBLIC_SITE_URL`** to it →
   **Redeploy** (Deployments → ⋯ → Redeploy) so the change takes effect.
3. Supabase → Authentication → **URL Configuration**:
   - **Site URL:** `https://YOUR-APP.vercel.app`
   - **Redirect URLs:** add `https://YOUR-APP.vercel.app/**`

---

## Step 6 — Make yourself an admin

1. Visit your live site → **Sign Up** with your real email (confirm it if email
   confirmation is on).
2. Supabase → SQL Editor → run (replace the email):

   ```sql
   update public.profiles set role='admin'
   where id = (select id from auth.users where email='YOUR_EMAIL');
   ```

3. Refresh the site — you'll now see the **Admin** link and can approve vendors at
   `/admin/vendors`.

---

## Step 7 — Razorpay (real payments)

Skip this to stay in mock mode. To take real (test-mode) payments:

1. **[dashboard.razorpay.com](https://dashboard.razorpay.com)** → start in **Test Mode**
   (toggle top-left).
2. Settings → **API Keys** → Generate → copy **Key Id** and **Key Secret** into the
   Vercel env vars (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`).
3. Settings → **Webhooks** → **Add New Webhook**:
   - **URL:** `https://YOUR-APP.vercel.app/api/webhooks/razorpay`
   - **Secret:** make up a strong string; put the **same** value in
     `RAZORPAY_WEBHOOK_SECRET` on Vercel.
   - **Active events:** check `payment.captured` and `payment.failed`.
4. **Redeploy** on Vercel so the new env vars load.
5. Test with Razorpay's [test cards](https://razorpay.com/docs/payments/payments/test-card-details/)
   (e.g. card `4111 1111 1111 1111`, any future expiry, any CVV).

> When you're ready for live money, switch Razorpay to **Live Mode**, regenerate live keys,
> update the Vercel env vars, and re-add the webhook with live-mode settings.

---

## Step 8 — Verify the whole flow on production

Run through this once end-to-end:

1. **Vendor:** sign up at `/signup?role=vendor` → fill the business profile →
   click **"Use my current location"** so lat/lng are saved (needed for distance search) →
   add a service with a price.
2. **Admin:** at `/admin/vendors`, **Approve** that vendor.
3. **Customer:** sign up (or use another browser) → open a service page → **allow location**
   → confirm you see **"X.X km away"** and nearest-first ordering → try the rating filter →
   **Book Now** → pay (mock or Razorpay test) → see it under **My Bookings**.
4. **Vendor:** at `/vendor/bookings`, **Accept → Start → Complete**.
5. **Admin:** confirm the **overview** stats update (GMV, counts).
6. **Chatbot:** open the 💬 widget, ask "how do I book grooming?" — confirm a sensible reply.

If all six pass, you're live. 🎉

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `function nearby_services does not exist` | You didn't run `0004_nearby.sql`. Run it in the SQL Editor. |
| Login works but "My Bookings"/Admin redirects to `/` | Role not set. Re-run the admin SQL, or check the `profiles` row exists. |
| No vendors show with location on | Vendor has no lat/lng, or is outside the radius, or not **approved**. Widen radius / approve / set location. |
| "Using your live location" never appears | Browser blocked geolocation, or the site isn't HTTPS. Vercel is HTTPS; check the browser's site permissions. |
| Payment "Invalid signature" | `RAZORPAY_KEY_SECRET` mismatch, or you didn't redeploy after adding it. |
| Webhook not updating payment status | URL, event selection, or `RAZORPAY_WEBHOOK_SECRET` mismatch. Check Razorpay → Webhooks → recent deliveries. |
| Chatbot always gives short canned answers | `ANTHROPIC_API_KEY` missing/invalid → it's using the rule-based fallback (expected). |
| Build fails on Vercel | Check the build log; ensure all **required** env vars are set. Locally: `npm run build`. |

---

## Custom domain (optional)

Vercel → Project → **Settings → Domains** → add your domain and follow the DNS
instructions. Then update **`NEXT_PUBLIC_SITE_URL`** and the **Supabase redirect URLs**
to the new domain, and redeploy.

---

## Ongoing: how updates deploy

Every `git push` to `main` triggers an automatic Vercel deployment. Pull requests get
their own preview URLs. Database schema changes are **not** automatic — add a new
`supabase/migrations/00XX_*.sql` file and run it in the Supabase SQL Editor yourself.

---

## Scaling checklist (when traffic grows)

- Supabase **connection pooler** (Supavisor) — already the default for serverless.
- Add **rate limiting** on `/api/*` (Vercel + Upstash) before a big launch.
- Cache vendor/service listings with Next.js `revalidate`.
- Upgrade distance search to **PostGIS** (geography column + GiST index) for millions of rows.
- Move vendor logos / pet photos to **Supabase Storage** behind a CDN.
- Turn on Supabase **Realtime** to live-update booking status on vendor/customer screens.
