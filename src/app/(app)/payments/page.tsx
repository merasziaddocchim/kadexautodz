import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { btnPrimary } from "@/components/ui";
import PaymentsTable, { PaymentRow } from "@/components/PaymentsTable";
import { PaymentMethod } from "@/lib/types";

export const metadata = { title: "Payments — Kadex Auto DZ" };

interface PaymentRecord {
  id: string;
  code: string;
  paid_on: string;
  amount_dzd: number;
  method: PaymentMethod;
  notes: string | null;
  order: { id: string; code: string; client: { name: string } };
}

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, code, paid_on, amount_dzd, method, notes, order:orders(id, code, client:clients(name))"
    )
    .order("code");
  if (error) throw new Error(error.message);

  const rows: PaymentRow[] = ((data ?? []) as unknown as PaymentRecord[]).map(
    (p) => ({
      id: p.id,
      code: p.code,
      orderId: p.order.id,
      orderCode: p.order.code,
      client: p.order.client.name,
      paidOn: p.paid_on,
      amount: p.amount_dzd,
      method: p.method,
      notes: p.notes ?? "",
    })
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Payments</h1>
        <Link href="/payments/new" className={btnPrimary}>
          Add payment
        </Link>
      </div>
      <PaymentsTable rows={rows} />
    </div>
  );
}
