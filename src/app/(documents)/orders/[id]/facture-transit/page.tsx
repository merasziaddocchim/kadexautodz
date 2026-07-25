import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  TRANSIT_LINE_TEMPLATE,
  TransitInvoiceData,
  TransitLine,
} from "@/lib/transitLines";
import FactureTransit from "@/components/documents/FactureTransit";
import PrintToolbar from "@/components/documents/PrintToolbar";
import { btnPrimary } from "@/components/ui";

export const metadata = { title: "Facture Transit — Kadex Auto DZ" };

interface TransitOrder {
  id: string;
  code: string;
  client: { name: string };
  car: { brand: { name: string }; model: { name: string } };
}

interface TransitInvoiceRow {
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

export default async function FactureTransitPage({
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
        `id, code, client:clients(name), car:cars(brand:brands(name), model:models(name))`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("transit_invoices")
      .select(
        `number, place, invoice_date, designation, poids_kg, nombre, somme_avancee_centimes,
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

  // Not yet issued: never invent a number here — assignment happens through
  // the server action, exactly like the sale invoice.
  if (!invoice?.number) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-700">
          La facture transit de la commande <strong>{order.code}</strong> n’a pas
          encore été émise.
        </p>
        <Link href={`/orders/${order.id}/transit`} className={`${btnPrimary} mt-4`}>
          Saisir et émettre la facture transit
        </Link>
      </div>
    );
  }

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

  const inv: TransitInvoiceData = {
    number: invoice.number,
    ref: `REP:${invoice.number}`,
    place: invoice.place,
    invoice_date: invoice.invoice_date,
    client_name: order.client.name.toUpperCase(),
    designation: invoice.designation,
    poids_kg: invoice.poids_kg,
    nombre: invoice.nombre,
    vehicle_label:
      `${order.car.brand.name} ${order.car.model.name}`.toUpperCase(),
    somme_avancee_centimes: invoice.somme_avancee_centimes,
    lines,
  };

  return (
    <>
      <PrintToolbar backHref={`/orders/${order.id}/transit`} />
      <FactureTransit inv={inv} />
    </>
  );
}
