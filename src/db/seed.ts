import { sql } from "drizzle-orm";
import { getDb } from "./index";
import {
  brands,
  cars,
  clients,
  colors,
  models,
  orders,
  payments,
  users,
} from "./schema";

const CATALOG: Record<string, string[]> = {
  Geely: ["GX3 Pro", "Coolray", "Cityray", "Emgrand", "Starray", "Monjaro"],
  Changan: [
    "Alsvin",
    "Eado Plus",
    "CS35 Plus",
    "X5 Plus",
    "CS55 Plus",
    "CS75 Pro",
    "UNI-T",
    "UNI-V",
  ],
  Livan: ["X3 Pro", "X6 Pro", "7"],
  MG: ["MG3", "MG4", "MG5", "ZS", "HS", "RX5", "GT"],
};

const COLORS = [
  "White",
  "Black",
  "Grey",
  "Light Grey",
  "Silver",
  "Red",
  "Blue",
  "Golden",
  "Green",
  "Beige",
];

const DEMO_CLIENTS = [
  { code: "C001", name: "Amine Boudiaf", city: "Batna" },
  { code: "C002", name: "Sara Khelifi", city: "Sétif" },
  { code: "C003", name: "Yacine Merah", city: "Constantine" },
];

const DEMO_CARS = [
  {
    code: "V001",
    brand: "Geely",
    model: "Coolray",
    year: 2026,
    color: "White",
    wholesalePriceDzd: 2_450_000,
    importFeesDzd: 620_000,
    listPriceDzd: 3_650_000,
    location: "in_transit" as const,
  },
  {
    code: "V002",
    brand: "Changan",
    model: "CS35 Plus",
    year: 2026,
    color: "Grey",
    wholesalePriceDzd: 2_300_000,
    importFeesDzd: 580_000,
    listPriceDzd: 3_400_000,
    location: "china_warehouse" as const,
  },
  {
    code: "V003",
    brand: "Livan",
    model: "X3 Pro",
    year: 2025,
    color: "Red",
    wholesalePriceDzd: 1_650_000,
    importFeesDzd: 450_000,
    listPriceDzd: 2_500_000,
    location: "algeria_arrived" as const,
  },
  {
    code: "V004",
    brand: "MG",
    model: "ZS",
    year: 2026,
    color: "Black",
    wholesalePriceDzd: 2_200_000,
    importFeesDzd: 560_000,
    listPriceDzd: 3_300_000,
    location: "china_warehouse" as const,
  },
  {
    code: "V005",
    brand: "MG",
    model: "MG5",
    year: 2026,
    color: "Blue",
    wholesalePriceDzd: 2_050_000,
    importFeesDzd: 540_000,
    listPriceDzd: 3_100_000,
    location: "algeria_arrived" as const,
  },
];

const DEMO_ORDERS = [
  {
    code: "ORD-001",
    client: "C001",
    car: "V003",
    orderDate: "2026-05-12",
    discountDzd: 100_000,
    extrasDzd: 25_000,
    status: "delivered" as const,
    trackingNo: "COSU6321845790",
  },
  {
    code: "ORD-002",
    client: "C002",
    car: "V001",
    orderDate: "2026-06-03",
    discountDzd: 0,
    extrasDzd: 0,
    status: "shipped" as const,
    trackingNo: "MSKU7745120368",
  },
  {
    code: "ORD-003",
    client: "C003",
    car: "V004",
    orderDate: "2026-07-10",
    discountDzd: 200_000,
    extrasDzd: 60_000,
    status: "pending" as const,
    trackingNo: null,
  },
];

const DEMO_PAYMENTS = [
  {
    code: "PAY-001",
    order: "ORD-001",
    paidOn: "2026-05-12",
    amountDzd: 2_425_000,
    method: "bank_transfer" as const,
  },
  {
    code: "PAY-002",
    order: "ORD-002",
    paidOn: "2026-06-03",
    amountDzd: 1_500_000,
    method: "cash" as const,
  },
  {
    code: "PAY-003",
    order: "ORD-003",
    paidOn: "2026-07-10",
    amountDzd: 1_200_000,
    method: "cheque" as const,
  },
];

async function main() {
  const db = getDb();

  await db
    .insert(brands)
    .values(Object.keys(CATALOG).map((name) => ({ name })))
    .onConflictDoNothing();
  const brandRows = await db.select().from(brands);
  const brandId = (name: string) => {
    const row = brandRows.find((b) => b.name === name);
    if (!row) throw new Error(`Brand not found: ${name}`);
    return row.id;
  };

  await db
    .insert(models)
    .values(
      Object.entries(CATALOG).flatMap(([brand, names]) =>
        names.map((name) => ({ brandId: brandId(brand), name }))
      )
    )
    .onConflictDoNothing();
  const modelRows = await db.select().from(models);
  const modelId = (brand: string, name: string) => {
    const row = modelRows.find((m) => m.brandId === brandId(brand) && m.name === name);
    if (!row) throw new Error(`Model not found: ${brand} ${name}`);
    return row.id;
  };

  await db
    .insert(colors)
    .values(COLORS.map((name) => ({ name })))
    .onConflictDoNothing();
  const colorRows = await db.select().from(colors);
  const colorId = (name: string) => {
    const row = colorRows.find((c) => c.name === name);
    if (!row) throw new Error(`Color not found: ${name}`);
    return row.id;
  };

  await db
    .insert(clients)
    .values(DEMO_CLIENTS.map((c) => ({ ...c, notes: "EXAMPLE" })))
    .onConflictDoNothing();
  const clientRows = await db.select().from(clients);
  const clientId = (code: string) => {
    const row = clientRows.find((c) => c.code === code);
    if (!row) throw new Error(`Client not found: ${code}`);
    return row.id;
  };

  await db
    .insert(cars)
    .values(
      DEMO_CARS.map(({ brand, model, color, ...car }) => ({
        ...car,
        brandId: brandId(brand),
        modelId: modelId(brand, model),
        colorId: colorId(color),
      }))
    )
    .onConflictDoNothing();
  const carRows = await db.select().from(cars);
  const carId = (code: string) => {
    const row = carRows.find((c) => c.code === code);
    if (!row) throw new Error(`Car not found: ${code}`);
    return row.id;
  };

  await db
    .insert(orders)
    .values(
      DEMO_ORDERS.map(({ client, car, ...order }) => ({
        ...order,
        clientId: clientId(client),
        carId: carId(car),
        notes: "EXAMPLE",
      }))
    )
    .onConflictDoNothing();
  const orderRows = await db.select().from(orders);
  const orderId = (code: string) => {
    const row = orderRows.find((o) => o.code === code);
    if (!row) throw new Error(`Order not found: ${code}`);
    return row.id;
  };

  await db
    .insert(payments)
    .values(
      DEMO_PAYMENTS.map(({ order, ...payment }) => ({
        ...payment,
        orderId: orderId(order),
        notes: "EXAMPLE",
      }))
    )
    .onConflictDoNothing();

  const tables = [
    ["brands", brands],
    ["models", models],
    ["colors", colors],
    ["clients", clients],
    ["cars", cars],
    ["orders", orders],
    ["payments", payments],
    ["users", users],
  ] as const;
  for (const [name, table] of tables) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(table);
    console.log(`${name}: ${count}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
