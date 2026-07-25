"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { formatCentimes, parseCentimes, TVA_RATE_PERCENT } from "@/lib/money";
import { computeTransitTotals, TransitLine } from "@/lib/transitLines";
import { issueTransitInvoice } from "@/lib/transitActions";
import {
  btnPrimary,
  btnSecondary,
  cardCls,
  errorCls,
  inputCls,
  labelCls,
  thCls,
} from "@/components/ui";

export interface TransitInvoiceFormData {
  id: string;
  number: string | null;
  place: string;
  invoice_date: string;
  designation: string;
  poids_kg: number | null;
  nombre: string | null;
  somme_avancee_centimes: number;
  lines: TransitLine[];
}

// Staff enter every cost line here. Amounts are typed in dinars with centimes
// ("78 275,50") and stored as bigint centimes. A blank amount stays blank on
// the printed document — it is not zero.
export default function TransitInvoiceForm({
  orderId,
  invoice,
}: {
  orderId: string;
  invoice: TransitInvoiceFormData;
}) {
  const [place, setPlace] = useState(invoice.place);
  const [invoiceDate, setInvoiceDate] = useState(invoice.invoice_date);
  const [designation, setDesignation] = useState(invoice.designation);
  const [poids, setPoids] = useState(
    invoice.poids_kg != null ? String(invoice.poids_kg) : ""
  );
  const [nombre, setNombre] = useState(invoice.nombre ?? "");
  const [avancee, setAvancee] = useState(
    formatCentimes(invoice.somme_avancee_centimes)
  );
  const [rows, setRows] = useState(() =>
    invoice.lines.map((l) => ({
      position: l.position,
      label: l.label,
      debours: l.debours_centimes != null ? formatCentimes(l.debours_centimes) : "",
      transit: l.transit_centimes != null ? formatCentimes(l.transit_centimes) : "",
      observations: l.observations ?? "",
    }))
  );

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function touch() {
    setSaved(false);
  }

  function setRow(position: number, key: "debours" | "transit" | "observations", value: string) {
    setRows((rs) =>
      rs.map((r) => (r.position === position ? { ...r, [key]: value } : r))
    );
    touch();
  }

  // Blank stays blank (null); anything else becomes centimes.
  function amount(value: string): number | null {
    return value.trim() === "" ? null : parseCentimes(value);
  }

  const totals = computeTransitTotals({
    lines: rows.map((r) => ({
      position: r.position,
      label: r.label,
      debours_centimes: amount(r.debours),
      transit_centimes: amount(r.transit),
      observations: r.observations || null,
    })),
    somme_avancee_centimes: parseCentimes(avancee),
  });

  async function save(): Promise<boolean> {
    setError(null);
    setBusy(true);
    const supabase = createClient();

    const poidsValue = poids.trim() === "" ? null : parseInt(poids, 10);

    const { error: headError } = await supabase
      .from("transit_invoices")
      .update({
        place: place.trim() || "ALGER",
        invoice_date: invoiceDate,
        designation: designation.trim() || "VHL",
        poids_kg: poidsValue != null && !Number.isNaN(poidsValue) ? poidsValue : null,
        nombre: nombre.trim() || null,
        somme_avancee_centimes: parseCentimes(avancee),
      })
      .eq("id", invoice.id);
    if (headError) {
      setError(friendlyError(headError, "transit invoice"));
      setBusy(false);
      return false;
    }

    const { error: lineError } = await supabase
      .from("transit_invoice_lines")
      .upsert(
        rows.map((r) => ({
          transit_invoice_id: invoice.id,
          position: r.position,
          label: r.label,
          debours_centimes: amount(r.debours),
          transit_centimes: amount(r.transit),
          observations: r.observations.trim() || null,
        })),
        { onConflict: "transit_invoice_id,position" }
      );
    if (lineError) {
      setError(friendlyError(lineError, "transit invoice"));
      setBusy(false);
      return false;
    }

    setBusy(false);
    setSaved(true);
    return true;
  }

  async function saveAndPrint() {
    if (!(await save())) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("orderId", orderId);
    await issueTransitInvoice(fd);
  }

  const moneyInput = `${inputCls} text-right tabular-nums`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-4"
    >
      <div className={`${cardCls} p-5`}>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Header</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="place">
              Place
            </label>
            <input
              id="place"
              className={inputCls}
              value={place}
              onChange={(e) => {
                setPlace(e.target.value);
                touch();
              }}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="invoice_date">
              Invoice date
            </label>
            <input
              id="invoice_date"
              type="date"
              className={inputCls}
              value={invoiceDate}
              onChange={(e) => {
                setInvoiceDate(e.target.value);
                touch();
              }}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="designation">
              Designation
            </label>
            <input
              id="designation"
              className={inputCls}
              value={designation}
              onChange={(e) => {
                setDesignation(e.target.value);
                touch();
              }}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="poids_kg">
              Weight (kg)
            </label>
            <input
              id="poids_kg"
              type="number"
              min={0}
              step={1}
              className={inputCls}
              value={poids}
              onChange={(e) => {
                setPoids(e.target.value);
                touch();
              }}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="nombre">
              Number of packages
            </label>
            <input
              id="nombre"
              className={inputCls}
              placeholder="01 Colis"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                touch();
              }}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="avancee">
              Advance received (DZD)
            </label>
            <input
              id="avancee"
              className={moneyInput}
              inputMode="decimal"
              value={avancee}
              onChange={(e) => {
                setAvancee(e.target.value);
                touch();
              }}
            />
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="px-5 py-3 text-sm font-semibold text-gray-700">
          Cost lines
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={thCls}>Line</th>
                <th className={`${thCls} text-right`}>Debours</th>
                <th className={`${thCls} text-right`}>Transit</th>
                <th className={thCls}>Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.position}>
                  <td className="px-3 py-2 text-sm text-gray-700">{r.label}</td>
                  <td className="px-3 py-2">
                    <input
                      aria-label={`${r.label} — debours`}
                      className={moneyInput}
                      inputMode="decimal"
                      value={r.debours}
                      onChange={(e) =>
                        setRow(r.position, "debours", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      aria-label={`${r.label} — transit`}
                      className={moneyInput}
                      inputMode="decimal"
                      value={r.transit}
                      onChange={(e) =>
                        setRow(r.position, "transit", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      aria-label={`${r.label} — observations`}
                      className={inputCls}
                      value={r.observations}
                      onChange={(e) =>
                        setRow(r.position, "observations", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`${cardCls} p-5`}>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Totals</h2>
        <dl className="ml-auto max-w-sm space-y-2 text-sm tabular-nums">
          <div className="flex justify-between">
            <dt className="text-gray-500">Debours</dt>
            <dd>{formatCentimes(totals.deboursTotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Transit</dt>
            <dd>{formatCentimes(totals.transitTotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <dt className="text-gray-500">Total partiel</dt>
            <dd>{formatCentimes(totals.totalPartiel)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">
              TVA {TVA_RATE_PERCENT}% (transit only)
            </dt>
            <dd>{formatCentimes(totals.tva)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">− Advance received</dt>
            <dd>{formatCentimes(parseCentimes(avancee))}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-300 pt-2 font-semibold">
            <dt>Total net</dt>
            <dd className={totals.totalNet < 0 ? "text-emerald-600" : ""}>
              {formatCentimes(totals.totalNet)}
            </dd>
          </div>
        </dl>
        {totals.totalNet < 0 && (
          <p className="mt-3 text-right text-xs text-gray-500">
            Negative — the document prints “(en faveur du client)”.
          </p>
        )}
      </div>

      {error && <p className={errorCls}>{error}</p>}
      {saved && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className={btnSecondary}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveAndPrint()}
          className={btnPrimary}
        >
          {invoice.number
            ? `Save & print ${invoice.number}`
            : "Save, issue & print"}
        </button>
      </div>
    </form>
  );
}
