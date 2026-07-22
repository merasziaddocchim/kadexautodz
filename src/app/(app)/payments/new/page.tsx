import { createClient } from "@/lib/supabase/server";
import { formatDZD, nextCode, todayISO } from "@/lib/format";
import { OrderStatus } from "@/lib/types";
import PaymentForm, { PaymentOrderOption } from "@/components/PaymentForm";

export const metadata = { title: "Add payment — Kadex Auto DZ" };

interface OrderRecord {
  id: string;
  code: string;
  status: OrderStatus;
  discount_dzd: number;
  extras_dzd: number;
  client: { name: string };
  car: { list_price_dzd: number };
  payments: { amount_dzd: number }[];
}

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: preselectedOrderId } = await searchParams;
  const supabase = await createClient();
  const [ordersRes, codesRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, code, status, discount_dzd, extras_dzd,
         client:clients(name), car:cars(list_price_dzd), payments(amount_dzd)`
      )
      .neq("status", "cancelled")
      .order("code"),
    supabase.from("payments").select("code"),
  ]);
  const firstError = ordersRes.error ?? codesRes.error;
  if (firstError) throw new Error(firstError.message);

  const orders: PaymentOrderOption[] = (
    (ordersRes.data ?? []) as unknown as OrderRecord[]
  ).map((o) => {
    const total = o.car.list_price_dzd - o.discount_dzd + o.extras_dzd;
    const paid = o.payments.reduce((s, p) => s + p.amount_dzd, 0);
    const balance = total - paid;
    return {
      id: o.id,
      label: `${o.code} · ${o.client.name} · balance ${formatDZD(balance)}`,
      balance,
    };
  });

  const code = nextCode(
    (codesRes.data ?? []).map((r) => r.code as string),
    "PAY-"
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Add payment</h1>
      <PaymentForm
        code={code}
        orders={orders}
        initialOrderId={preselectedOrderId}
        defaultDate={todayISO()}
      />
    </div>
  );
}
