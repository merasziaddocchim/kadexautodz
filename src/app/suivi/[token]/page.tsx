import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDZD } from "@/lib/format";
import { toWaNumber } from "@/lib/phone";
import StatusTimeline from "@/components/tracking/StatusTimeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivi de commande",
  robots: { index: false, follow: false },
};

interface Tracking {
  order_code: string;
  order_date: string;
  status: string;
  tracking_no: string | null;
  brand: string;
  model: string;
  model_year: number;
  color: string;
  client_first_name: string;
  total_dzd: number;
  paid_dzd: number;
  balance_dzd: number;
  company_name: string | null;
  company_phone: string | null;
  company_city: string | null;
}

function InvalidLink() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-semibold text-gray-800">
          Lien invalide ou expiré
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Ce lien de suivi n’est pas valide. Veuillez contacter la
          concession.
        </p>
      </div>
    </main>
  );
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let row: Tracking | null = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_tracking", {
      p_token: token,
    });
    if (!error && Array.isArray(data) && data.length > 0) {
      row = data[0] as Tracking;
    }
  } catch {
    row = null;
  }

  // Unknown, malformed, or disabled token → neutral message. Never reveal
  // whether an order exists.
  if (!row) return <InvalidLink />;

  const waNumber = toWaNumber(row.company_phone);
  const contactMessage = `Bonjour, je vous contacte au sujet de ma commande ${row.order_code}.`;
  const contactHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(contactMessage)}`
    : row.company_phone
    ? `tel:${row.company_phone.replace(/[^\d+]/g, "")}`
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6">
      {/* Dealership */}
      <header className="text-center">
        <h1 className="text-lg font-bold text-gray-900">
          {row.company_name || "Concession"}
        </h1>
        {(row.company_phone || row.company_city) && (
          <p className="mt-0.5 text-sm text-gray-500">
            {[row.company_city, row.company_phone].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>

      <div className="mt-5 space-y-4">
        {/* Vehicle + order reference */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Votre véhicule
          </p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {row.brand} {row.model}
          </p>
          <p className="text-sm text-gray-600">
            {row.model_year} · {row.color}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
            <span className="text-gray-500">Commande</span>
            <span className="font-medium text-gray-900">{row.order_code}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-900">{formatDate(row.order_date)}</span>
          </div>
        </section>

        {/* Status */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Statut de la commande
          </p>
          <StatusTimeline status={row.status} />
        </section>

        {/* Carrier tracking number */}
        {row.tracking_no && row.status !== "cancelled" && (
          <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
              N° de suivi transporteur
            </p>
            <p className="mt-1 break-all text-lg font-bold tracking-wide text-sky-900">
              {row.tracking_no}
            </p>
            <p className="mt-1 text-xs text-sky-700">
              Vous pouvez suivre l’acheminement avec ce numéro sur le site du
              transporteur.
            </p>
          </section>
        )}

        {/* Payment summary */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Paiement
          </p>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Total</dt>
              <dd className="text-gray-900">{formatDZD(row.total_dzd)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Versé</dt>
              <dd className="text-gray-900">{formatDZD(row.paid_dzd)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-1 font-semibold">
              <dt className="text-gray-700">Reste à payer</dt>
              <dd
                className={
                  row.balance_dzd > 0 ? "text-red-600" : "text-emerald-600"
                }
              >
                {formatDZD(row.balance_dzd)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Contact */}
        {contactHref && (
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Contactez-nous
          </a>
        )}

        <p className="pt-2 text-center text-[11px] text-gray-400">
          Ce lien de suivi vous est personnel — merci de ne pas le partager
          publiquement.
        </p>
      </div>
    </main>
  );
}
