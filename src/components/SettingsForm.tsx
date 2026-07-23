"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { parseDzd } from "@/lib/format";
import { CompanySettings } from "@/lib/company";
import {
  btnPrimary,
  cardCls,
  errorCls,
  inputCls,
  labelCls,
} from "@/components/ui";

type TextField = Exclude<keyof CompanySettings, "id" | "capital_dzd">;

const FIELDS: { key: TextField; label: string }[] = [
  { key: "name", label: "Company name" },
  { key: "legal_form", label: "Legal form (e.g. SARL, EURL)" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "rc", label: "RC (registre de commerce)" },
  { key: "nif", label: "NIF" },
  { key: "nis", label: "NIS" },
  { key: "art", label: "ART" },
  { key: "bank_name", label: "Bank name" },
  { key: "rib", label: "RIB" },
];

export default function SettingsForm({
  settings,
}: {
  settings: CompanySettings;
}) {
  const [values, setValues] = useState<Record<TextField, string>>(() => {
    const initial = {} as Record<TextField, string>;
    for (const { key } of FIELDS) initial[key] = settings[key] ?? "";
    return initial;
  });
  const [capital, setCapital] = useState(
    settings.capital_dzd ? String(settings.capital_dzd) : "0"
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function set(key: TextField, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload: Record<string, string | number | null> = {
      capital_dzd: parseDzd(capital),
    };
    for (const { key } of FIELDS) payload[key] = values[key].trim() || null;

    const { error } = await createClient()
      .from("company_settings")
      .update(payload)
      .eq("id", settings.id);
    if (error) {
      setError(friendlyError(error, "settings"));
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardCls} max-w-2xl p-5`}>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className={labelCls} htmlFor={key}>
              {label}
            </label>
            <input
              id={key}
              className={inputCls}
              value={values[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}
        <div>
          <label className={labelCls} htmlFor="capital_dzd">
            Capital (DZD)
          </label>
          <input
            id="capital_dzd"
            type="number"
            min={0}
            step={1}
            className={inputCls}
            value={capital}
            onChange={(e) => {
              setCapital(e.target.value);
              setSaved(false);
            }}
          />
        </div>
      </div>

      {error && <p className={`${errorCls} mt-4`}>{error}</p>}
      {saved && (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Settings saved.
        </p>
      )}

      <div className="mt-5">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
