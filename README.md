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
- **Documents** — printable invoice, payment receipt, and vehicle sale
  contract, in French (see below).
- **Settings** — `/settings` edits the company identity (RC/NIF/NIS/ART,
  RIB, capital…) used on all documents, so the owner never touches the
  database.
- **Customer order tracking** — a public, link-only page in French where a
  client can follow their order, plus one-tap WhatsApp sharing for staff
  (see below).

## Documents (invoice, receipt, contract)

Documents are printable, print-optimized A4 pages in **French** (the app UI
stays English). Open the document and use the browser's **Print → Save as
PDF** — there is no PDF library or headless browser involved. When printed,
the navigation and buttons are hidden and the page prints to clean A4
margins.

Routes (all staff-only):

- `/orders/[id]/invoice` — **Facture**. Company header, client (with ID card
  when present), vehicle line, totals, the total amount spelled out in French
  words, and the payment summary (total / versé / reste à payer).
- `/payments/[id]/receipt` — **Reçu de paiement**. Amount in figures and
  words, method, and the order balance remaining after that payment.
- `/orders/[id]/contract` — **Contrat de vente de véhicule**. Numbered
  articles (objet, prix, modalités de paiement, livraison, transfert de
  propriété, garantie, litiges) with signature blocks.

Open the invoice/contract from the order page ("Issue invoice / Print",
"Issue contract / Print"); open a receipt from the payments table or the
order's payment list.

### Document numbering

Invoice and contract numbers are assigned **when the document is first
issued**, not at order creation, and are **sequential per calendar year**:

- Invoices: `FAC-2026-0001`, `FAC-2026-0002`, …
- Contracts: `CTR-2026-0001`, …

Assignment runs through a Postgres function (`issue_document_number`) called
from a server action. It takes a transaction-scoped advisory lock on
`(prefix, year)` and computes `max + 1`, so two documents issued at the same
moment can never collide; the `invoice_number` / `contract_number` unique
constraints are a final backstop. The function is **idempotent** — issuing an
already-numbered document returns the existing number and never renumbers.

### Contract blockers

A contract cannot be issued (a clear French message is shown instead, and no
number is assigned) when:

- the client has **no ID card number**, or
- the **company settings** still contain the `À COMPLÉTER` placeholder values.

Fill the client's legal fields (Clients → edit → *Legal documents*) and the
company identity (`/settings`) first.

> **Not legal advice.** The contract template is a convenience document for a
> prototype. Its warranty and jurisdiction articles are left as `À DÉFINIR`
> placeholders, and every page prints the reminder to have the document
> reviewed by a legal professional before signing. Have all generated
> documents checked by qualified counsel before use.

## Customer order tracking (public)

The only customer-facing surface. Each order has a random, unguessable
`tracking_token`, and the public page lives at:

```
/suivi/<token>
```

It is a French, mobile-first page showing the dealership name/phone, the
vehicle, the order reference and date, a status timeline
(En attente → Confirmée → Expédiée → Livrée, with a distinct Annulée state),
the carrier tracking number, and the payment summary (total / versé /
reste à payer) — plus a "Contactez-nous" WhatsApp button.

Staff share it from the order page ("Envoyer le suivi (WhatsApp)") and per
payment ("Envoyer le reçu (WhatsApp)"). WhatsApp messages only ever link to
`/suivi/<token>` — never to the staff-only invoice/receipt routes.

### Security model

The token **is** the credential — possessing the link grants read access to
that one order, which is why it can be sent over WhatsApp without the client
logging in. The guarantees:

- **No anon table access.** Every table stays RLS `authenticated`-only, and
  the `anon` role's default table grants were revoked — a direct anon
  `select` on any table is denied.
- **One whitelisted read path.** Public reads go through a single
  `security definer` function, `get_tracking(p_token)` (owned by `postgres`,
  `search_path` pinned, `execute` granted to `anon`). It returns only
  customer-safe fields — order code/date/status, carrier tracking number,
  brand/model/year/color, client **first name only**, and total/paid/balance,
  plus the dealership name/phone/city. It never returns wholesale/import/
  landed cost, margin, VIN, or client contact/ID details.
- **No enumeration.** Order codes (`ORD-001`) are never part of the URL. An
  unknown, malformed, or too-short token returns nothing and the page shows a
  neutral "Lien invalide ou expiré" — it never reveals whether an order
  exists. Tracking pages are `noindex` (meta + `X-Robots-Tag`) so links don't
  reach search engines.
- **Revocation & kill switch.** "Revoke link" rotates the token
  (`regenerate_tracking_token`, authenticated only) so a leaked link dies and
  a new one is issued. "Disable tracking" flips `orders.tracking_enabled` to
  false, after which the function returns nothing for that order — killing a
  leaked link without deleting the order. The order page shows a
  **Tracking active / Tracking disabled** indicator.

> Treat tracking links as **semi-private**: anyone with the link can view that
> order's tracking page. Share them directly with the client (e.g. WhatsApp),
> not in public places, and revoke if a link is exposed.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in from your Supabase
project (Project Settings → API):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` — public base URL (no trailing slash) used to build
  absolute `/suivi/<token>` links for WhatsApp, e.g.
  `https://kadexautodz.vercel.app` or a custom domain. On Vercel it falls
  back to `VERCEL_URL` automatically, but set this to your stable production
  domain so shared links don't change between deployments.

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
