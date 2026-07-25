# Kadex Auto DZ — Technical Checkpoint

Verified against the repository at commit `975570f` and the live Supabase
schema on 2026-07-25. Every schema statement below was read from the database
through the Supabase connector, not from documentation. Items that could not be
confirmed from the repo or the database are marked **[unverified]**.

---

## 1. Project overview

**Kadex Auto DZ** is a staff-only order management web application for a car
dealership in Batna, Algeria that imports Chinese vehicles (Geely, Changan,
Livan, MG). It replaces an Excel workbook with clients, inventory, orders,
payments, a live dashboard, printable French business documents, and a public
order-tracking page for customers.

**Who uses it**

- **Staff** (invite-only accounts) — the entire application. UI is English.
- **Customers** — one page only, `/suivi/<token>`, in French. No login.

**Current status: demo, not production.**

- The database holds seed/demo data: 3 clients, 4 brands, 24 models, 10 colors,
  5 cars, 4 orders, 3 payments.
- `company_settings` holds placeholder legal identity — RC, NIF, NIS, ART, bank
  and RIB all carry a literal `DEMO` marker.
- `transit_invoices` and `transit_invoice_lines` are **empty**. Transit
  numbering opens at `611/26`.
- Two test transit invoices (`611/26`, `612/26`) were created during
  development and have been removed; the series was reset so the first real
  document takes `611/26`.
- There are **no automated tests** in the repository.

---

## 2. Architecture

| Layer | Technology | Version | Role |
|---|---|---|---|
| Framework | Next.js (App Router) | `16.2.11` | Routing, server components, server actions |
| UI runtime | React / React DOM | `19.2.4` | Rendering |
| Language | TypeScript | `5.9.3` | Whole codebase |
| Styling | Tailwind CSS | `4.3.3` | All styling, including print CSS |
| PostCSS | `@tailwindcss/postcss` | `^4` | Tailwind 4 build pipeline |
| Database & Auth | Supabase (Postgres) | Postgres 17 | Data, RLS, auth, RPC |
| DB client | `@supabase/supabase-js` | `2.110.8` (declared `^2.60.0`) | Queries and RPC |
| SSR auth | `@supabase/ssr` | `0.8.0` | Cookie-based session in server components and the auth proxy |
| Charts | Recharts | `3.10.0` | Dashboard charts |
| Hosting | Vercel | — | Production deploys from `main` |

Six runtime dependencies, six dev dependencies. No ORM, no PDF library, no UI
component library, no test framework.

### Build constraint

`npm run build` must pass **with no environment variables set**. Both Supabase
clients read configuration lazily at call time, and the auth proxy returns early
when env is absent. This is verified on every change.

### Explicitly rejected

| Rejected | Evidence | Why |
|---|---|---|
| **Neon** (`@neondatabase/serverless`) | Adopted in `d074b5e`, removed in `fdc1d2a` | Replaced by Supabase, which supplies auth and RLS in the same service |
| **Drizzle ORM / drizzle-kit** | Adopted in `d074b5e`, schema in `7cd23e5`, removed in `fdc1d2a` | Schema moved into Supabase and is managed with SQL migrations; an ORM layer added indirection without benefit |
| **Auth.js / next-auth** (`next-auth@beta`) | Locked in `d074b5e`, removed in `fdc1d2a` | Supabase Auth already provides email/password with RLS integration; a second auth system would need its own user table and session handling |
| **PDF libraries / headless browsers** | None ever present in `package.json` | Documents are print-optimized A4 HTML routes; staff use the browser's Print → Save as PDF. No rendering service, no binary dependency, and the printed output is exactly what is on screen |
| **Prisma** | **[unverified]** — never appears in `package.json` or any commit | No repository evidence that Prisma was evaluated. Recorded here because it was named as rejected, but it cannot be confirmed from history |

The reason recorded for the Neon → Supabase switch in commit `fdc1d2a` is only
"wipe Neon-era code". **[unverified]** The stated operational driver — that the
development sandbox cannot reach the database directly, so all schema work must
go through the Supabase connector — is a working constraint of the project and
is not documented in the commit history.

