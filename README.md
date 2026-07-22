# KadexAuto DZ — Order Management

Staff-only order management webapp for a car dealership in Batna, Algeria, importing
Chinese cars (Geely, Changan, Livan, MG). Replaces the Excel workbook: clients,
inventory, orders, payments, and a live dashboard — with no double-selling.

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS
- Neon Postgres via Drizzle ORM (`@neondatabase/serverless`)
- Auth.js v5 (Credentials, invite-only — no public signup)
- Recharts

All money is DZD, stored as integer dinars. Dates display as DD/MM/YYYY.

## Setup

_Sections below are completed as the app is built (Phase 6 finalizes them)._

### 1. Create the Neon project

TODO: create a project at neon.tech, copy the **pooled** connection string.

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

- `DATABASE_URL` — the Neon pooled connection string
- `AUTH_SECRET` — generate with `npx auth secret`

Never commit `.env.local`.

### 3. Database

```bash
npm run db:migrate   # apply migrations
npm run db:seed      # load demo data (rows flagged "EXAMPLE")
```

### 4. Staff accounts (invite-only)

```bash
npm run create-user -- email password
```

There is no signup page; this script is the only way to create accounts.

### 5. Deploy to Vercel

TODO: import the GitHub repo in Vercel, set `DATABASE_URL` and `AUTH_SECRET`,
deploy to the free `.vercel.app` subdomain.

## Development

```bash
npm install
npm run dev
```
