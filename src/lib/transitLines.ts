// The fixed line items of the Facture Transit, in the owners' order.
// Labels are kept VERBATIM from their model (including "Programation" and
// "Depassement Main levee") so the printed document matches what they use.
// `underline` marks the two labels shown underlined on their template.
export interface TransitLineTemplate {
  position: number;
  label: string;
  underline?: boolean;
}

export const TRANSIT_LINE_TEMPLATE: TransitLineTemplate[] = [
  { position: 1, label: "Quittance TVN", underline: true },
  { position: 2, label: "Ouverture de dossier" },
  { position: 3, label: "Programation visite" },
  { position: 4, label: "Frais de visite" },
  { position: 5, label: "Frais d'expertise" },
  { position: 6, label: "Droit & Taxes", underline: true },
  { position: 7, label: "Frais restitution TC Vide" },
  { position: 8, label: "Frais Magasinage" },
  { position: 9, label: "Frais Depassement Main levee" },
  { position: 10, label: "Frais chèque" },
  { position: 11, label: "Frais surestaries" },
  { position: 12, label: "Commission de transit :" },
  { position: 13, label: "Frais de Transport" },
  { position: 14, label: "Echange" },
  { position: 15, label: "Frais de dépotage" },
  { position: 16, label: "Timbre 1%" },
];

// A line as rendered/stored: amounts are bigint CENTIMES, null = blank row.
export interface TransitLine {
  position: number;
  label: string;
  underline?: boolean;
  debours_centimes: number | null;
  transit_centimes: number | null;
  observations: string | null;
}

export interface TransitInvoiceData {
  number: string; // "610/26"
  ref: string; // "REP:610/26"
  place: string; // "ALGER"
  invoice_date: string; // ISO
  client_name: string; // "GOUMID ILHAM"
  designation: string; // "VHL"
  poids_kg: number | null; // 1350
  nombre: string | null; // "01 Colis"
  vehicle_label: string; // "GEELY BINYUE"
  somme_avancee_centimes: number;
  lines: TransitLine[];
}

export function computeTransitTotals(inv: {
  lines: TransitLine[];
  somme_avancee_centimes: number;
}) {
  const deboursTotal = inv.lines.reduce(
    (s, l) => s + (l.debours_centimes ?? 0),
    0
  );
  const transitTotal = inv.lines.reduce(
    (s, l) => s + (l.transit_centimes ?? 0),
    0
  );
  const totalPartiel = deboursTotal + transitTotal;
  // TVA 9% on the TRANSIT column only — debours are untaxed.
  const tva = Math.round((transitTotal * 9) / 100);
  const totalTTC = totalPartiel + tva;
  const totalNet = totalTTC - inv.somme_avancee_centimes;
  return { deboursTotal, transitTotal, totalPartiel, tva, totalTTC, totalNet };
}