---

## 3. Feature inventory

### V1 — Management (`d074b5e` → `7223471`)

| Feature | Routes | Tables |
|---|---|---|
| Dashboard — KPI cards, orders/month, revenue/month, status charts | `/` | all |
| Orders — searchable list, create/edit, forward-only status, cancel, per-order payments | `/orders`, `/orders/new`, `/orders/[id]`, `/orders/[id]/edit` | `orders`, `clients`, `cars`, `payments` |
| Inventory — landed cost, margin, location and availability badges | `/inventory`, `/inventory/new`, `/inventory/[id]/edit` | `cars`, `brands`, `models`, `colors` |
| Clients — orders count, total spent, legal fields | `/clients`, `/clients/new`, `/clients/[id]/edit` | `clients` |
| Payments — balance-aware picker, overpayment warning | `/payments`, `/payments/new` | `payments`, `orders` |
| Auth — email/password, no signup | `/login` | Supabase Auth |

### V2 — Documents (`b63b76c` → `7c9b046`)

| Document | Route | Function |
|---|---|---|
| Facture (sale invoice) | `/orders/[id]/invoice` | `issue_document_number(order, 'invoice')` |
| Reçu de paiement | `/payments/[id]/receipt` | — (no number of its own) |
| Contrat de vente | `/orders/[id]/contract` | `issue_document_number(order, 'contract')` |
| Company settings | `/settings` | — |

All documents are French, print-optimized A4, staff-only.

### V3 — Tracking & WhatsApp (`26cce56` → `fefccff`)

| Feature | Route | Function |
|---|---|---|
| Public order tracking | `/suivi/[token]` | `get_tracking(token)` — **SECURITY DEFINER** |
| Revoke link | — | `regenerate_tracking_token(order)` |
| Disable tracking (kill switch) | — | `orders.tracking_enabled` |
| WhatsApp share (order + per payment) | order page | — |

### Facture Transit (`c58e8dc` → `975570f`)

| Piece | Route / file | Tables & functions |
|---|---|---|
| Staff entry form (16 lines) | `/orders/[id]/transit` | `transit_invoices`, `transit_invoice_lines` |
| Printable document | `/orders/[id]/facture-transit` | — |
| Issue | server action | `issue_transit_number(order)` |
| Line seeding | trigger | `seed_transit_invoice_lines()` |
| Fiscal immutability | triggers | `guard_transit_invoice()`, `guard_transit_invoice_line()`, `transit_is_admin()` |

Helpers: `src/lib/money.ts` (centimes, French format, parsing, ceilings),
`src/lib/transitLines.ts` (16 verbatim labels, `computeTransitTotals`),
`src/lib/numberToFrenchWords.ts` (`montantCentimesEnLettresDZD`).

---

## 4. Database schema

10 tables, 3 enums, 8 functions, 3 triggers. Every table has RLS enabled with a
single `authenticated_all` policy: `FOR ALL TO authenticated USING (true) WITH
CHECK (true)`. The `anon` role holds **no table grants anywhere**.

### Enums

```
car_location    china_warehouse | in_transit | algeria_arrived
order_status    pending | confirmed | shipped | delivered | cancelled
payment_method  cash | bank_transfer | cheque | card
```

### Catalog tables

**`brands`** — `id` uuid PK, `created_at` timestamptz, `name` text UNIQUE
**`colors`** — `id` uuid PK, `created_at` timestamptz, `name` text UNIQUE
**`models`** — `id` uuid PK, `created_at` timestamptz, `brand_id` uuid FK→brands, `name` text
  · UNIQUE `(brand_id, name)` · INDEX `brand_id`

### `clients`

`id` uuid PK · `created_at` timestamptz · `code` text UNIQUE · `name` text ·
`phone` · `email` · `city` · `notes` · `id_card_number` · `id_card_issued_at`
date · `id_card_issued_by` · `birth_date` date · `birth_place` · `address`
(all legal fields nullable)

### `cars`

