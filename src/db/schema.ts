import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const carLocation = pgEnum("car_location", [
  "china_warehouse",
  "in_transit",
  "algeria_arrived",
]);

export const paymentMethod = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "cheque",
  "card",
]);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  city: text("city"),
  notes: text("notes"),
});

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  name: text("name").unique().notNull(),
});

export const models = pgTable(
  "models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    brandId: uuid("brand_id")
      .references(() => brands.id, { onDelete: "restrict" })
      .notNull(),
    name: text("name").notNull(),
  },
  (table) => [unique("models_brand_id_name_unique").on(table.brandId, table.name)]
);

export const colors = pgTable("colors", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  name: text("name").unique().notNull(),
});

export const cars = pgTable("cars", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  code: text("code").unique().notNull(),
  brandId: uuid("brand_id")
    .references(() => brands.id, { onDelete: "restrict" })
    .notNull(),
  modelId: uuid("model_id")
    .references(() => models.id, { onDelete: "restrict" })
    .notNull(),
  year: integer("year").notNull(),
  colorId: uuid("color_id")
    .references(() => colors.id, { onDelete: "restrict" })
    .notNull(),
  vin: text("vin"),
  // China purchase price, without fees
  wholesalePriceDzd: bigint("wholesale_price_dzd", { mode: "number" }).notNull(),
  // Freight + customs
  importFeesDzd: bigint("import_fees_dzd", { mode: "number" }).notNull().default(0),
  listPriceDzd: bigint("list_price_dzd", { mode: "number" }).notNull(),
  location: carLocation("location").notNull().default("china_warehouse"),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    code: text("code").unique().notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "restrict" })
      .notNull(),
    carId: uuid("car_id")
      .references(() => cars.id, { onDelete: "restrict" })
      .notNull(),
    orderDate: date("order_date").notNull(),
    discountDzd: bigint("discount_dzd", { mode: "number" }).notNull().default(0),
    extrasDzd: bigint("extras_dzd", { mode: "number" }).notNull().default(0),
    status: orderStatus("status").notNull().default("pending"),
    // Carrier reference shared with the client
    trackingNo: text("tracking_no"),
    notes: text("notes"),
  },
  (table) => [
    // No double-selling: a car may appear on at most one non-cancelled order.
    uniqueIndex("one_active_order_per_car")
      .on(table.carId)
      .where(sql`status <> 'cancelled'`),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    code: text("code").unique().notNull(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "restrict" })
      .notNull(),
    paidOn: date("paid_on").notNull(),
    amountDzd: bigint("amount_dzd", { mode: "number" }).notNull(),
    method: paymentMethod("method").notNull(),
    notes: text("notes"),
  },
  (table) => [check("payments_amount_dzd_positive", sql`${table.amountDzd} > 0`)]
);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
});
