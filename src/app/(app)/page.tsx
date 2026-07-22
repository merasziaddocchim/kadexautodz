import { createClient } from "@/lib/supabase/server";
import { formatDZD } from "@/lib/format";
import { carAvailability, CarLocation, OrderStatus } from "@/lib/types";
import KpiCard from "@/components/KpiCard";
import DashboardCharts, {
  MonthlyPoint,
  StatusSlice,
} from "@/components/DashboardCharts";
import { ORDER_STATUSES } from "@/lib/types";

export const metadata = { title: "Dashboard — Kadex Auto DZ" };

interface OrderRecord {
  status: OrderStatus;
  order_date: string;
  discount_dzd: number;
  extras_dzd: number;
  car: { list_price_dzd: number };
  payments: { amount_dzd: number }[];
}

interface CarRecord {
  location: CarLocation;
  wholesale_price_dzd: number;
  import_fees_dzd: number;
  orders: { status: OrderStatus }[];
}

const OPEN_STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const [ordersRes, carsRes, clientsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "status, order_date, discount_dzd, extras_dzd, car:cars(list_price_dzd), payments(amount_dzd)"
      ),
    supabase
      .from("cars")
      .select(
        "location, wholesale_price_dzd, import_fees_dzd, orders(status)"
      ),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);
  const firstError = ordersRes.error ?? carsRes.error ?? clientsRes.error;
  if (firstError) throw new Error(firstError.message);

  const orders = (ordersRes.data ?? []) as unknown as OrderRecord[];
  const cars = (carsRes.data ?? []) as unknown as CarRecord[];
  const clientCount = clientsRes.count ?? 0;

  // --- Order KPIs (revenue/collected exclude cancelled) ---
  const totalOrders = orders.length;
  const openOrders = orders.filter((o) =>
    OPEN_STATUSES.includes(o.status)
  ).length;

  let revenue = 0;
  let collected = 0;
  const monthly: MonthlyPoint[] = [];
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const total = o.car.list_price_dzd - o.discount_dzd + o.extras_dzd;
    const paid = o.payments.reduce((s, p) => s + p.amount_dzd, 0);
    revenue += total;
    collected += paid;
    const d = new Date(o.order_date);
    monthly.push({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      total,
    });
  }
  const outstanding = revenue - collected;

  // --- Inventory KPIs ---
  const availableCars = cars.filter(
    (c) => carAvailability(c.orders) === "available"
  );
  const stockValue = availableCars.reduce(
    (s, c) => s + c.wholesale_price_dzd + c.import_fees_dzd,
    0
  );
  const byLocation = (loc: CarLocation) =>
    cars.filter((c) => c.location === loc).length;

  // --- Chart inputs ---
  const currentYear = new Date().getUTCFullYear();
  const yearSet = new Set<number>(monthly.map((m) => m.year));
  yearSet.add(currentYear);
  const years = [...yearSet].sort((a, b) => b - a);

  const statusData: StatusSlice[] = ORDER_STATUSES.map((s) => ({
    status: s,
    count: orders.filter((o) => o.status === s).length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Orders</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Total orders" value={String(totalOrders)} />
          <KpiCard
            label="Open orders"
            value={String(openOrders)}
            hint="pending + confirmed + shipped"
            accent="blue"
          />
          <KpiCard
            label="Revenue"
            value={formatDZD(revenue)}
            hint="excl. cancelled"
          />
          <KpiCard
            label="Collected"
            value={formatDZD(collected)}
            accent="green"
          />
          <KpiCard
            label="Outstanding"
            value={formatDZD(outstanding)}
            accent={outstanding > 0 ? "red" : "green"}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Inventory</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard
            label="Stock value"
            value={formatDZD(stockValue)}
            hint="landed cost, available"
          />
          <KpiCard
            label="Cars available"
            value={String(availableCars.length)}
            accent="green"
          />
          <KpiCard
            label="China warehouse"
            value={String(byLocation("china_warehouse"))}
          />
          <KpiCard label="In transit" value={String(byLocation("in_transit"))} />
          <KpiCard
            label="Arrived"
            value={String(byLocation("algeria_arrived"))}
          />
          <KpiCard label="Clients" value={String(clientCount)} />
        </div>
      </section>

      <section>
        <DashboardCharts
          monthly={monthly}
          years={years}
          defaultYear={currentYear}
          statusData={statusData}
        />
      </section>
    </div>
  );
}
