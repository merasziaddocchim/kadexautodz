# KadexAuto DZ — Order Management

Staff-only order management webapp for a car dealership in Batna, Algeria, importing
Chinese cars (Geely, Changan, Livan, MG). Replaces the Excel workbook: clients,
inventory, orders, payments, and a live dashboard — with no double-selling.

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS
- Supabase (Postgres + Auth) via `@supabase/supabase-js` and `@supabase/ssr`
- Recharts

All money is DZD and always integer (bigint) — never floats. Orders, payments
and inventory are stored as **whole dinars**; transit documents, which need
centimes, are stored as **bigint centimes** (`78 275,50` → `7827550`).
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
- **Documents** — printable invoice, payment receipt, vehicle sale contract,
  and transit invoice, in French (see below).
- **Settings** — `/settings` edits the company identity (RC/NIF/NIS/ART,
  RIB, capital…) used on all documents, so the owner never touches the
  database.
- **Customer order tracking** — a public, link-only page in French where a
  client can follow their order, plus one-tap WhatsApp sharing for staff
  (see below).

## Documents (invoice, receipt, contract, facture transit)

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
- `/orders/[id]/facture-transit` — **Facture Transit**. The customs/transit
  cost breakdown, reproducing the owners' own template (see below).

Open the invoice/contract from the order page ("Issue invoice / Print",
"Issue contract / Print"); open a receipt from the payments table or the
order's payment list. The transit invoice is typed up first — see below.

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

Transit invoices keep the owners' own paper format, `NNN/YY`, and have their
own function (`issue_transit_number`) with the same guarantees — advisory
lock, idempotent, assigned on issue. Their series continues from the paper
book, so the first one issued in 2026 is **`611/26`**. The counter is **per
year**: January 2027 restarts at `001/27`.

### Facture Transit

A fourth document type, separate from the sale invoice: the breakdown of
customs and transit costs for one order. It reproduces the owners' existing
template, so both its wording and its arithmetic follow their paper document
rather than the app's other invoices.

**Staff type the cost lines in the dashboard.** From the order page, click
**Facture Transit** — this opens `/orders/[id]/transit`, the entry form. It
has the **16 fixed lines** (Quittance TVN, Ouverture de dossier, Programation
visite, …, Timbre 1%), each with a **Debours**, a **Transit** and an
**Observations** field, plus the weight, the number of packages and the
advance already received. Totals update as you type. **Save, issue & print**
assigns the number and opens the printable document.

The labels are fixed and cannot be edited — only the amounts. They are stored
in the database and duplicated in `src/lib/transitLines.ts`
(`TRANSIT_LINE_TEMPLATE`); the two lists are deliberately **verbatim copies of
the owners' spelling** (including "Programation visite" and "Frais Depassement
Main levee") and must be changed together.

Amounts are **bigint centimes**, not whole dinars — transit costs carry
centimes (`78 275,50`). Type them the French way, with a comma; blank means
blank, and prints as an empty cell rather than `0,00`.

The arithmetic:

```
Total Partiel = debours + transit
TVA 9%        = 9% of the TRANSIT column only   (debours are not taxed)
TOTAL NET     = Total Partiel + TVA − somme avancée
```

`TOTAL NET` **can be negative** when the advance exceeds the costs — that is
normal, and the document then prints the amount in words followed by
**"(en faveur du client)"**.

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
(integer dinars, or integer centimes on the transit tables). A partial unique
index, `orders(car_id) where status <> 'cancelled'`, guarantees no
double-selling.

The transit invoice adds two tables: `transit_invoices` (one per order, with
the header fields and the advance received) and `transit_invoice_lines` (its
16 lines). Creating a `transit_invoices` row fires a trigger that seeds the 16
fixed lines, so a draft always starts complete and in the right order.

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