`id` uuid PK · `created_at` · `code` text UNIQUE · `brand_id` FK · `model_id` FK
· `color_id` FK · `year` int · `vin` text NULL ·
`wholesale_price_dzd` **bigint** · `import_fees_dzd` **bigint** default 0 ·
`list_price_dzd` **bigint** · `location` `car_location` default
`china_warehouse`
· INDEX on `brand_id`, `model_id`, `color_id`

### `orders`

`id` uuid PK · `created_at` · `code` text UNIQUE · `client_id` FK · `car_id` FK
· `order_date` date · `discount_dzd` **bigint** default 0 · `extras_dzd`
**bigint** default 0 · `status` `order_status` default `pending` ·
`tracking_no` text NULL · `notes` text NULL · `invoice_number` text UNIQUE NULL
· `invoice_issued_on` date NULL · `contract_number` text UNIQUE NULL ·
`contract_signed_on` date NULL · `tracking_token` text UNIQUE default
`encode(gen_random_bytes(16),'hex')` · `tracking_enabled` bool default true

**No-double-sell index:**

```sql
CREATE UNIQUE INDEX one_active_order_per_car
  ON public.orders (car_id) WHERE (status <> 'cancelled');
```

### `payments`

`id` uuid PK · `created_at` · `code` text UNIQUE · `order_id` FK→orders
(**ON DELETE RESTRICT**) · `paid_on` date · `amount_dzd` **bigint**
CHECK `> 0` · `method` `payment_method` · `notes` text NULL

### `company_settings`

Singleton, enforced by `singleton` bool UNIQUE with CHECK `singleton`.
`name` · `legal_form` · `address` · `city` · `phone` · `email` · `rc` · `nif` ·
`nis` · `art` · `bank_name` · `rib` (all text NULL) · `capital_dzd` bigint NULL

### `transit_invoices`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `created_at` | timestamptz | default `now()` |
| `order_id` | uuid **UNIQUE** | FK→orders **ON DELETE RESTRICT** — one per order |
| `number` | text UNIQUE NULL | CHECK `number ~ '^\d{3,}/\d{2}$'` |
| `issued_on` | date NULL | |
| `issued_at` | timestamptz NULL | set when the number is assigned |
| `place` | text | default `'ALGER'` |
| `invoice_date` | date | default `CURRENT_DATE` |
| `designation` | text | default `'VHL'` |
| `poids_kg` | integer NULL | CHECK `>= 0` |
| `nombre` | text NULL | e.g. `01 Colis` |
| `somme_avancee_centimes` | **bigint** | default 0, CHECK `>= 0` |

### `transit_invoice_lines`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `transit_invoice_id` | uuid | FK→transit_invoices **ON DELETE CASCADE** |
| `position` | smallint | CHECK between 1 and 16 |
| `label` | text | one of the 16 fixed labels |
| `debours_centimes` | **bigint** NULL | CHECK `>= 0`; NULL prints blank |
| `transit_centimes` | **bigint** NULL | CHECK `>= 0`; NULL prints blank |
| `observations` | text NULL | |

UNIQUE `(transit_invoice_id, position)`.

The 16 labels are seeded by trigger and kept **verbatim** from the owners'
paper template, including their spelling:

```
 1 Quittance TVN                  9 Frais Depassement Main levee
 2 Ouverture de dossier          10 Frais chèque
 3 Programation visite           11 Frais surestaries
 4 Frais de visite               12 Commission de transit :
 5 Frais d'expertise             13 Frais de Transport
 6 Droit & Taxes                 14 Echange
 7 Frais restitution TC Vide     15 Frais de dépotage
 8 Frais Magasinage              16 Timbre 1%
```

They are duplicated in `src/lib/transitLines.ts` (`TRANSIT_LINE_TEMPLATE`) and
**must be changed together**.

### Functions

