import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { btnPrimary } from "@/components/ui";
import ClientsTable, { ClientRow } from "@/components/ClientsTable";
import { OrderStatus } from "@/lib/types";

export const metadata = { title: "Clients — Kadex Auto DZ" };

interface ClientRecord {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  orders: { status: OrderStatus; payments: { amount_dzd: number }[] }[];
}

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, code, name, phone, email, city, orders(status, payments(amount_dzd))"
    )
    .order("code");
  if (error) throw new Error(error.message);

  const rows: ClientRow[] = ((data ?? []) as unknown as ClientRecord[]).map(
    (c) => {
      const active = c.orders.filter((o) => o.status !== "cancelled");
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        phone: c.phone ?? "",
        email: c.email ?? "",
        city: c.city ?? "",
        ordersCount: active.length,
        totalSpent: active.reduce(
          (s, o) => s + o.payments.reduce((ps, p) => ps + p.amount_dzd, 0),
          0
        ),
      };
    }
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Link href="/clients/new" className={btnPrimary}>
          Add client
        </Link>
      </div>
      <ClientsTable rows={rows} />
    </div>
  );
}
