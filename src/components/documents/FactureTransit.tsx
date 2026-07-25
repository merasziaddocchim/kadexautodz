import { formatDate } from "@/lib/format";
import { formatCentimes } from "@/lib/money";
import {
  capitalizeFirst,
  montantCentimesEnLettresDZD,
} from "@/lib/numberToFrenchWords";
import {
  computeTransitTotals,
  TransitInvoiceData,
} from "@/lib/transitLines";

// Facture Transit — reproduces the owners' template. Presentational only:
// it takes fully-resolved data so it can render from the database or from a
// static preview.
export default function FactureTransit({ inv }: { inv: TransitInvoiceData }) {
  const t = computeTransitTotals(inv);
  const netWords = montantCentimesEnLettresDZD(t.totalNet);

  // Pad the goods table to 4 rows like the model.
  const goodsRows: { designation: string; poids: string; nombre: string }[] = [
    {
      designation: inv.designation,
      poids: inv.poids_kg != null ? String(inv.poids_kg) : "",
      nombre: inv.nombre ?? "",
    },
    { designation: inv.vehicle_label, poids: "", nombre: "" },
    { designation: "", poids: "", nombre: "" },
  ];

  const cell = "border border-black px-1 py-[2px]";

  return (
    <div className="doc-sheet">
      {/* Header: title box + place/date + client box */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex h-28 w-56 flex-col justify-between rounded-2xl border border-black p-3">
          <p className="text-lg font-bold">Facture Transit</p>
          <div className="mx-auto w-24 border-t-2 border-black" />
        </div>
        <div className="flex-1">
          <p className="text-right text-[12px]">
            {inv.place} le: {formatDate(inv.invoice_date)}
          </p>
          <div className="mt-2 flex h-20 items-start rounded-2xl border border-black px-4 py-3">
            <p className="text-base font-bold">{inv.client_name}</p>
          </div>
        </div>
      </div>

      {/* Reference + invoice number */}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[12px] font-bold">{inv.ref}</p>
        <p className="pr-16 text-lg font-bold">Facture {inv.number}</p>
      </div>

      {/* Goods table */}
      <div className="mt-6 pl-16">
        <div className="mb-1 w-24 border-t-2 border-black" />
        <table className="w-[420px] border-collapse text-center text-[12px]">
          <thead>
            <tr>
              <th className={`${cell} font-normal`}>DESIGNATION</th>
              <th className={`${cell} font-normal`}>POIDS: Kg</th>
              <th className={`${cell} font-normal`}>NOMBRE</th>
            </tr>
          </thead>
          <tbody>
            {goodsRows.map((r, i) => (
              <tr key={i}>
                <td className={`${cell} font-bold`}>{r.designation}</td>
                <td className={`${cell} font-bold`}>{r.poids}</td>
                <td className={`${cell} font-bold`}>{r.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cost grid: labels on the left, DEBOURS / TRANSIT / OBSERVATIONS */}
      <div className="mt-6 flex gap-4">
        <ul className="w-64 pt-[26px] text-[12px] leading-[19px]">
          {inv.lines.map((l) => (
            <li
              key={l.position}
              className={`${
                l.underline ? "underline" : ""
              } ${lineIsBold(l.label) ? "font-bold" : ""}`}
            >
              {l.label}
            </li>
          ))}
        </ul>

        <table className="flex-1 border-collapse text-[12px]">
          <thead>
            <tr>
              <th className={`${cell} w-1/3 font-normal`}>DEBOURS</th>
              <th className={`${cell} w-1/3 font-normal`}>TRANSIT</th>
              <th className={`${cell} w-1/3 font-normal`}>OBSERVATIONS</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.position}>
                <td className={`${cell} h-[19px] text-right font-bold`}>
                  {l.debours_centimes != null
                    ? formatCentimes(l.debours_centimes)
                    : ""}
                </td>
                <td className={`${cell} text-right font-bold`}>
                  {l.transit_centimes != null
                    ? formatCentimes(l.transit_centimes)
                    : ""}
                </td>
                <td className={cell}>{l.observations ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="avoid-break mt-2 flex justify-end">
        <table className="text-[12px]">
          <tbody>
            <tr>
              <td className="pr-4 text-left text-base">Total Partiel</td>
              <td className="border border-black px-2 text-right font-bold">
                {formatCentimes(t.totalPartiel)}
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-left text-base">
                TVA {9}%
              </td>
              <td className="border border-black px-2 text-right font-bold">
                {formatCentimes(t.tva)}
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-left">Somme avancée</td>
              <td className="border border-black px-2 text-right font-bold">
                {formatCentimes(inv.somme_avancee_centimes)}
              </td>
            </tr>
            <tr>
              <td className="pt-2 pr-4 text-left text-lg font-bold">
                TOTAL NET
              </td>
              <td className="border border-black px-2 text-right text-lg font-bold">
                {formatCentimes(t.totalNet)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mr-8 text-right text-[12px]">SAUF ERREUR OU OMISSION</p>

      {/* Amount in words */}
      <div className="avoid-break mt-8">
        <p className="text-[12px] font-bold">
          Arrêtée la présente facture à la somme de :{" "}
          <span className="font-normal">
            {netWords ? capitalizeFirst(netWords) : ""}
            {netWords && t.totalNet < 0 ? " (en faveur du client)" : ""}
          </span>
        </p>
      </div>
    </div>
  );
}

// The owners' template shows most labels in bold, a few in regular weight.
const REGULAR_WEIGHT = new Set([
  "Frais d'expertise",
  "Frais restitution TC Vide",
  "Frais Depassement Main levee",
  "Frais de Transport",
  "Frais de dépotage",
  "Timbre 1%",
]);

function lineIsBold(label: string): boolean {
  return !REGULAR_WEIGHT.has(label);
}