| Function | Returns | SECURITY | search_path | EXECUTE granted to |
|---|---|---|---|---|
| `get_tracking(p_token text)` | TABLE (15 cols) | **DEFINER** | `''` | anon, authenticated, service_role |
| `issue_document_number(p_order_id uuid, p_doc_type text)` | text | INVOKER | `public, pg_temp` | authenticated, service_role, **anon, PUBLIC** |
| `issue_transit_number(p_order_id uuid)` | text | INVOKER | `public, pg_temp` | authenticated, service_role |
| `regenerate_tracking_token(p_order_id uuid)` | text | INVOKER | `''` | authenticated, service_role |
| `transit_is_admin()` | boolean | INVOKER | `public, pg_temp` | authenticated, service_role, PUBLIC |
| `seed_transit_invoice_lines()` | trigger | INVOKER | `public, pg_temp` | authenticated, service_role |
| `guard_transit_invoice()` | trigger | INVOKER | `public, pg_temp` | authenticated, service_role |
| `guard_transit_invoice_line()` | trigger | INVOKER | `public, pg_temp` | authenticated, service_role |

All are owned by `postgres`.

**Only `get_tracking` is SECURITY DEFINER**, and deliberately so: it is the one
whitelisted read path for the unauthenticated public tracking page. It runs as
its owner so it can read tables that `anon` has no grants on, with
`search_path` pinned to `''` (every reference fully qualified) so no schema
shadowing can redirect it. It returns only customer-safe columns — order code,
date, status, carrier tracking number, brand/model/year/colour, **client first
name only** (`split_part(name,' ',1)`), total/paid/balance, and dealership
name/phone/city. It never returns wholesale price, import fees, margin, VIN, or
client contact or identity details. It refuses any token shorter than 32
characters before running a query, and returns nothing when
`tracking_enabled = false`.

Everything else is SECURITY INVOKER, so RLS still applies to the caller.

### Triggers

| Table | Trigger | Timing | Events | Function |
|---|---|---|---|---|
| `transit_invoices` | `transit_invoices_seed_lines` | AFTER | INSERT | `seed_transit_invoice_lines` |
| `transit_invoices` | `transit_invoices_guard` | BEFORE | UPDATE, DELETE | `guard_transit_invoice` |
| `transit_invoice_lines` | `transit_invoice_lines_guard` | BEFORE | UPDATE, DELETE | `guard_transit_invoice_line` |

---

## 5. Technical decisions and rationale

**ID · Name labels everywhere.** Records are shown as `C001 · Hmani`,
`ORD-003`, `V002`. Human-readable codes are stable business identifiers staff
already use on paper; UUIDs stay internal and never appear in the UI or in a
customer-facing URL.

**Location separate from availability.** `cars.location` is a stored enum
(`china_warehouse`, `in_transit`, `algeria_arrived`) describing where the
vehicle physically is. Availability (`available` / `reserved` / `sold`) is
**derived** from the car's orders by `carAvailability()` in
`src/lib/types.ts`. They answer different questions and drift apart if both are
stored: a car can be in the China warehouse and already reserved.

**Money as integer dinars (bigint), never floats.** Orders, payments and
inventory hold whole DZD. Floating point cannot represent decimal currency
exactly, and a dealership's amounts (1 250 000 DZD) exceed what a 32-bit
integer holds safely.

**Transit money as bigint centimes.** Transit documents carry centimes
(`78 275,50`), so those columns store dinars × 100 — still integers. This is
the one place the two units meet, which is why the column names end in
`_centimes` and the README states the distinction explicitly.

**No-double-sell as a partial unique index.** `UNIQUE (car_id) WHERE status <>
'cancelled'` puts the rule in the database, so it holds under concurrency and
regardless of which code path inserts the order. Application-level checks
race; this cannot.

**Neon → Supabase.** The project began on Neon + Drizzle + next-auth
(`d074b5e`, `7cd23e5`) and was wiped to a Supabase scaffold in `fdc1d2a`.
Supabase supplies Postgres, auth and row-level security as one service,
removing the need for a separate auth system and its user tables.
**[unverified]** the operational reason recorded outside the repo — that the
development environment cannot reach the database directly, making the Supabase
connector the only schema path.

**Documents as print routes, not generated PDFs.** Each document is a normal
server-rendered page with A4 print CSS; staff print to PDF from the browser.
No PDF dependency, no headless browser, no rendering service to operate, and
what prints is exactly what was reviewed on screen.

