"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import ConfirmButton from "@/components/ConfirmButton";
import {
  btnPrimary,
  btnSecondary,
  cardCls,
  errorCls,
  inputCls,
  labelCls,
} from "@/components/ui";

export interface ClientFormInitial {
  name: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  address: string;
  id_card_number: string;
  id_card_issued_at: string;
  id_card_issued_by: string;
  birth_date: string;
  birth_place: string;
}

export default function ClientForm({
  mode,
  clientId,
  code,
  initial,
}: {
  mode: "create" | "edit";
  clientId?: string;
  code: string;
  initial?: ClientFormInitial;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [idCardNumber, setIdCardNumber] = useState(
    initial?.id_card_number ?? ""
  );
  const [idCardIssuedAt, setIdCardIssuedAt] = useState(
    initial?.id_card_issued_at ?? ""
  );
  const [idCardIssuedBy, setIdCardIssuedBy] = useState(
    initial?.id_card_issued_by ?? ""
  );
  const [birthDate, setBirthDate] = useState(initial?.birth_date ?? "");
  const [birthPlace, setBirthPlace] = useState(initial?.birth_place ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      city: city.trim() || null,
      notes: notes.trim() || null,
      address: address.trim() || null,
      id_card_number: idCardNumber.trim() || null,
      id_card_issued_at: idCardIssuedAt || null,
      id_card_issued_by: idCardIssuedBy.trim() || null,
      birth_date: birthDate || null,
      birth_place: birthPlace.trim() || null,
    };
    const { error } =
      mode === "create"
        ? await supabase.from("clients").insert({ code, ...payload })
        : await supabase.from("clients").update(payload).eq("id", clientId!);
    if (error) {
      setError(friendlyError(error, "client"));
      setSaving(false);
      return;
    }
    window.location.assign("/clients");
  }

  async function deleteClient() {
    setError(null);
    const { error } = await createClient()
      .from("clients")
      .delete()
      .eq("id", clientId!);
    if (error) {
      setError(
        error.code === "23503"
          ? `Cannot delete ${code}: this client has orders. Delete those orders first.`
          : friendlyError(error, "client")
      );
      return;
    }
    window.location.assign("/clients");
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardCls} max-w-xl p-5`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Client code</label>
          <input className={inputCls} value={code} disabled />
        </div>
        <div>
          <label className={labelCls} htmlFor="name">
            Name *
          </label>
          <input
            id="name"
            required
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="city">
            City
          </label>
          <input
            id="city"
            className={inputCls}
            value={city}
            onChange={(e) => setCity(e.target.value)}
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

      <fieldset className="mt-5 border-t border-gray-200 pt-4">
        <legend className="mb-1 text-sm font-semibold text-gray-700">
          Legal documents
        </legend>
        <p className="mb-3 text-xs text-gray-500">
          Optional — used on the sale contract. An ID card number is required
          before a contract can be issued.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="address">
              Address
            </label>
            <input
              id="address"
              className={inputCls}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="id_card_number">
              ID card number
            </label>
            <input
              id="id_card_number"
              className={inputCls}
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="id_card_issued_at">
              ID card issued on
            </label>
            <input
              id="id_card_issued_at"
              type="date"
              className={inputCls}
              value={idCardIssuedAt}
              onChange={(e) => setIdCardIssuedAt(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="id_card_issued_by">
              ID card issued by
            </label>
            <input
              id="id_card_issued_by"
              className={inputCls}
              value={idCardIssuedBy}
              onChange={(e) => setIdCardIssuedBy(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="birth_date">
              Date of birth
            </label>
            <input
              id="birth_date"
              type="date"
              className={inputCls}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="birth_place">
              Place of birth
            </label>
            <input
              id="birth_place"
              className={inputCls}
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {error && <p className={`${errorCls} mt-4`}>{error}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving
            ? "Saving…"
            : mode === "create"
            ? "Add client"
            : "Save changes"}
        </button>
        <a href="/clients" className={btnSecondary}>
          Cancel
        </a>
        {mode === "edit" && (
          <ConfirmButton
            label="Delete"
            title={`Delete ${code}?`}
            message="This permanently removes the client. Clients with orders cannot be deleted."
            confirmLabel="Delete"
            onConfirm={deleteClient}
            className={`${btnSecondary} ml-auto text-red-600`}
          />
        )}
      </div>
    </form>
  );
}
