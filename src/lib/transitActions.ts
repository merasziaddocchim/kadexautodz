"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Opens the Facture Transit entry form, creating the draft row on first use.
// The insert fires the database trigger that seeds the 16 fixed lines. No
// number is assigned here — numbering happens on issue, like invoices and
// contracts.
export async function openTransitInvoice(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) throw new Error("Missing order id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing, error: selectError } = await supabase
    .from("transit_invoices")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (selectError) throw new Error(selectError.message);

  if (!existing) {
    const { error } = await supabase
      .from("transit_invoices")
      .insert({ order_id: orderId });
    if (error) throw new Error(error.message);
  }

  redirect(`/orders/${orderId}/transit`);
}

// Assigns the transit number on first use (idempotent in the DB function —
// an already-issued invoice keeps its number), then opens the document.
export async function issueTransitInvoice(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) throw new Error("Missing order id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("issue_transit_number", {
    p_order_id: orderId,
  });
  if (error) throw new Error(error.message);

  redirect(`/orders/${orderId}/facture-transit`);
}
