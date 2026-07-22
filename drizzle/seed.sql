-- Plain-SQL equivalent of src/db/seed.ts, for running the seed outside the app
-- (e.g. Neon SQL Editor or psql). Run after 0000_high_praxagora.sql.
-- Idempotent: every insert is ON CONFLICT DO NOTHING. Demo rows are flagged
-- with notes = 'EXAMPLE'.

INSERT INTO "brands" ("name") VALUES
  ('Geely'),
  ('Changan'),
  ('Livan'),
  ('MG')
ON CONFLICT DO NOTHING;

INSERT INTO "models" ("brand_id", "name")
SELECT b."id", v."name"
FROM (VALUES
  ('Geely', 'GX3 Pro'),
  ('Geely', 'Coolray'),
  ('Geely', 'Cityray'),
  ('Geely', 'Emgrand'),
  ('Geely', 'Starray'),
  ('Geely', 'Monjaro'),
  ('Changan', 'Alsvin'),
  ('Changan', 'Eado Plus'),
  ('Changan', 'CS35 Plus'),
  ('Changan', 'X5 Plus'),
  ('Changan', 'CS55 Plus'),
  ('Changan', 'CS75 Pro'),
  ('Changan', 'UNI-T'),
  ('Changan', 'UNI-V'),
  ('Livan', 'X3 Pro'),
  ('Livan', 'X6 Pro'),
  ('Livan', '7'),
  ('MG', 'MG3'),
  ('MG', 'MG4'),
  ('MG', 'MG5'),
  ('MG', 'ZS'),
  ('MG', 'HS'),
  ('MG', 'RX5'),
  ('MG', 'GT')
) AS v("brand", "name")
JOIN "brands" b ON b."name" = v."brand"
ON CONFLICT DO NOTHING;

INSERT INTO "colors" ("name") VALUES
  ('White'),
  ('Black'),
  ('Grey'),
  ('Light Grey'),
  ('Silver'),
  ('Red'),
  ('Blue'),
  ('Golden'),
  ('Green'),
  ('Beige')
ON CONFLICT DO NOTHING;

INSERT INTO "clients" ("code", "name", "city", "notes") VALUES
  ('C001', 'Amine Boudiaf', 'Batna', 'EXAMPLE'),
  ('C002', 'Sara Khelifi', 'Sétif', 'EXAMPLE'),
  ('C003', 'Yacine Merah', 'Constantine', 'EXAMPLE')
ON CONFLICT DO NOTHING;

INSERT INTO "cars"
  ("code", "brand_id", "model_id", "year", "color_id",
   "wholesale_price_dzd", "import_fees_dzd", "list_price_dzd", "location")
SELECT
  v."code", b."id", m."id", v."year", c."id",
  v."wholesale_price_dzd", v."import_fees_dzd", v."list_price_dzd",
  v."location"::"public"."car_location"
FROM (VALUES
  ('V001', 'Geely', 'Coolray', 2026, 'White', 2450000, 620000, 3650000, 'in_transit'),
  ('V002', 'Changan', 'CS35 Plus', 2026, 'Grey', 2300000, 580000, 3400000, 'china_warehouse'),
  ('V003', 'Livan', 'X3 Pro', 2025, 'Red', 1650000, 450000, 2500000, 'algeria_arrived'),
  ('V004', 'MG', 'ZS', 2026, 'Black', 2200000, 560000, 3300000, 'china_warehouse'),
  ('V005', 'MG', 'MG5', 2026, 'Blue', 2050000, 540000, 3100000, 'algeria_arrived')
) AS v("code", "brand", "model", "year", "color",
       "wholesale_price_dzd", "import_fees_dzd", "list_price_dzd", "location")
JOIN "brands" b ON b."name" = v."brand"
JOIN "models" m ON m."brand_id" = b."id" AND m."name" = v."model"
JOIN "colors" c ON c."name" = v."color"
ON CONFLICT DO NOTHING;

INSERT INTO "orders"
  ("code", "client_id", "car_id", "order_date",
   "discount_dzd", "extras_dzd", "status", "tracking_no", "notes")
SELECT
  v."code", cl."id", ca."id", v."order_date"::date,
  v."discount_dzd", v."extras_dzd",
  v."status"::"public"."order_status", v."tracking_no", 'EXAMPLE'
FROM (VALUES
  ('ORD-001', 'C001', 'V003', '2026-05-12', 100000, 25000, 'delivered', 'COSU6321845790'),
  ('ORD-002', 'C002', 'V001', '2026-06-03', 0, 0, 'shipped', 'MSKU7745120368'),
  ('ORD-003', 'C003', 'V004', '2026-07-10', 200000, 60000, 'pending', NULL)
) AS v("code", "client_code", "car_code", "order_date",
       "discount_dzd", "extras_dzd", "status", "tracking_no")
JOIN "clients" cl ON cl."code" = v."client_code"
JOIN "cars" ca ON ca."code" = v."car_code"
ON CONFLICT DO NOTHING;

INSERT INTO "payments"
  ("code", "order_id", "paid_on", "amount_dzd", "method", "notes")
SELECT
  v."code", o."id", v."paid_on"::date, v."amount_dzd",
  v."method"::"public"."payment_method", 'EXAMPLE'
FROM (VALUES
  ('PAY-001', 'ORD-001', '2026-05-12', 2425000, 'bank_transfer'),
  ('PAY-002', 'ORD-002', '2026-06-03', 1500000, 'cash'),
  ('PAY-003', 'ORD-003', '2026-07-10', 1200000, 'cheque')
) AS v("code", "order_code", "paid_on", "amount_dzd", "method")
JOIN "orders" o ON o."code" = v."order_code"
ON CONFLICT DO NOTHING;
