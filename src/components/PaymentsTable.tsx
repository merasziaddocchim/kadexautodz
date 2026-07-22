"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import ConfirmButton from "@/components/ConfirmButton";
import { cardCls, errorCls, inputCls, tdCls, thCls } from "@/components/ui";
import { formatDate, formatDZD } from "@/lib/format";
import { METHOD_LABELS, PaymentMethod } from "@/lib/types";

export interface PaymentRow {
  id: string;
  code: string;
  orderId: string;
  orderCode: string;
  client: string;
  paidOn: string;
  amount: number;
  method: PaymentMethod;
  notes: string;
}

export default function PaymentsTable({ rows }: { rows: PaymentRow[] }) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        [r.code, r.orderCode, r.client, METHOD_LABELS[r.method]]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : rows;

  async function deletePayment(id: string, code: string) {
    setError(null);
    const { error } = await createClient()
      .from("payments")
      .delete()
      .eq("id", id);
    if (error) {
      setError(`${code}: ${friendlyError(error, "payment")}`);
      return;
    }
    window.location.reload();
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search code, order, client…"
          className={`${inputCls} max-w-xs`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-xs text-gray-400">
          {filtered.length} of {rows.length}
        </span>
      </div>
      {error && <p className={`${errorCls} mb-3`}>{error}</p>}
      <div className={`${cardCls} overflow-x-auto`}>
        <table className="w-full min-w-[800px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={thCls}>Code</th>
              <th className={thCls}>Order</th>
              <th className={thCls}>Client</th>
              <th className={thCls}>Date</th>
              <th className={`${thCls} text-right`}>Amount</th>
              <th className={thCls}>Method</th>
              <th className={thCls}>Notes</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-blue-50/40">
                <td className={`${tdCls} font-medium`}>{r.code}</td>
                <td className={tdCls}>
                  <Link
                    href={`/orders/${r.orderId}`}
                    className="text-blue-700 hover:underline"
                  >
                    {r.orderCode}
                  </Link>
                </td>
                <td className={tdCls}>{r.client}</td>
                <td className={tdCls}>{formatDate(r.paidOn)}</td>
                <td className={`${tdCls} text-right`}>{formatDZD(r.amount)}</td>
                <td className={tdCls}>{METHOD_LABELS[r.method]}</td>
                <td className={`${tdCls} text-gray-500`}>{r.notes || "—"}</td>
                <td className={`${tdCls} text-right`}>
                  <ConfirmButton
                    label="Delete"
                    title={`Delete ${r.code}?`}
                    message={`This removes the ${formatDZD(
                      r.amount
                    )} payment on ${r.orderCode}. The order balance goes back up.`}
                    confirmLabel="Delete"
                    onConfirm={() => deletePayment(r.id, r.code)}
                    className="text-sm text-red-600 hover:underline"
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className={`${tdCls} text-gray-400`} colSpan={8}>
                  No payments match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
