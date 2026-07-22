import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { btnPrimary } from "@/components/ui";
import OrdersTable, { OrderRow } from "@/components/OrdersTable";
import { OrderStatus } from "@/lib/types";

export const metadata = { title: "Orders — Kadex Auto DZ" };

interface OrderRecord {
  id: string;
  code: string;
  order_date: string;
  status: OrderStatus;
  tracking_no: string | null;
  discount_dzd: number;
  extras_dzd: number;
  client: { code: string; name: string };
  car: {
    code: string;
    list_price_dzd: number;
    brand: { name: string };
    model: { name: string };
    color: { name: string };
  };
  payments: { amount_dzd: number }[];
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, code, order_date, status, tracking_no, discount_dzd, extras_dzd,
       client:clients(code, name),
       car:cars(code, list_price_dzd, brand:brands(name), model:models(name), color:colors(name)),
       payments(amount_dzd)`
    )
    .order("code");
  if (error) throw new Error(error.message);

  const rows: OrderRow[] = ((data ?? []) as unknown as OrderRecord[]).map(
    (o) => {
      const total = o.car.list_price_dzd - o.discount_dzd + o.extras_dzd;
      const paid = o.payments.reduce((s, p) => s + p.amount_dzd, 0);
      return {
        id: o.id,
        code: o.code,
        client: `${o.client.code} · ${o.client.name}`,
        car: `${o.car.code} · ${o.car.brand.name} ${o.car.model.name} ${o.car.color.name}`,
        date: o.order_date,
        status: o.status,
        tracking: o.tracking_no ?? "",
        total,
        paid,
        balance: total - paid,
      };
    }
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Orders</h1>
        <Link href="/orders/new" className={btnPrimary}>
          New order
        </Link>
      </div>
      <OrdersTable rows={rows} />
    </div>
  );
}
