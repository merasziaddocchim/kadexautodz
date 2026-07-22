import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carAvailability, OrderStatus } from "@/lib/types";
import OrderForm, { CarOption } from "@/components/OrderForm";

export const metadata = { title: "Edit order — Kadex Auto DZ" };

interface CarRecord {
  id: string;
  code: string;
  list_price_dzd: number;
  brand: { name: string };
  model: { name: string };
  color: { name: string };
  orders: { status: OrderStatus }[];
}

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [orderRes, clientsRes, carsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, code, client_id, car_id, order_date, discount_dzd, extras_dzd, tracking_no, notes"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("clients").select("id, code, name").order("code"),
    supabase
      .from("cars")
      .select(
        "id, code, list_price_dzd, brand:brands(name), model:models(name), color:colors(name), orders(status)"
      )
      .order("code"),
  ]);
  const firstError = orderRes.error ?? clientsRes.error ?? carsRes.error;
  if (firstError) throw new Error(firstError.message);
  if (!orderRes.data) notFound();
  const order = orderRes.data;

  const clients = (clientsRes.data ?? []).map((c) => ({
    value: c.id as string,
    label: `${c.code} · ${c.name}`,
  }));

  // Available cars + the car currently on this order.
  const cars: CarOption[] = ((carsRes.data ?? []) as unknown as CarRecord[])
    .filter(
      (c) => c.id === order.car_id || carAvailability(c.orders) === "available"
    )
    .map((c) => ({
      id: c.id,
      label: `${c.code} · ${c.brand.name} ${c.model.name} ${c.color.name}`,
      listPrice: c.list_price_dzd,
    }));

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Edit {order.code}</h1>
      <OrderForm
        mode="edit"
        orderId={order.id}
        code={order.code}
        clients={clients}
        cars={cars}
        initial={{
          client_id: order.client_id,
          car_id: order.car_id,
          order_date: order.order_date,
          discount_dzd: order.discount_dzd,
          extras_dzd: order.extras_dzd,
          tracking_no: order.tracking_no ?? "",
          notes: order.notes ?? "",
        }}
      />
    </div>
  );
}
