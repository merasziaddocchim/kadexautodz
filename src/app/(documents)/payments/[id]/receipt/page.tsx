import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDZD } from "@/lib/format";
import {
  capitalizeFirst,
  montantEnLettresDZD,
} from "@/lib/numberToFrenchWords";
import { METHOD_FR } from "@/lib/documentLabels";
import { CompanySettings } from "@/lib/company";
import { PaymentMethod } from "@/lib/types";
import CompanyHeader from "@/components/documents/CompanyHeader";
import PrintToolbar from "@/components/documents/PrintToolbar";

export const metadata = { title: "Reçu de paiement — Kadex Auto DZ" };

interface ReceiptPayment {
  id: string;
  code: string;
  paid_on: string;
  amount_dzd: number;
  method: PaymentMethod;
  notes: string | null;
  order: {
    id: string;
    code: string;
    discount_dzd: number;
    extras_dzd: number;
    client: { name: string; address: string | null; phone: string | null };
    car: {
      year: number;
      vin: string | null;
      list_price_dzd: number;
      brand: { name: string };
      model: { name: string };
      color: { name: string };
    };
    payments: { id: string; code: string; paid_on: string; amount_dzd: number }[];
  };
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [payRes, companyRes] = await Promise.all([
    supabase
      .from("payments")
      .select(
        `id, code, paid_on, amount_dzd, method, notes,
         order:orders(
           id, code, discount_dzd, extras_dzd,
           client:clients(name, address, phone),
           car:cars(year, vin, list_price_dzd, brand:brands(name), model:models(name), color:colors(name)),
           payments(id, code, paid_on, amount_dzd)
         )`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("company_settings").select("*").maybeSingle(),
  ]);
  if (payRes.error) throw new Error(payRes.error.message);
  if (!payRes.data) notFound();

  const payment = payRes.data as unknown as ReceiptPayment;
  const company = (companyRes.data ?? null) as CompanySettings | null;
  const order = payment.order;

  const total = order.car.list_price_dzd - order.discount_dzd + order.extras_dzd;

  // Balance right after this payment: cumulative of payments up to and
  // including this one, ordered by date then code.
  const key = (p: { paid_on: string; code: string }) => `${p.paid_on}#${p.code}`;
  const thisKey = key(payment);
  const cumulative = order.payments
    .filter((p) => key(p) <= thisKey)
    .reduce((s, p) => s + p.amount_dzd, 0);
  const balanceAfter = total - cumulative;

  const amountWords = montantEnLettresDZD(payment.amount_dzd);
  const vehicle = `${order.car.brand.name} ${order.car.model.name} ${order.car.color.name} — ${order.car.year}`;

  return (
    <>
      <PrintToolbar backHref={`/orders/${order.id}`} />
      <div className="doc-sheet">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b border-gray-300 pb-4">
          <CompanyHeader company={company} />
          <div className="text-right">
            <h1 className="font-bold">REÇU DE PAIEMENT</h1>
            <p className="mt-1 font-semibold">N° {payment.code}</p>
            <p className="text-[11px] text-gray-600">
              Date : {formatDate(payment.paid_on)}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="mt-5 space-y-3">
          <p>
            Reçu de <strong>{order.client.name}</strong>
            {order.client.phone ? ` (Tél : ${order.client.phone})` : ""}
            {order.client.address ? `, ${order.client.address}` : ""}.
          </p>
          <p>
            Au titre de la commande <strong>{order.code}</strong> —{" "}
            {vehicle}
            {order.car.vin ? ` (VIN : ${order.car.vin})` : ""}.
          </p>

          <table className="mt-2 w-full border-collapse">
            <tbody>
              <tr className="border-y border-gray-300 bg-gray-50">
                <td className="px-2 py-2 font-semibold">Montant reçu</td>
                <td className="px-2 py-2 text-right font-bold">
                  {formatDZD(payment.amount_dzd)}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-2 py-2 text-gray-600">Mode de paiement</td>
                <td className="px-2 py-2 text-right">
                  {METHOD_FR[payment.method]}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-2 py-2 text-gray-600">
                  Reste à payer après ce versement
                </td>
                <td className="px-2 py-2 text-right font-semibold">
                  {formatDZD(balanceAfter)}
                </td>
              </tr>
            </tbody>
          </table>

          {amountWords && (
            <p className="text-[11px] italic text-gray-700">
              Arrêté le présent reçu à la somme de :{" "}
              {capitalizeFirst(amountWords)}.
            </p>
          )}
          {payment.notes && (
            <p className="text-[11px] text-gray-600">Note : {payment.notes}</p>
          )}
        </div>

        {/* Signature */}
        <div className="avoid-break mt-10 flex justify-end">
          <div className="text-center">
            <p className="text-[11px] text-gray-600">Signature &amp; cachet</p>
            <div className="mt-10 w-48 border-t border-gray-400" />
          </div>
        </div>
      </div>
    </>
  );
}
