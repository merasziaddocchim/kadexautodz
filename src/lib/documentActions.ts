"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanySettings } from "@/lib/company";
import { contractBlockers } from "@/lib/contractGuards";

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

// Assigns the contract number on first use, but only if the blockers pass
// (client has an ID card, company legal fields filled). When blocked, no
// number is assigned — we just open the contract page, which shows why.
export async function issueContract(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) throw new Error("Missing order id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [orderRes, companyRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id, contract_number, client:clients(id_card_number)")
      .eq("id", orderId)
      .maybeSingle(),
    supabase.from("company_settings").select("*").maybeSingle(),
  ]);
  if (orderRes.error) throw new Error(orderRes.error.message);

  const order = orderRes.data as unknown as {
    contract_number: string | null;
    client: { id_card_number: string | null };
  } | null;

  // Only assign when not already issued and not blocked.
  if (order && !order.contract_number) {
    const blockers = contractBlockers(
      order.client?.id_card_number,
      (companyRes.data ?? null) as CompanySettings | null
    );
    if (blockers.length === 0) {
      const { error } = await supabase.rpc("issue_document_number", {
        p_order_id: orderId,
        p_doc_type: "contract",
      });
      if (error) throw new Error(error.message);
    }
  }

  redirect(`/orders/${orderId}/contract`);
}
