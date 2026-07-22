"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { formatDZD, parseDzd } from "@/lib/format";
import { CAR_LOCATIONS, CarLocation, LOCATION_LABELS } from "@/lib/types";
import ConfirmButton from "@/components/ConfirmButton";
import {
  btnPrimary,
  btnSecondary,
  cardCls,
  errorCls,
  inputCls,
  labelCls,
} from "@/components/ui";

export interface CarFormInitial {
  brand_id: string;
  model_id: string;
  color_id: string;
  year: number;
  vin: string;
  wholesale_price_dzd: number;
  import_fees_dzd: number;
  list_price_dzd: number;
  location: CarLocation;
}

export default function CarForm({
  mode,
  carId,
  code,
  brands,
  models,
  colors,
  initial,
}: {
  mode: "create" | "edit";
  carId?: string;
  code: string;
  brands: { id: string; name: string }[];
  models: { id: string; brand_id: string; name: string }[];
  colors: { id: string; name: string }[];
  initial?: CarFormInitial;
}) {
  const [brandId, setBrandId] = useState(initial?.brand_id ?? "");
  const [modelId, setModelId] = useState(initial?.model_id ?? "");
  const [colorId, setColorId] = useState(initial?.color_id ?? "");
  const [year, setYear] = useState(String(initial?.year ?? 2026));
  const [vin, setVin] = useState(initial?.vin ?? "");
  const [wholesale, setWholesale] = useState(
    String(initial?.wholesale_price_dzd ?? "")
  );
  const [fees, setFees] = useState(String(initial?.import_fees_dzd ?? "0"));
  const [list, setList] = useState(String(initial?.list_price_dzd ?? ""));
  const [location, setLocation] = useState<CarLocation>(
    initial?.location ?? "china_warehouse"
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const brandModels = models.filter((m) => m.brand_id === brandId);
  const wholesaleN = parseDzd(wholesale);
  const feesN = parseDzd(fees);
  const listN = parseDzd(list);
  const landed = wholesaleN + feesN;
  const margin = listN - landed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!brandId || !modelId || !colorId) {
      setError("Brand, model, and color are required.");
      return;
    }
    const yearN = parseInt(year, 10);
    if (Number.isNaN(yearN) || yearN < 2000 || yearN > 2100) {
      setError("Enter a valid year.");
      return;
    }
    if (wholesaleN <= 0 || listN <= 0) {
      setError("Wholesale and list prices are required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      brand_id: brandId,
      model_id: modelId,
      color_id: colorId,
      year: yearN,
      vin: vin.trim() || null,
      wholesale_price_dzd: wholesaleN,
      import_fees_dzd: feesN,
      list_price_dzd: listN,
      location,
    };
    const { error } =
      mode === "create"
        ? await supabase.from("cars").insert({ code, ...payload })
        : await supabase.from("cars").update(payload).eq("id", carId!);
    if (error) {
      setError(friendlyError(error, "car"));
      setSaving(false);
      return;
    }
    window.location.assign("/inventory");
  }

  async function deleteCar() {
    setError(null);
    const { error } = await createClient()
      .from("cars")
      .delete()
      .eq("id", carId!);
    if (error) {
      setError(
        error.code === "23503"
          ? `Cannot delete ${code}: an order references this car. Delete or re-assign that order first.`
          : friendlyError(error, "car")
      );
      return;
    }
    window.location.assign("/inventory");
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardCls} max-w-2xl p-5`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Car code</label>
          <input className={inputCls} value={code} disabled />
        </div>
        <div>
          <label className={labelCls} htmlFor="year">
            Year *
          </label>
          <input
            id="year"
            type="number"
            min={2000}
            max={2100}
            required
            className={inputCls}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="brand">
            Brand *
          </label>
          <select
            id="brand"
            required
            className={inputCls}
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setModelId("");
            }}
          >
            <option value="">Select brand…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="model">
            Model *
          </label>
          <select
            id="model"
            required
            disabled={!brandId}
            className={inputCls}
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            <option value="">
              {brandId ? "Select model…" : "Select a brand first"}
            </option>
            {brandModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="color">
            Color *
          </label>
          <select
            id="color"
            required
            className={inputCls}
            value={colorId}
            onChange={(e) => setColorId(e.target.value)}
          >
            <option value="">Select color…</option>
            {colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="location">
            Location *
          </label>
          <select
            id="location"
            className={inputCls}
            value={location}
            onChange={(e) => setLocation(e.target.value as CarLocation)}
          >
            {CAR_LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {LOCATION_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="vin">
            VIN
          </label>
          <input
            id="vin"
            className={inputCls}
            value={vin}
            onChange={(e) => setVin(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="wholesale">
            Wholesale price (DZD) *
          </label>
          <input
            id="wholesale"
            type="number"
            min={0}
            step={1}
            required
            className={inputCls}
            value={wholesale}
            onChange={(e) => setWholesale(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="fees">
            Import fees (DZD)
          </label>
          <input
            id="fees"
            type="number"
            min={0}
            step={1}
            className={inputCls}
            value={fees}
            onChange={(e) => setFees(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="list">
            List price (DZD) *
          </label>
          <input
            id="list"
            type="number"
            min={0}
            step={1}
            required
            className={inputCls}
            value={list}
            onChange={(e) => setList(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm">
        <dl className="space-y-1">
          <div className="flex justify-between">
            <dt className="text-gray-500">Landed cost (wholesale + fees)</dt>
            <dd>{formatDZD(landed)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Margin (list − landed)</dt>
            <dd className={margin < 0 ? "text-red-600" : "text-emerald-700"}>
              {formatDZD(margin)}
            </dd>
          </div>
        </dl>
      </div>

      {error && <p className={`${errorCls} mt-4`}>{error}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : mode === "create" ? "Add car" : "Save changes"}
        </button>
        <a href="/inventory" className={btnSecondary}>
          Cancel
        </a>
        {mode === "edit" && (
          <ConfirmButton
            label="Delete"
            title={`Delete ${code}?`}
            message="This permanently removes the car. Cars referenced by an order cannot be deleted."
            confirmLabel="Delete"
            onConfirm={deleteCar}
            className={`${btnSecondary} ml-auto text-red-600`}
          />
        )}
      </div>
    </form>
  );
}
