# KadexAuto DZ — Order Management

Staff-only order management webapp for a car dealership in Batna, Algeria, importing
Chinese cars (Geely, Changan, Livan, MG). Replaces the Excel workbook: clients,
inventory, orders, payments, and a live dashboard — with no double-selling.

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS
- Supabase (Postgres + Auth) via `@supabase/supabase-js` and `@supabase/ssr`
- Recharts

All money is DZD, stored as integer dinars (bigint) — never floats.
Dates display as DD/MM/YYYY. UI is in English.

## Features

- **Dashboard** — KPI cards (orders, open orders, revenue, collected,
  outstanding, stock value at landed cost, cars by location, clients) plus
  orders-per-month, revenue-per-month (year selector), and status charts.
- **Orders** — searchable/filterable list, create & edit with searchable
  client and available-car selects, live total, forward-only status flow
  (pending → confirmed → shipped → delivered), cancel, and per-order payments.
- **Inventory** — landed cost & margin, location and availability badges,
  brand → model dependent selects.
- **Clients** — orders count and total spent.
- **Payments** — balance-aware order picker with a non-blocking overpayment
  warning.
- **No double-sell** — a car can have only one active (non-cancelled) order,
  enforced by a partial unique index in the database.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in from your Supabase
project (Project Settings → API):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never commit `.env.local`. The app builds without these vars; they are only
required at runtime.

## Database

Schema, RLS policies, and seed data live in Supabase. Every table has Row
Level Security enabled with a single policy allowing the `authenticated`
role only — the `anon` role has no access. Money columns are `bigint`
(integer dinars). A partial unique index,
`orders(car_id) where status <> 'cancelled'`, guarantees no double-selling.

## Staff accounts (invite-only)

Public signups are disabled in Supabase Auth. Create staff users in the
Supabase dashboard: **Authentication → Users → Add user** (set email +
password, mark as confirmed). There is no signup page in the app; every
route except `/login` requires a session.

## Deploy to Vercel

1. **Import the repo.** In Vercel, click **Add New… → Project** and import
   this GitHub repository. Next.js is detected automatically — no build
   settings to change.
2. **Set environment variables.** Under **Settings → Environment Variables**
   (or during the import step) add both, for all environments:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Copy the values from Supabase **Project Settings → API** (Project URL and
   the `anon` / publishable key).
3. **Deploy.** Vercel builds and publishes to a free `*.vercel.app` URL.
   Pushes to `main` redeploy automatically.
4. **Create staff users** in the Supabase dashboard (see above) — they can
   then sign in at `/login`.

> The `anon` key is safe to expose to the browser; access is restricted by
> Row Level Security. Never put the Supabase `service_role` key in this app.

## Development

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase values
npm run dev
```

`npm run build` succeeds with no environment variables set — the Supabase
clients read configuration lazily at runtime.
