"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { formatDZD, parseDzd } from "@/lib/format";
import SearchableSelect, { Option } from "@/components/SearchableSelect";
import {
  btnPrimary,
  btnSecondary,
  cardCls,
  errorCls,
  inputCls,
  labelCls,
} from "@/components/ui";

export interface CarOption {
  id: string;
  label: string;
  listPrice: number;
}

export interface OrderFormInitial {
  client_id: string;
  car_id: string;
  order_date: string;
  discount_dzd: number;
  extras_dzd: number;
  tracking_no: string;
  notes: string;
}

export default function OrderForm({
  mode,
  orderId,
  code,
  clients,
  cars,
  initial,
}: {
  mode: "create" | "edit";
  orderId?: string;
  code: string;
  clients: Option[];
  cars: CarOption[];
  initial?: OrderFormInitial;
}) {
  const [clientId, setClientId] = useState<string | null>(
    initial?.client_id ?? null
  );
  const [carId, setCarId] = useState<string | null>(initial?.car_id ?? null);
  const [orderDate, setOrderDate] = useState(initial?.order_date ?? "");
  const [discount, setDiscount] = useState(
    initial ? String(initial.discount_dzd) : "0"
  );
  const [extras, setExtras] = useState(
    initial ? String(initial.extras_dzd) : "0"
  );
  const [tracking, setTracking] = useState(initial?.tracking_no ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const car = cars.find((c) => c.id === carId) ?? null;
  const discountN = parseDzd(discount);
  const extrasN = parseDzd(extras);
  const total = car ? car.listPrice - discountN + extrasN : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clientId || !carId || !orderDate) {
      setError("Client, car, and order date are required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      client_id: clientId,
      car_id: carId,
      order_date: orderDate,
      discount_dzd: discountN,
      extras_dzd: extrasN,
      tracking_no: tracking.trim() || null,
      notes: notes.trim() || null,
    };
    if (mode === "create") {
      const { data, error } = await supabase
        .from("orders")
        .insert({ code, ...payload })
        .select("id")
        .single();
      if (error) {
        setError(friendlyError(error, "order"));
        setSaving(false);
        return;
      }
      window.location.assign(`/orders/${data.id}`);
    } else {
      const { error } = await supabase
        .from("orders")
        .update(payload)
        .eq("id", orderId!);
      if (error) {
        setError(friendlyError(error, "order"));
        setSaving(false);
        return;
      }
      window.location.assign(`/orders/${orderId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardCls} max-w-2xl p-5`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Order code</label>
          <input className={inputCls} value={code} disabled />
        </div>
        <div>
          <label className={labelCls} htmlFor="order_date">
            Order date *
          </label>
          <input
            id="order_date"
            type="date"
            required
            className={inputCls}
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Client *</label>
          <SearchableSelect
            options={clients}
            value={clientId}
            onChange={setClientId}
            placeholder="Search client…"
          />
        </div>
        <div>
          <label className={labelCls}>Car (available only) *</label>
          <SearchableSelect
            options={cars.map((c) => ({ value: c.id, label: c.label }))}
            value={carId}
            onChange={setCarId}
            placeholder="Search car…"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="discount">
            Discount (DZD)
          </label>
          <input
            id="discount"
            type="number"
            min={0}
            step={1}
            className={inputCls}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="extras">
            Extras (DZD)
          </label>
          <input
            id="extras"
            type="number"
            min={0}
            step={1}
            className={inputCls}
            value={extras}
            onChange={(e) => setExtras(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="tracking">
            Tracking no.
          </label>
          <input
            id="tracking"
            className={inputCls}
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
          />
        </div>
        <div>
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

      <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm">
        {car ? (
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt className="text-gray-500">List price</dt>
              <dd>{formatDZD(car.listPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">− Discount</dt>
              <dd>{formatDZD(discountN)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">+ Extras</dt>
              <dd>{formatDZD(extrasN)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold">
              <dt>Total</dt>
              <dd>{formatDZD(total!)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-gray-400">Select a car to see the total.</p>
        )}
      </div>

      {error && <p className={`${errorCls} mt-4`}>{error}</p>}

      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving
            ? "Saving…"
            : mode === "create"
            ? "Create order"
            : "Save changes"}
        </button>
        <a
          href={mode === "edit" && orderId ? `/orders/${orderId}` : "/orders"}
          className={btnSecondary}
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
