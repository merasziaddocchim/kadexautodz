"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { formatDZD, parseDzd } from "@/lib/format";
import { METHOD_LABELS, PAYMENT_METHODS, PaymentMethod } from "@/lib/types";
import SearchableSelect from "@/components/SearchableSelect";
import {
  btnPrimary,
  btnSecondary,
  cardCls,
  errorCls,
  inputCls,
  labelCls,
  warnCls,
} from "@/components/ui";

export interface PaymentOrderOption {
  id: string;
  label: string;
  balance: number;
}

export default function PaymentForm({
  code,
  orders,
  initialOrderId,
  defaultDate,
}: {
  code: string;
  orders: PaymentOrderOption[];
  initialOrderId?: string;
  defaultDate: string;
}) {
  const [orderId, setOrderId] = useState<string | null>(
    initialOrderId && orders.some((o) => o.id === initialOrderId)
      ? initialOrderId
      : null
  );
  const [paidOn, setPaidOn] = useState(defaultDate);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const order = orders.find((o) => o.id === orderId) ?? null;
  const amountN = parseDzd(amount);
  const exceedsBalance = order !== null && amountN > order.balance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!orderId || !paidOn) {
      setError("Order and date are required.");
      return;
    }
    if (amountN <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    setSaving(true);
    const { error } = await createClient().from("payments").insert({
      code,
      order_id: orderId,
      paid_on: paidOn,
      amount_dzd: amountN,
      method,
      notes: notes.trim() || null,
    });
    if (error) {
      setError(friendlyError(error, "payment"));
      setSaving(false);
      return;
    }
    window.location.assign(
      initialOrderId ? `/orders/${initialOrderId}` : "/payments"
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardCls} max-w-xl p-5`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Payment code</label>
          <input className={inputCls} value={code} disabled />
        </div>
        <div>
          <label className={labelCls} htmlFor="paid_on">
            Paid on *
          </label>
          <input
            id="paid_on"
            type="date"
            required
            className={inputCls}
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Order *</label>
          <SearchableSelect
            options={orders.map((o) => ({ value: o.id, label: o.label }))}
            value={orderId}
            onChange={setOrderId}
            placeholder="Search order…"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="amount">
            Amount (DZD) *
          </label>
          <input
            id="amount"
            type="number"
            min={1}
            step={1}
            required
            className={inputCls}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="method">
            Method *
          </label>
          <select
            id="method"
            className={inputCls}
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="notes">
            Notes
          </label>
          <input
            id="notes"
            className={inputCls}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {order && (
        <p className="mt-3 text-sm text-gray-500">
          Current balance: {formatDZD(order.balance)}
        </p>
      )}
      {exceedsBalance && (
        <p className={`${warnCls} mt-2`}>
          This amount is {formatDZD(amountN - order!.balance)} more than the
          remaining balance. You can still save it.
        </p>
      )}
      {error && <p className={`${errorCls} mt-4`}>{error}</p>}

      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : "Add payment"}
        </button>
        <a
          href={initialOrderId ? `/orders/${initialOrderId}` : "/payments"}
          className={btnSecondary}
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
