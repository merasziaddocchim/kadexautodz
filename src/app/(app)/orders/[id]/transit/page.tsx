import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { openTransitInvoice } from "@/lib/transitActions";
import { TRANSIT_LINE_TEMPLATE, TransitLine } from "@/lib/transitLines";
import TransitInvoiceForm from "@/components/TransitInvoiceForm";
import { btnPrimary, btnSecondary, cardCls } from "@/components/ui";

export const metadata = { title: "Facture Transit — Kadex Auto DZ" };

interface TransitOrder {
  id: string;
  code: string;
  client: { name: string };
  car: {
    year: number;
    brand: { name: string };
    model: { name: string };
    color: { name: string };
  };
}

interface TransitInvoiceRow {
  id: string;
  number: string | null;
  place: string;
  invoice_date: string;
  designation: string;
  poids_kg: number | null;
  nombre: string | null;
  somme_avancee_centimes: number;
  lines: {
    position: number;
    label: string;
    debours_centimes: number | null;
    transit_centimes: number | null;
    observations: string | null;
  }[];
}

export default async function TransitEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [orderRes, invoiceRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, code,
         client:clients(name),
         car:cars(year, brand:brands(name), model:models(name), color:colors(name))`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("transit_invoices")
      .select(
        `id, number, place, invoice_date, designation, poids_kg, nombre, somme_avancee_centimes,
         lines:transit_invoice_lines(position, label, debours_centimes, transit_centimes, observations)`
      )
      .eq("order_id", id)
      .maybeSingle(),
  ]);
  if (orderRes.error) throw new Error(orderRes.error.message);
  if (!orderRes.data) notFound();
  if (invoiceRes.error) throw new Error(invoiceRes.error.message);

  const order = orderRes.data as unknown as TransitOrder;
  const invoice = (invoiceRes.data ?? null) as TransitInvoiceRow | null;
  const vehicle = `${order.car.brand.name} ${order.car.model.name} ${order.car.color.name} ${order.car.year}`;

  const header = (
    <div className="flex flex-wrap items-center gap-3">
      <h1 className="text-xl font-semibold">Facture Transit — {order.code}</h1>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Link href={`/orders/${order.id}`} className={btnSecondary}>
          Back to order
        </Link>
      </div>
    </div>
  );

  // Reachable by direct URL before the draft exists — offer to create it.
  if (!invoice) {
    return (
      <div className="space-y-4">
        {header}
        <div className={`${cardCls} max-w-lg p-5`}>
          <p className="text-sm text-gray-700">
            No transit invoice has been started for this order yet.
          </p>
          <form action={openTransitInvoice} className="mt-4">
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit" className={btnPrimary}>
              Start Facture Transit
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Seeded by the database trigger; fall back to the template if a line is
  // ever missing so the form always shows all 16.
  const byPosition = new Map(invoice.lines.map((l) => [l.position, l]));
  const lines: TransitLine[] = TRANSIT_LINE_TEMPLATE.map((t) => {
    const row = byPosition.get(t.position);
    return {
      position: t.position,
      label: row?.label ?? t.label,
      underline: t.underline,
      debours_centimes: row?.debours_centimes ?? null,
      transit_centimes: row?.transit_centimes ?? null,
      observations: row?.observations ?? null,
    };
  });

  return (
    <div className="space-y-4">
      {header}
      <p className="text-sm text-gray-500">
        {order.client.name} · {vehicle}
        {invoice.number ? ` · Issued as ${invoice.number}` : " · Not yet issued"}
      </p>
      <TransitInvoiceForm
        orderId={order.id}
        invoice={{
          id: invoice.id,
          number: invoice.number,
          place: invoice.place,
          invoice_date: invoice.invoice_date,
          designation: invoice.designation,
          poids_kg: invoice.poids_kg,
          nombre: invoice.nombre,
          somme_avancee_centimes: invoice.somme_avancee_centimes,
          lines,
        }}
      />
    </div>
  );
}
