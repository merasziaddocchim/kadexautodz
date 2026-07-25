import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDZD } from "@/lib/format";
import { METHOD_LABELS, OrderStatus, PaymentMethod } from "@/lib/types";
import { STATUS_FR } from "@/lib/documentLabels";
import { toWaNumber } from "@/lib/phone";
import {
  buildTrackingUrl,
  getSiteUrlInfo,
  waHref,
} from "@/lib/siteUrl";
import { receiptShareMessage, trackingShareMessage } from "@/lib/whatsappMessages";
import { StatusBadge } from "@/components/badges";
import OrderActions from "@/components/OrderActions";
import OrderTrackingShare from "@/components/tracking/OrderTrackingShare";
import WhatsAppButton from "@/components/tracking/WhatsAppButton";
import { issueContract, issueInvoice } from "@/lib/documentActions";
import { btnSecondary, cardCls, tdCls, thCls } from "@/components/ui";

export const metadata = { title: "Order — Kadex Auto DZ" };

interface OrderDetail {
  id: string;
  code: string;
  order_date: string;
  status: OrderStatus;
  tracking_no: string | null;
  notes: string | null;
  discount_dzd: number;
  extras_dzd: number;
  created_at: string;
  invoice_number: string | null;
  contract_number: string | null;
  tracking_token: string;
  tracking_enabled: boolean;
  client: { code: string; name: string; phone: string | null; city: string | null };
  car: {
    code: string;
    year: number;
    list_price_dzd: number;
    brand: { name: string };
    model: { name: string };
    color: { name: string };
  };
  payments: {
    id: string;
    code: string;
    paid_on: string;
    amount_dzd: number;
    method: PaymentMethod;
    notes: string | null;
  }[];
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, code, order_date, status, tracking_no, notes, discount_dzd, extras_dzd, created_at, invoice_number, contract_number, tracking_token, tracking_enabled,
       client:clients(code, name, phone, city),
       car:cars(code, year, list_price_dzd, brand:brands(name), model:models(name), color:colors(name)),
       payments(id, code, paid_on, amount_dzd, method, notes)`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();

  const order = data as unknown as OrderDetail;
  const total = order.car.list_price_dzd - order.discount_dzd + order.extras_dzd;
  const paid = order.payments.reduce((s, p) => s + p.amount_dzd, 0);
  const balance = total - paid;

  // --- Customer tracking / WhatsApp sharing ---
  const vehicle = `${order.car.brand.name} ${order.car.model.name} ${order.car.color.name} ${order.car.year}`;
  const trackingUrl = order.tracking_enabled
    ? buildTrackingUrl(order.tracking_token)
    : null;
  const clientWa = toWaNumber(order.client.phone);
  // A VERCEL_URL fallback link sits behind Vercel Deployment Protection and
  // prompts the customer to sign in to Vercel — never send those.
  const siteUrl = getSiteUrlInfo();
  const customerSafeUrl = siteUrl.source === "explicit";
  const shareDisabledReason = !order.tracking_enabled
    ? "Le lien de suivi est désactivé pour cette commande."
    : !customerSafeUrl
    ? "NEXT_PUBLIC_SITE_URL n’est pas défini : le lien pointerait vers une URL de déploiement Vercel protégée, que le client ne peut pas ouvrir."
    : !clientWa
    ? "Numéro de téléphone du client manquant ou invalide."
    : null;
  const orderWaHref =
    clientWa && trackingUrl && customerSafeUrl
      ? waHref(
          clientWa,
          trackingShareMessage({
            name: order.client.name,
            orderCode: order.code,
            vehicle,
            statusFr: STATUS_FR[order.status],
            trackingUrl,
          })
        )
      : null;

  // Payments sorted, each with the running balance after it and a receipt
  // WhatsApp link (which points to the tracking page, never the receipt PDF).
  const sorted = [...order.payments].sort((a, b) =>
    `${a.paid_on}#${a.code}`.localeCompare(`${b.paid_on}#${b.code}`)
  );
  let running = 0;
  const payments = sorted.map((p) => {
    running += p.amount_dzd;
    const balanceAfter = total - running;
    const href =
      clientWa && trackingUrl && customerSafeUrl
        ? waHref(
            clientWa,
            receiptShareMessage({
              name: order.client.name,
              orderCode: order.code,
              amount: p.amount_dzd,
              paidOn: p.paid_on,
              balance: balanceAfter,
              trackingUrl,
            })
          )
        : null;
    return { ...p, waHref: href };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{order.code}</h1>
        <StatusBadge status={order.status} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <form action={issueInvoice}>
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit" className={btnSecondary}>
              {order.invoice_number
                ? `Invoice ${order.invoice_number}`
                : "Issue invoice / Print"}
            </button>
          </form>
          <form action={issueContract}>
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit" className={btnSecondary}>
              {order.contract_number
                ? `Contract ${order.contract_number}`
                : "Issue contract / Print"}
            </button>
          </form>
          <Link href={`/orders/${order.id}/edit`} className={btnSecondary}>
            Edit
          </Link>
          <OrderActions
            orderId={order.id}
            code={order.code}
            status={order.status}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} p-5`}>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Details</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-gray-500">Client</dt>
            <dd>
              {order.client.code} · {order.client.name}
              {order.client.city ? ` (${order.client.city})` : ""}
              {order.client.phone ? ` · ${order.client.phone}` : ""}
            </dd>
            <dt className="text-gray-500">Car</dt>
            <dd>
              {order.car.code} · {order.car.brand.name} {order.car.model.name}{" "}
              {order.car.color.name} {order.car.year}
            </dd>
            <dt className="text-gray-500">Order date</dt>
            <dd>{formatDate(order.order_date)}</dd>
            <dt className="text-gray-500">Tracking</dt>
            <dd>{order.tracking_no || "—"}</dd>
            <dt className="text-gray-500">Notes</dt>
            <dd>{order.notes || "—"}</dd>
          </dl>
        </div>

        <div className={`${cardCls} p-5`}>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Money</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">List price</dt>
              <dd>{formatDZD(order.car.list_price_dzd)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">− Discount</dt>
              <dd>{formatDZD(order.discount_dzd)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">+ Extras</dt>
              <dd>{formatDZD(order.extras_dzd)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
              <dt>Total</dt>
              <dd>{formatDZD(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Paid</dt>
              <dd>{formatDZD(paid)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Balance</dt>
              <dd className={balance > 0 ? "text-red-600" : "text-emerald-600"}>
                {formatDZD(balance)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <OrderTrackingShare
        orderId={order.id}
        trackingEnabled={order.tracking_enabled}
        trackingUrl={trackingUrl}
        waHref={orderWaHref}
        shareDisabledReason={shareDisabledReason}
        siteUrlWarning={
          customerSafeUrl
            ? null
            : "NEXT_PUBLIC_SITE_URL is not set, so links fall back to a Vercel deployment URL that is behind Deployment Protection — customers opening it are asked to sign in to Vercel. Set it in Vercel → Settings → Environment Variables, then redeploy."
        }
      />

      <div className={cardCls}>
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Payments ({payments.length})
          </h2>
          <Link
            href={`/payments/new?order=${order.id}`}
            className={btnSecondary}
          >
            Add payment
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={thCls}>Code</th>
                <th className={thCls}>Date</th>
                <th className={`${thCls} text-right`}>Amount</th>
                <th className={thCls}>Method</th>
                <th className={thCls}>Notes</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className={tdCls}>{p.code}</td>
                  <td className={tdCls}>{formatDate(p.paid_on)}</td>
                  <td className={`${tdCls} text-right`}>
                    {formatDZD(p.amount_dzd)}
                  </td>
                  <td className={tdCls}>{METHOD_LABELS[p.method]}</td>
                  <td className={`${tdCls} text-gray-500`}>{p.notes || "—"}</td>
                  <td className={`${tdCls} text-right`}>
                    <div className="flex items-center justify-end gap-3">
                      <WhatsAppButton
                        href={p.waHref}
                        label="Envoyer le reçu (WhatsApp)"
                        disabledReason={shareDisabledReason}
                        className="px-2 py-1 text-xs"
                      />
                      <Link
                        href={`/payments/${p.id}/receipt`}
                        className="text-blue-700 hover:underline"
                      >
                        Receipt
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td className={`${tdCls} text-gray-400`} colSpan={6}>
                    No payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
