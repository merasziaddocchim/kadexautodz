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

## Setup

_Sections below are completed as the app is built (Phase 3 finalizes them)._

### 1. Environment variables

Copy `.env.local.example` to `.env.local` and fill in from your Supabase
project (Project Settings → API):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never commit `.env.local`. The app builds without these vars; they are only
required at runtime.

### 2. Database

Schema, RLS policies, and seed data are managed directly in Supabase
(created in Phase 1). All tables are restricted to the `authenticated` role.

### 3. Staff accounts (invite-only)

Public signups are disabled. Create staff users in the Supabase dashboard
(Authentication → Users → Add user). There is no signup page in the app.

### 4. Deploy to Vercel

TODO (Phase 3): import the GitHub repo in Vercel, set the two env vars above,
deploy to the free `.vercel.app` subdomain.

## Development

```bash
npm install
npm run dev
```
