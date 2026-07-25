import FactureTransit from "@/components/documents/FactureTransit";
import PrintToolbar from "@/components/documents/PrintToolbar";
import { TRANSIT_LINE_TEMPLATE, TransitInvoiceData } from "@/lib/transitLines";

// Design preview only — renders the owners' model values so the layout can be
// checked against their document before the transit schema exists. No database
// access. Replaced by the real /orders/[id]/facture-transit route once the
// tables are in place.
export const metadata = { title: "Aperçu Facture Transit — Kadex Auto DZ" };

const C = (v: number) => Math.round(v * 100);

const AMOUNTS: Record<number, { debours?: number; transit?: number }> = {
  2: { transit: C(5000) }, // Ouverture de dossier
  3: { debours: C(15000) }, // Programation visite
  4: { debours: C(15000) }, // Frais de visite
  6: { debours: C(728818) }, // Droit & Taxes
  8: { debours: C(78275.5) }, // Frais Magasinage
  10: { debours: C(8000) }, // Frais chèque
  11: { debours: C(11154.5) }, // Frais surestaries
  12: { transit: C(60000) }, // Commission de transit
  14: { debours: C(17505) }, // Echange
};

const preview: TransitInvoiceData = {
  number: "610/26",
  ref: "REP:610/26",
  place: "ALGER",
  invoice_date: "2026-06-14",
  client_name: "GOUMID ILHAM",
  designation: "VHL",
  poids_kg: 1350,
  nombre: "01 Colis",
  vehicle_label: "GEELY BINYUE",
  somme_avancee_centimes: C(978818),
  lines: TRANSIT_LINE_TEMPLATE.map((l) => ({
    position: l.position,
    label: l.label,
    underline: l.underline,
    debours_centimes: AMOUNTS[l.position]?.debours ?? null,
    transit_centimes: AMOUNTS[l.position]?.transit ?? null,
    observations: null,
  })),
};

export default function FactureTransitPreviewPage() {
  return (
    <>
      <PrintToolbar backHref="/orders" />
      <FactureTransit inv={preview} />
    </>
  );
}