**French documents, English UI.** Every customer-facing artefact — invoice,
receipt, contract, transit invoice, tracking page — is French, because that is
what clients and Algerian administration read. The staff interface is English.
The split is deliberate and consistent.

**Per-order tracking tokens.** Each order carries a random 16-byte hex
`tracking_token` with a UNIQUE index, generated by default on insert. The token
*is* the credential, which is what allows a link to be sent over WhatsApp with
no customer login. Order codes never appear in the URL, so the space cannot be
enumerated.

**Document numbering, assigned on issue.** Numbers are allocated when a
document is first issued, never at record creation, so no gaps appear for
records that never produce a document.

| Document | Format | Reset |
|---|---|---|
| Invoice | `FAC-2026-0001` | per calendar year |
| Contract | `CTR-2026-0001` | per calendar year |
| Transit | `611/26` | per calendar year (`001/27` in January 2027) |

All allocation runs inside a Postgres function holding a transaction-scoped
advisory lock on `(prefix, year)` and computing `max + 1`, with UNIQUE
constraints as a final backstop. All are **idempotent**: issuing an
already-numbered document returns the existing number and never renumbers.
Transit numbering continues the owners' paper series, so 2026 starts at `611`
via a floor of 610.

**Fiscal immutability for transit invoices.** Once a transit invoice carries a
number it is a fiscal document. Staff cannot change it, delete it, delete its
lines, alter its number, or delete the order beneath it. Line labels are frozen
at all times, issued or not. Full detail in §6.

**Amount parsing rejects rather than defaults.** `parseCentimes` returns `null`
for anything that is not a plain amount. It previously returned `0`, so
`"12000 DZD"`, `"1,234,56"`, `"78,275.50"`, `"abc"` and `"1e3"` all became
`0,00` silently on a numbered document. Two ceilings back it up: `100 000
000,00` per individual amount, and `999 999 999,00` per total — the latter is
exactly where `montantCentimesEnLettresDZD` stops being able to spell an
amount, past which the document would print a blank amount in words.

