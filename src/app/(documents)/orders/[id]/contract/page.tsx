import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDZD } from "@/lib/format";
import {
  capitalizeFirst,
  montantEnLettresDZD,
} from "@/lib/numberToFrenchWords";
import { LOCATION_FR, METHOD_FR, STATUS_FR } from "@/lib/documentLabels";
import { CompanySettings } from "@/lib/company";
import { contractBlockers } from "@/lib/contractGuards";
import { CarLocation, OrderStatus, PaymentMethod } from "@/lib/types";
import CompanyHeader from "@/components/documents/CompanyHeader";
import PrintToolbar from "@/components/documents/PrintToolbar";
import { warnCls } from "@/components/ui";

export const metadata = { title: "Contrat de vente — Kadex Auto DZ" };

interface ContractOrder {
  id: string;
  code: string;
  order_date: string;
  discount_dzd: number;
  extras_dzd: number;
  status: OrderStatus;
  tracking_no: string | null;
  contract_number: string | null;
  contract_signed_on: string | null;
  client: {
    name: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    id_card_number: string | null;
    id_card_issued_at: string | null;
    id_card_issued_by: string | null;
    birth_date: string | null;
    birth_place: string | null;
  };
  car: {
    year: number;
    vin: string | null;
    list_price_dzd: number;
    location: CarLocation;
    brand: { name: string };
    model: { name: string };
    color: { name: string };
  };
  payments: {
    code: string;
    paid_on: string;
    amount_dzd: number;
    method: PaymentMethod;
  }[];
}

function Article({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="avoid-break mt-4">
      <h2 className="font-bold">
        Article {n} — {title}
      </h2>
      <div className="mt-1 space-y-1">{children}</div>
    </section>
  );
}

