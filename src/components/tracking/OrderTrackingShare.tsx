"use client";

import { useState } from "react";
import { btnSecondary, cardCls } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import WhatsAppButton from "@/components/tracking/WhatsAppButton";
import CopyLinkButton from "@/components/tracking/CopyLinkButton";
import {
  regenerateTrackingLink,
  setTrackingEnabled,
} from "@/lib/trackingActions";

export default function OrderTrackingShare({
  orderId,
  trackingEnabled,
  trackingUrl,
  waHref,
  shareDisabledReason,
}: {
  orderId: string;
  trackingEnabled: boolean;
  trackingUrl: string | null;
  waHref: string | null;
  shareDisabledReason: string | null;
}) {
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className={`${cardCls} p-5`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-700">
          Customer tracking (WhatsApp)
        </h2>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            trackingEnabled
              ? "bg-emerald-100 text-emerald-800"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {trackingEnabled ? "Tracking active" : "Tracking disabled"}
        </span>
      </div>

      <p className="mb-3 break-all text-xs text-gray-500">
        {!trackingEnabled
          ? "Tracking is disabled — the customer link will not open until you re-enable it."
          : trackingUrl ??
            "Set NEXT_PUBLIC_SITE_URL to generate the public link."}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <WhatsAppButton
          href={waHref}
          label="Envoyer le suivi (WhatsApp)"
          disabledReason={shareDisabledReason}
        />
        <CopyLinkButton url={trackingUrl} />
        <ConfirmButton
          label="Revoke link"
          title="Revoke this tracking link?"
          message="A new link will be generated and the current one will stop working immediately. Anyone who already has the old link will no longer be able to open it."
          confirmLabel="Revoke & regenerate"
          onConfirm={() => run(() => regenerateTrackingLink(orderId))}
          className="text-sm text-red-600 hover:underline"
        />
        {trackingEnabled ? (
          <ConfirmButton
            label="Disable tracking"
            title="Disable tracking for this order?"
            message="The customer link will stop working entirely until you re-enable it. Use this to kill a leaked link without deleting the order."
            confirmLabel="Disable tracking"
            onConfirm={() => run(() => setTrackingEnabled(orderId, false))}
            className={`${btnSecondary} text-gray-700`}
          />
        ) : (
          <button
            type="button"
            className={btnSecondary}
            onClick={() => run(() => setTrackingEnabled(orderId, true))}
          >
            Enable tracking
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