**TVA 9% on the transit column only.** Debours are outlays advanced on the
client's behalf and are not taxed. `TOTAL NET = Total Partiel + TVA − somme
avancée` and may be negative, in which case the document prints the amount in
words followed by `(en faveur du client)`.

---

## 6. Security model

**RLS on every table, authenticated only.** All 10 tables have RLS enabled with
a single `authenticated_all` policy. Every staff member has full access to
every row; there is no per-user partitioning, which matches a single-dealership
staff tool.

**`anon` has no table grants.** Verified live: as `anon`, `SELECT` on
`transit_invoices` and `transit_invoice_lines` both return `permission denied
for table`. The same holds across the schema — `anon` appears in no table grant.

**One whitelisted public read path.** `get_tracking` is the only SECURITY
DEFINER function. See §4 for what it returns and the guards it applies. The
tracking route is excluded from the auth proxy in `src/proxy.ts` and is served
`X-Robots-Tag: noindex, nofollow` from `next.config.ts`, plus `noindex` meta,
so links do not reach search engines.

**Token revocation and kill switch.** `regenerate_tracking_token` rotates a
leaked link's token; `orders.tracking_enabled = false` makes `get_tracking`
return nothing for that order without deleting anything.

**Customer links are never Vercel preview URLs.** `getSiteUrlInfo()`
distinguishes an explicit `NEXT_PUBLIC_SITE_URL` from a `VERCEL_URL` fallback.
Fallback URLs sit behind Vercel Deployment Protection and would ask the
customer to sign in to Vercel, so sharing is disabled with a stated reason
unless the base URL is explicit (`1018b74`).

**No service-role key in the application.** Verified: `service_role` appears
nowhere in `src/` or `.env.local.example`. The browser holds only the anon key,
which is safe to expose because RLS governs access.

**Auth in depth.** `src/proxy.ts` redirects unauthenticated requests to
`/login`; both the `(app)` and `(documents)` layouts independently re-check
`auth.getUser()` server-side; and RLS denies `anon` at the database. Three
layers, none of which relies on the others.

**Transit invoice immutability — how it holds.**

Two mechanisms, both in the database:

1. **Role boundary.** `transit_is_admin()` returns
   `pg_has_role(current_user, 'postgres', 'MEMBER')`. Verified live:
   `authenticated`, `anon` and `service_role` are all **not** members of
   `postgres`, and `authenticated` is not a superuser. The guards return early
   only for callers that pass this check — that is, direct database access
   (migrations, the connector). Nothing reachable from the application can
   satisfy it.
2. **Transaction-local flag.** A number may only be written while
   `app.issuing_transit` is `'on'`, which `issue_transit_number` sets with
   `set_config(..., true)` immediately before its own `UPDATE` and clears
   after. PostgREST does not expose `set_config` — it is in `pg_catalog`, not
   the exposed `public` schema — so no client can raise the flag itself.

Verified as `authenticated` against a scratch order, every one blocked:

| Attempt | Result |
|---|---|
| Edit amounts after issue | `… is issued and can no longer be modified` |
| Edit the advance after issue | blocked |
| Overwrite the issued number | blocked |
| Delete a line after issue | `… its lines cannot be deleted` |
| Delete the issued invoice | `… cannot be deleted` |
| Delete the order beneath it | FK `RESTRICT` violation |
| Rewrite a fixed label (any time) | `Transit line labels are fixed …` |
| Smuggle a label through the form's upsert | blocked |
| Stamp a number by hand | `… only be assigned by issue_transit_number()` |
| Move an invoice to another order | blocked |

Still permitted, as intended: creating a draft, editing draft amounts and
header, the 16-row upsert the form issues, discarding an unissued draft
(cascade leaves no orphan lines), and issuing.

`friendlyError` in `src/lib/errors.ts` maps each guard message to plain English
before it reaches staff, matched ahead of the generic `check_violation` rule so
an immutability error is never reported as "Amount must be greater than zero."

---

## 7. Commit history

17 commits, all on `main`.

| Commit | Date | Shipped |
|---|---|---|
| `d074b5e` | 07-22 | Phase 0 — scaffold Next.js + Tailwind + **Drizzle/Neon**, next-auth@beta locked |
| `7cd23e5` | 07-22 | Phase 1 — Drizzle schema, migration, seed, create-user script |
| `55a8a23` | 07-22 | Phase 1 — plain-SQL seed for running outside the app |
| `fdc1d2a` | 07-22 | Phase 0 — **wipe Neon-era code**, fresh Next.js + Supabase scaffold |
| `9eaf5ad` | 07-22 | Phase 2 — Supabase auth + all management screens |
| `7223471` | 07-22 | Phase 3 — dashboard KPIs + Recharts charts + deploy README |
| `b63b76c` | 07-23 | Phase 2 — invoice + receipt documents (French, A4) |
| `86f023d` | 07-23 | Phase 3 — vehicle sale contract |
| `7c9b046` | 07-23 | Phase 4 — settings screen + client legal fields |
| `26cce56` | 07-24 | Phase 2 — public tracking page `/suivi/[token]` |
| `3aadf52` | 07-24 | Phase 3 — staff WhatsApp sharing + link management |
| `fefccff` | 07-24 | Phase 4 — tracking status indicator + kill switch |
| `c58e8dc` | 07-25 | Facture Transit — money/words helpers, print template, design preview |
| `1018b74` | 07-25 | Fix — never send customers a Vercel-protected deployment link |
| `64359c7` | 07-25 | Facture Transit — staff entry form + printable route, `/apercu` retired |
| `754d2dd` | 07-25 | README — document the Facture Transit |
| `975570f` | 07-25 | Facture Transit — reject invalid amounts, freeze issued invoices |

Schema changes are **not** in the repository. They live in Supabase and were
applied as migrations `facture_transit_schema` and
`transit_fiscal_hardening`, plus the earlier V1–V3 schema.

---

## 8. Known open items

1. **Zero automated tests.** No test runner, no test files anywhere. Everything
   above — the arithmetic, the immutability guards, the parser — is verified by
   hand only. Nothing would catch a regression. This is the highest-value gap.
2. **TVA 9% encoded in three places**, and the canonical helper is dead:
   - `TVA_RATE_PERCENT` and `tvaOnTransit()` in `src/lib/money.ts` — **never
     called anywhere**
   - an inline `Math.round((transitTotal * 9) / 100)` in `computeTransitTotals`
     (`src/lib/transitLines.ts`)
   - a hardcoded `TVA {9}%` label in `src/components/documents/FactureTransit.tsx`

   A rate change will be applied inconsistently.
3. **Select-then-insert race in `openTransitInvoice`** (`src/lib/transitActions.ts`).
   No lock between the existence check and the insert; concurrent clicks race
   to a unique-violation on `transit_invoices.order_id`. Should be a single
   upsert with `ignoreDuplicates`.
4. **Sequential queries on the order page.** `src/app/(app)/orders/[id]/page.tsx`
   awaits the order query, then the transit-invoice lookup. They are
   independent and should share a `Promise.all`.
5. **`issue_document_number` is granted to `anon` and `PUBLIC`**, unlike
   `issue_transit_number` which revoked both. It is SECURITY INVOKER, so an
   `anon` caller fails at the first table access with permission denied — it is
   not exploitable — but it is an inconsistency and an unnecessary exposed RPC.
6. **`contractBlockers` does not catch demo legal identity.** It only treats the
   literal string `À COMPLÉTER` as missing. The current settings hold values
   like `RC 05B-DEMO-123456`, which pass the check, so a contract can be issued
   today carrying demo legal identity.
7. **No optimistic locking on the transit form.** Two staff editing one draft:
   last write wins silently.
8. Minor: transit numbering keys off `current_date` rather than
   `invoice_date`; the `busy` flag in the transit form can latch if issuing
   throws a non-redirect error.

---

## 9. Pre-production checklist

**Data**

- [ ] Replace `company_settings` — `name`, `legal_form`, `address`, `city`,
      `phone`, `email`, `rc`, `nif`, `nis`, `art`, `bank_name`, `rib`,
      `capital_dzd` all currently carry `DEMO` markers and appear on every
      printed document.
- [ ] Remove demo clients, cars, orders and payments. **One demo client holds a
      real-format Algerian phone number** that WhatsApp sharing would dial.
- [ ] Fill `id_card_number` for any client who needs a contract — 2 of 3 demo
      clients have none, which blocks contract issue by design.
- [ ] Confirm transit numbering still opens at the intended number once real
      data is loaded (currently `611/26`).

**Legal**

- [ ] Have a lawyer review the two `À DÉFINIR` clauses in
      `src/app/(documents)/orders/[id]/contract/page.tsx` — **warranty
      conditions** (line 340) and **competent jurisdiction for disputes**
      (line 347).
- [ ] Have counsel review the whole contract template; the page prints a
      reminder to do so, and the README states it is not legal advice.
- [ ] Confirm the transit invoice layout, the 16 labels and the 9% TVA
      treatment with the owners against their paper series.

**Engineering**

- [ ] Add a test runner and cover, at minimum: `computeTransitTotals` against
      the owners' model figures, the negative-net path, `parseCentimes`
      accept/reject cases, `toFrenchWords` French agreement rules, and
      `carAvailability`.
- [ ] Fix the TVA triplication (item 2) before any rate change.
- [ ] Fix the `openTransitInvoice` race (item 3).
- [ ] Tighten `contractBlockers` to reject demo/placeholder identity (item 6).
- [ ] Revoke `anon` and `PUBLIC` execute on `issue_document_number` (item 5).

**Operations**

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the stable production domain — without it
      customer WhatsApp links fall back to a protected Vercel URL and sharing
      is disabled.
- [ ] Create real staff accounts in Supabase (Authentication → Users); public
      signup is disabled and there is no signup page.
- [ ] Confirm public signups remain disabled in Supabase Auth.
- [ ] Consider enabling leaked-password protection — currently off, flagged by
      the Supabase security advisor.
- [ ] Establish a database backup and restore routine before real fiscal
      documents exist.
