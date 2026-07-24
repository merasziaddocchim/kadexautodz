"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Rotate an order's tracking token — the old /suivi/<token> link stops
// working immediately. Calls the authenticated-only Phase 1 DB function.
export async function regenerateTrackingLink(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("regenerate_tracking_token", {
    p_order_id: orderId,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/orders/${orderId}`);
}

// Kill switch: when disabled, get_tracking returns nothing for this order's
// token, so a leaked link is dead until re-enabled — without deleting data.
export async function setTrackingEnabled(orderId: string, enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("orders")
    .update({ tracking_enabled: enabled })
    .eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath(`/orders/${orderId}`);
}
