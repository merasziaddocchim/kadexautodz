import { createClient } from "@/lib/supabase/server";
import { nextCode, todayISO } from "@/lib/format";
import { carAvailability, OrderStatus } from "@/lib/types";
import OrderForm, { CarOption } from "@/components/OrderForm";

export const metadata = { title: "New order — Kadex Auto DZ" };

interface CarRecord {
  id: string;
  code: string;
  list_price_dzd: number;
  brand: { name: string };
  model: { name: string };
  color: { name: string };
  orders: { status: OrderStatus }[];
}

export default async function NewOrderPage() {
  const supabase = await createClient();
  const [clientsRes, carsRes, codesRes] = await Promise.all([
    supabase.from("clients").select("id, code, name").order("code"),
    supabase
      .from("cars")
      .select(
        "id, code, list_price_dzd, brand:brands(name), model:models(name), color:colors(name), orders(status)"
      )
      .order("code"),
    supabase.from("orders").select("code"),
  ]);
  const firstError = clientsRes.error ?? carsRes.error ?? codesRes.error;
  if (firstError) throw new Error(firstError.message);

  const clients = (clientsRes.data ?? []).map((c) => ({
    value: c.id as string,
    label: `${c.code} · ${c.name}`,
  }));

  const cars: CarOption[] = ((carsRes.data ?? []) as unknown as CarRecord[])
    .filter((c) => carAvailability(c.orders) === "available")
    .map((c) => ({
      id: c.id,
      label: `${c.code} · ${c.brand.name} ${c.model.name} ${c.color.name}`,
      listPrice: c.list_price_dzd,
    }));

  const code = nextCode(
    (codesRes.data ?? []).map((r) => r.code as string),
    "ORD-"
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">New order</h1>
      <OrderForm
        mode="create"
        code={code}
        clients={clients}
        cars={cars}
        initial={{
          client_id: "",
          car_id: "",
          order_date: todayISO(),
          discount_dzd: 0,
          extras_dzd: 0,
          tracking_no: "",
          notes: "",
        }}
      />
    </div>
  );
}
