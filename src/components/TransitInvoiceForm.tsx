"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import {
  AmountProblem,
  checkAmount,
  formatCentimes,
  MAX_AMOUNT_CENTIMES,
  MAX_TOTAL_CENTIMES,
  parseCentimes,
  TVA_RATE_PERCENT,
} from "@/lib/money";
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
  warnCls,
} from "@/components/ui";

export interface TransitInvoiceFormData {
  id: string;
  number: string | null;
  issued_on: string | null;
  place: string;
  invoice_date: string;
  designation: string;
  poids_kg: number | null;
  nombre: string | null;
  somme_avancee_centimes: number;
  lines: TransitLine[];
}

const PROBLEM_TEXT: Record<AmountProblem, string> = {
  invalid: "Not a valid amount — use digits only, e.g. 78 275,50",
  negative: "Cannot be negative",
  too_large: `Above the ${formatCentimes(MAX_AMOUNT_CENTIMES)} limit`,
};

// Blank is legitimate — it prints as an empty cell. Anything else must parse.
function amountProblem(value: string): string | null {
  if (value.trim() === "") return null;
  const problem = checkAmount(value);
  return problem ? PROBLEM_TEXT[problem] : null;
}

// For totals and storage: blank and invalid both read as "no amount", so the
// preview stays usable while the staff member is still typing. Saving and
// issuing are blocked separately.
function amountValue(value: string): number | null {
  if (value.trim() === "") return null;
  return parseCentimes(value);
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
  // Once a number is assigned the document is fiscal: the database rejects any
  // further change, so the form stops offering them.
  const readOnly = invoice.number !== null;

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

  function setRow(
    position: number,
    key: "debours" | "transit" | "observations",
    value: string
  ) {
    setRows((rs) =>
      rs.map((r) => (r.position === position ? { ...r, [key]: value } : r))
    );
    touch();
  }

  // --- validation -----------------------------------------------------------
  const avanceeProblem =
    avancee.trim() === "" ? null : amountProblem(avancee);
  const rowProblems = rows.flatMap((r) => {
    const out: { label: string; message: string }[] = [];
    const d = amountProblem(r.debours);
    const t = amountProblem(r.transit);
    if (d) out.push({ label: `${r.label} — debours`, message: d });
    if (t) out.push({ label: `${r.label} — transit`, message: t });
    return out;
  });

  const totals = computeTransitTotals({
    lines: rows.map((r) => ({
      position: r.position,
      label: r.label,
      debours_centimes: amountValue(r.debours),
      transit_centimes: amountValue(r.transit),
      observations: r.observations || null,
    })),
    somme_avancee_centimes: parseCentimes(avancee) ?? 0,
  });

  // Beyond this the amount in words comes out blank on the printed document.
  const totalTooLarge =
    Math.abs(totals.totalNet) > MAX_TOTAL_CENTIMES ||
    Math.abs(totals.totalTTC) > MAX_TOTAL_CENTIMES;

  const problems = [
    ...rowProblems,
    ...(avanceeProblem
      ? [{ label: "Advance received", message: avanceeProblem }]
      : []),
    ...(totalTooLarge
      ? [
          {
            label: "Total",
            message: `The total exceeds ${formatCentimes(
              MAX_TOTAL_CENTIMES
            )} and could not be spelled out in words on the document.`,
          },
        ]
      : []),
  ];
  const blocked = problems.length > 0;

  // --- persistence ----------------------------------------------------------
  async function save(): Promise<boolean> {
    if (blocked) {
      setError("Fix the highlighted amounts first.");
      return false;
    }
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
        poids_kg:
          poidsValue != null && !Number.isNaN(poidsValue) ? poidsValue : null,
        nombre: nombre.trim() || null,
        somme_avancee_centimes: parseCentimes(avancee) ?? 0,
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
          debours_centimes: amountValue(r.debours),
          transit_centimes: amountValue(r.transit),
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

  async function saveAndIssue() {
    if (!(await save())) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("orderId", orderId);
      await issueTransitInvoice(fd);
    } catch (e) {
      // A redirect throws by design; anything else is a real failure.
      if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
      setBusy(false);
      setError(e instanceof Error ? e.message : "Could not issue the invoice.");
    }
  }

  const moneyInput = `${inputCls} text-right tabular-nums`;
  const printHref = `/orders/${orderId}/facture-transit`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!readOnly) void save();
      }}
      className="space-y-4"
    >
      {readOnly && (
        <div className={warnCls}>
          Issued as <strong>{invoice.number}</strong>
          {invoice.issued_on ? ` on ${formatDate(invoice.issued_on)}` : ""}. This
          is a final document — its amounts can no longer be changed. To correct
          it, issue a new transit invoice on a new order.
        </div>
      )}

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
              disabled={readOnly}
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
              disabled={readOnly}
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
              disabled={readOnly}
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
              disabled={readOnly}
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
              disabled={readOnly}
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
              disabled={readOnly}
              inputMode="decimal"
              aria-invalid={avanceeProblem ? true : undefined}
              value={avancee}
              onChange={(e) => {
                setAvancee(e.target.value);
                touch();
              }}
            />
            {avanceeProblem && (
              <p className="mt-1 text-xs text-red-600">{avanceeProblem}</p>
            )}
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
              {rows.map((r) => {
                const dProblem = amountProblem(r.debours);
                const tProblem = amountProblem(r.transit);
                return (
                  <tr key={r.position}>
                    <td className="px-3 py-2 text-sm text-gray-700">{r.label}</td>
                    <td className="px-3 py-2 align-top">
                      <input
                        aria-label={`${r.label} — debours`}
                        aria-invalid={dProblem ? true : undefined}
                        className={moneyInput}
                        disabled={readOnly}
                        inputMode="decimal"
                        value={r.debours}
                        onChange={(e) =>
                          setRow(r.position, "debours", e.target.value)
                        }
                      />
                      {dProblem && (
                        <p className="mt-1 text-xs text-red-600">{dProblem}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        aria-label={`${r.label} — transit`}
                        aria-invalid={tProblem ? true : undefined}
                        className={moneyInput}
                        disabled={readOnly}
                        inputMode="decimal"
                        value={r.transit}
                        onChange={(e) =>
                          setRow(r.position, "transit", e.target.value)
                        }
                      />
                      {tProblem && (
                        <p className="mt-1 text-xs text-red-600">{tProblem}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        aria-label={`${r.label} — observations`}
                        className={inputCls}
                        disabled={readOnly}
                        value={r.observations}
                        onChange={(e) =>
                          setRow(r.position, "observations", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
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
            <dd>{formatCentimes(parseCentimes(avancee) ?? 0)}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-300 pt-2 font-semibold">
            <dt>Total net</dt>
            <dd className={totals.totalNet < 0 ? "text-emerald-600" : ""}>
              {formatCentimes(totals.totalNet)}
            </dd>
          </div>
        </dl>
        {totals.totalNet < 0 && !blocked && (
          <p className="mt-3 text-right text-xs text-gray-500">
            Negative — the document prints “(en faveur du client)”.
          </p>
        )}
      </div>

      {problems.length > 0 && (
        <div className={errorCls}>
          <p className="font-semibold">
            {problems.length === 1
              ? "One amount needs fixing before this can be saved or issued:"
              : `${problems.length} amounts need fixing before this can be saved or issued:`}
          </p>
          <ul className="mt-1 list-inside list-disc">
            {problems.map((p, i) => (
              <li key={i}>
                {p.label}: {p.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className={errorCls}>{error}</p>}
      {saved && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {readOnly ? (
          <Link href={printHref} className={btnPrimary}>
            Print {invoice.number}
          </Link>
        ) : (
          <>
            <button
              type="submit"
              disabled={busy || blocked}
              className={btnSecondary}
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={busy || blocked}
              onClick={() => void saveAndIssue()}
              className={btnPrimary}
            >
              Save, issue &amp; print
            </button>
          </>
        )}
      </div>
    </form>
  );
}