export default async function ContractPage({
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
        `id, code, order_date, discount_dzd, extras_dzd, status, tracking_no,
         contract_number, contract_signed_on,
         client:clients(name, address, city, phone, id_card_number, id_card_issued_at, id_card_issued_by, birth_date, birth_place),
         car:cars(year, vin, list_price_dzd, location, brand:brands(name), model:models(name), color:colors(name)),
         payments(code, paid_on, amount_dzd, method)`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("company_settings").select("*").maybeSingle(),
  ]);
  if (orderRes.error) throw new Error(orderRes.error.message);
  if (!orderRes.data) notFound();

  const order = orderRes.data as unknown as ContractOrder;
  const company = (companyRes.data ?? null) as CompanySettings | null;

  // Blockers → clear message instead of the document.
  const blockers = contractBlockers(order.client.id_card_number, company);
  if (blockers.length > 0) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-base font-semibold">
          Contrat non disponible pour {order.code}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Le contrat ne peut pas être établi tant que les points suivants ne
          sont pas réglés :
        </p>
        <ul className="mt-3 space-y-2">
          {blockers.map((b, i) => (
            <li key={i} className={`${warnCls} text-sm`}>
              {b}
            </li>
          ))}
        </ul>
        <Link
          href={`/orders/${order.id}`}
          className="mt-4 inline-block text-sm text-blue-700 hover:underline"
        >
          ← Retour à la commande
        </Link>
      </div>
    );
  }

  // Not blocked but not yet issued (direct navigation without the button).
  if (!order.contract_number) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-700">
          Le contrat de la commande <strong>{order.code}</strong> n’a pas encore
          été établi.
        </p>
        <Link
          href={`/orders/${order.id}`}
          className="mt-4 inline-block text-sm text-blue-700 hover:underline"
        >
          Aller à la commande pour l’établir
        </Link>
      </div>
    );
  }

  const listPrice = order.car.list_price_dzd;
  const total = listPrice - order.discount_dzd + order.extras_dzd;
  const paid = order.payments.reduce((s, p) => s + p.amount_dzd, 0);
  const balance = total - paid;
  const totalWords = montantEnLettresDZD(total);
  const payments = [...order.payments].sort((a, b) =>
    `${a.paid_on}#${a.code}`.localeCompare(`${b.paid_on}#${b.code}`)
  );
  const vehicle = `${order.car.brand.name} ${order.car.model.name} ${order.car.color.name}`;

  const idCardLine = [
    order.client.id_card_number && `N° ${order.client.id_card_number}`,
    order.client.id_card_issued_at &&
      `délivrée le ${formatDate(order.client.id_card_issued_at)}`,
    order.client.id_card_issued_by && `par ${order.client.id_card_issued_by}`,
  ]
    .filter(Boolean)
    .join(" ");
  const birthLine = [
    order.client.birth_date && `né(e) le ${formatDate(order.client.birth_date)}`,
    order.client.birth_place && `à ${order.client.birth_place}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <PrintToolbar backHref={`/orders/${order.id}`} />
      <div className="doc-sheet">
        {/* Title */}
        <div className="border-b border-gray-300 pb-3 text-center">
          <h1 className="font-bold uppercase">
            Contrat de vente de véhicule
          </h1>
          <p className="mt-1 font-semibold">N° {order.contract_number}</p>
          {order.contract_signed_on && (
            <p className="text-[11px] text-gray-600">
              Établi le {formatDate(order.contract_signed_on)}
            </p>
          )}
        </div>

        {/* Preamble: Entre les soussignés */}
        <section className="mt-4">
          <h2 className="font-bold">Entre les soussignés</h2>

          <div className="mt-2">
            <p className="font-semibold">Le Vendeur :</p>
            <div className="mt-1 text-[12px]">
              <CompanyHeader company={company} />
              {company?.capital_dzd && company.capital_dzd > 0 && (
                <p className="text-[11px] text-gray-600">
                  Capital social : {formatDZD(company.capital_dzd)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3">
            <p className="font-semibold">L’Acquéreur :</p>
            <div className="mt-1 text-[12px]">
              <p className="font-semibold">{order.client.name}</p>
              {birthLine && <p>{capitalizeFirst(birthLine)}</p>}
              {order.client.address && <p>{order.client.address}</p>}
              {order.client.city && <p>{order.client.city}</p>}
              {order.client.phone && (
                <p className="text-[11px] text-gray-600">
                  Tél : {order.client.phone}
                </p>
              )}
              {idCardLine && (
                <p className="text-[11px] text-gray-600">
                  Pièce d’identité : {idCardLine}
                </p>
              )}
            </div>
          </div>

          <p className="mt-3">Il a été convenu ce qui suit :</p>
        </section>

        <Article n={1} title="Objet">
          <p>
            Le Vendeur vend à l’Acquéreur, qui accepte, le véhicule automobile
            neuf importé désigné ci-après :
          </p>
          <ul className="ml-4 list-disc">
            <li>Marque et modèle : {vehicle}</li>
            <li>Année : {order.car.year}</li>
            <li>Couleur : {order.car.color.name}</li>
            <li>
              N° de châssis (VIN) : {order.car.vin ? order.car.vin : "—"}
            </li>
          </ul>
        </Article>

        <Article n={2} title="Prix">
          <p>
            Le prix de vente est fixé à <strong>{formatDZD(total)}</strong>
            {totalWords ? (
              <> ({capitalizeFirst(totalWords)})</>
            ) : null}
            .
          </p>
          <table className="mt-1 w-72 text-right text-[12px]">
            <tbody>
              <tr>
                <td className="py-0.5 text-gray-600">Prix catalogue</td>
                <td className="py-0.5">{formatDZD(listPrice)}</td>
              </tr>
              <tr>
                <td className="py-0.5 text-gray-600">Remise</td>
                <td className="py-0.5">− {formatDZD(order.discount_dzd)}</td>
              </tr>
              <tr>
                <td className="py-0.5 text-gray-600">Frais / options</td>
                <td className="py-0.5">+ {formatDZD(order.extras_dzd)}</td>
              </tr>
              <tr className="border-t border-gray-400">
                <td className="py-0.5 font-bold">Total</td>
                <td className="py-0.5 font-bold">{formatDZD(total)}</td>
              </tr>
            </tbody>
          </table>
        </Article>

        <Article n={3} title="Modalités de paiement">
          {payments.length > 0 ? (
            <>
              <p>Versements déjà effectués :</p>
              <table className="mt-1 w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-y border-gray-300 bg-gray-50 text-left">
                    <th className="px-2 py-1 font-semibold">Date</th>
                    <th className="px-2 py-1 font-semibold">Référence</th>
                    <th className="px-2 py-1 font-semibold">Mode</th>
                    <th className="px-2 py-1 text-right font-semibold">
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.code} className="border-b border-gray-200">
                      <td className="px-2 py-1">{formatDate(p.paid_on)}</td>
                      <td className="px-2 py-1">{p.code}</td>
                      <td className="px-2 py-1">{METHOD_FR[p.method]}</td>
                      <td className="px-2 py-1 text-right">
                        {formatDZD(p.amount_dzd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>Aucun versement n’a encore été effectué à ce jour.</p>
          )}
          <p className="mt-2">
            Total versé : <strong>{formatDZD(paid)}</strong> — Solde restant
            dû : <strong>{formatDZD(balance)}</strong>.
          </p>
        </Article>

        <Article n={4} title="Livraison">
          <p>
            État actuel de la commande :{" "}
            <strong>{STATUS_FR[order.status]}</strong> — Localisation du
            véhicule : <strong>{LOCATION_FR[order.car.location]}</strong>.
          </p>
          {order.tracking_no && (
            <p>Référence de suivi / expédition : {order.tracking_no}.</p>
          )}
          <p>
            La livraison sera effectuée après règlement intégral du prix, dans
            les conditions convenues entre les parties.
          </p>
        </Article>

        <Article n={5} title="Transfert de propriété">
          <p>
            Le transfert de propriété du véhicule à l’Acquéreur n’intervient
            qu’après paiement intégral du prix convenu et livraison effective du
            véhicule.
          </p>
        </Article>

        <Article n={6} title="Garantie">
          <p className="italic text-gray-600">
            À DÉFINIR — les conditions de garantie doivent être précisées par les
            parties.
          </p>
        </Article>

        <Article n={7} title="Litiges">
          <p className="italic text-gray-600">
            À DÉFINIR — la juridiction compétente en cas de litige doit être
            précisée par les parties.
          </p>
        </Article>

        {/* Place / date + signatures */}
        <div className="avoid-break mt-6">
          <p>
            Fait à {company?.city || "…………………"}, le{" "}
            {formatDate(order.contract_signed_on ?? order.order_date)}.
          </p>
          <div className="mt-6 flex justify-between gap-8">
            <div className="w-1/2 text-center">
              <p className="font-semibold">Le Vendeur</p>
              <p className="text-[11px] text-gray-600">Lu et approuvé</p>
              <div className="mt-12 border-t border-gray-400" />
            </div>
            <div className="w-1/2 text-center">
              <p className="font-semibold">L’Acquéreur</p>
              <p className="text-[11px] text-gray-600">Lu et approuvé</p>
              <div className="mt-12 border-t border-gray-400" />
            </div>
          </div>
        </div>

        <p className="contract-footer">
          Document généré — à faire vérifier par un conseil juridique avant
          signature.
        </p>
      </div>
    </>
  );
}
