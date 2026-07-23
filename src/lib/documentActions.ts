"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Assigns the invoice number on first use (idempotent in the DB function —
// an already-issued order keeps its number), then opens the invoice.
export async function issueInvoice(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) throw new Error("Missing order id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("issue_document_number", {
    p_order_id: orderId,
    p_doc_type: "invoice",
  });
  if (error) throw new Error(error.message);

  redirect(`/orders/${orderId}/invoice`);
}
