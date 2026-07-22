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
