import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDZD } from "@/lib/format";
import {
  capitalizeFirst,
  montantEnLettresDZD,
} from "@/lib/numberToFrenchWords";
import { CompanySettings } from "@/lib/company";
import CompanyHeader from "@/components/documents/CompanyHeader";
import PrintToolbar from "@/components/documents/PrintToolbar";
import { btnPrimary } from "@/components/ui";

export const metadata = { title: "Facture — Kadex Auto DZ" };

interface InvoiceOrder {
  id: string;
  code: string;
  order_date: string;
  discount_dzd: number;
  extras_dzd: number;
  invoice_number: string | null;
  invoice_issued_on: string | null;
  client: {
    name: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    id_card_number: string | null;
  };
  car: {
    year: number;
    vin: string | null;
    list_price_dzd: number;
    brand: { name: string };
    model: { name: string };
    color: { name: string };
  };
  payments: { amount_dzd: number }[];
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [orderRes, companyRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, code, order_date, discount_dzd, extras_dzd, invoice_number, invoice_issued_on,
         client:clients(name, address, city, phone, id_card_number),
         car:cars(year, vin, list_price_dzd, brand:brands(name), model:models(name), color:colors(name)),
         payments(amount_dzd)`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("company_settings").select("*").maybeSingle(),
  ]);
  if (orderRes.error) throw new Error(orderRes.error.message);
  if (!orderRes.data) notFound();

  const order = orderRes.data as unknown as InvoiceOrder;
  const company = (companyRes.data ?? null) as CompanySettings | null;

  // Not yet issued: don't invent a number here (assignment happens via the
  // server action on the order page). Show a clear notice instead.
  if (!order.invoice_number) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-700">
          La facture de la commande <strong>{order.code}</strong> n’a pas encore
          été émise.
        </p>
        <Link href={`/orders/${order.id}`} className={`${btnPrimary} mt-4`}>
          Aller à la commande pour l’émettre
        </Link>
      </div>
    );
  }

  const listPrice = order.car.list_price_dzd;
  const total = listPrice - order.discount_dzd + order.extras_dzd;
  const paid = order.payments.reduce((s, p) => s + p.amount_dzd, 0);
  const balance = total - paid;
  const totalWords = montantEnLettresDZD(total);

  const vehicle = `${order.car.brand.name} ${order.car.model.name} ${order.car.color.name} — ${order.car.year}`;

  return (
    <>
      <PrintToolbar backHref={`/orders/${order.id}`} />
      <div className="doc-sheet">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b border-gray-300 pb-4">
          <CompanyHeader company={company} />
          <div className="text-right">
            <h1 className="font-bold">FACTURE</h1>
            <p className="mt-1 font-semibold">N° {order.invoice_number}</p>
            <p className="text-[11px] text-gray-600">
              Date :{" "}
              {formatDate(order.invoice_issued_on ?? order.order_date)}
            </p>
            <p className="text-[11px] text-gray-600">
              Réf. commande : {order.code}
            </p>
          </div>
        </div>

        {/* Client */}
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase text-gray-500">
            Facturé à
          </p>
          <p className="font-semibold">{order.client.name}</p>
          {order.client.address && <p>{order.client.address}</p>}
          {order.client.city && <p>{order.client.city}</p>}
          {order.client.phone && (
            <p className="text-[11px] text-gray-600">
              Tél : {order.client.phone}
            </p>
          )}
          {order.client.id_card_number && (
            <p className="text-[11px] text-gray-600">
              Pièce d’identité : {order.client.id_card_number}
            </p>
          )}
        </div>

        {/* Vehicle table */}
        <table className="mt-4 w-full border-collapse text-left">
          <thead>
            <tr className="border-y border-gray-300 bg-gray-50">
              <th className="px-2 py-2 font-semibold">Désignation</th>
              <th className="px-2 py-2 text-right font-semibold">
                Prix (DZD)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="px-2 py-2 align-top">
                <p className="font-medium">Véhicule neuf — {vehicle}</p>
                <p className="text-[11px] text-gray-600">
                  {order.car.vin
                    ? `N° de châssis (VIN) : ${order.car.vin}`
                    : "N° de châssis (VIN) : —"}
                </p>
              </td>
              <td className="px-2 py-2 text-right align-top">
                {formatDZD(listPrice)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Money block */}
        <div className="mt-4 flex justify-end">
          <table className="w-72 text-right">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600">Prix de vente</td>
                <td className="py-1">{formatDZD(listPrice)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Remise</td>
                <td className="py-1">− {formatDZD(order.discount_dzd)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Frais / options</td>
                <td className="py-1">+ {formatDZD(order.extras_dzd)}</td>
              </tr>
              <tr className="border-t border-gray-400">
                <td className="py-1 font-bold">TOTAL</td>
                <td className="py-1 font-bold">{formatDZD(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {totalWords && (
          <p className="mt-3 text-[11px] italic text-gray-700">
            Arrêtée la présente facture à la somme de :{" "}
            {capitalizeFirst(totalWords)}.
          </p>
        )}

        {/* Payment summary */}
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase text-gray-500">
            Situation de paiement
          </p>
          <table className="mt-1 w-72 text-right">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600">Total</td>
                <td className="py-1">{formatDZD(total)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Versé</td>
                <td className="py-1">{formatDZD(paid)}</td>
              </tr>
              <tr className="border-t border-gray-300">
                <td className="py-1 font-semibold">Reste à payer</td>
                <td className="py-1 font-semibold">{formatDZD(balance)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="avoid-break mt-8 flex items-end justify-between gap-6 border-t border-gray-300 pt-4">
          <div className="text-[11px] text-gray-600">
            {company?.bank_name && <p>Banque : {company.bank_name}</p>}
            {company?.rib && <p>RIB : {company.rib}</p>}
          </div>
          <div className="text-center">
            <p className="text-[11px] text-gray-600">Signature &amp; cachet</p>
            <div className="mt-10 w-48 border-t border-gray-400" />
          </div>
        </div>
      </div>
    </>
  );
}
