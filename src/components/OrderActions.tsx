"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import {
  CANCELLABLE_STATUSES,
  NEXT_STATUS,
  OrderStatus,
} from "@/lib/types";
import ConfirmButton from "@/components/ConfirmButton";
import { btnPrimary, errorCls } from "@/components/ui";

export default function OrderActions({
  orderId,
  code,
  status,
}: {
  orderId: string;
  code: string;
  status: OrderStatus;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = NEXT_STATUS[status];
  const cancellable = CANCELLABLE_STATUSES.includes(status);

  async function setStatus(newStatus: OrderStatus) {
    setError(null);
    const { error } = await createClient()
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (error) {
      setError(friendlyError(error, "order"));
      return;
    }
    window.location.reload();
  }

  async function advance() {
    if (!next) return;
    setBusy(true);
    await setStatus(next);
    setBusy(false);
  }

  async function deleteOrder() {
    setError(null);
    const { error } = await createClient()
      .from("orders")
      .delete()
      .eq("id", orderId);
    if (error) {
      setError(
        error.code === "23503"
          ? `Cannot delete ${code}: it has payments. Delete its payments first, or cancel the order instead.`
          : friendlyError(error, "order")
      );
      return;
    }
    window.location.assign("/orders");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next && (
        <button
          type="button"
          onClick={advance}
          disabled={busy}
          className={btnPrimary}
        >
          {busy ? "Saving…" : `Mark as ${next}`}
        </button>
      )}
      {cancellable && (
        <ConfirmButton
          label="Cancel order"
          title={`Cancel ${code}?`}
          message="The order will be marked cancelled and the car becomes available again. This keeps the order in history."
          confirmLabel="Cancel order"
          onConfirm={() => setStatus("cancelled")}
        />
      )}
      <ConfirmButton
        label="Delete"
        title={`Delete ${code}?`}
        message="This permanently removes the order. Orders with payments cannot be deleted."
        confirmLabel="Delete"
        onConfirm={deleteOrder}
      />
      {error && <p className={`${errorCls} w-full`}>{error}</p>}
    </div>
  );
}
