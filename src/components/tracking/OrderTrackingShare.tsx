"use client";

import { useState } from "react";
import { cardCls } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import WhatsAppButton from "@/components/tracking/WhatsAppButton";
import CopyLinkButton from "@/components/tracking/CopyLinkButton";
import { regenerateTrackingLink } from "@/lib/trackingActions";

export default function OrderTrackingShare({
  orderId,
  trackingUrl,
  waHref,
  shareDisabledReason,
}: {
  orderId: string;
  trackingUrl: string | null;
  waHref: string | null;
  shareDisabledReason: string | null;
}) {
  const [error, setError] = useState<string | null>(null);

  async function revoke() {
    setError(null);
    try {
      await regenerateTrackingLink(orderId);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className={`${cardCls} p-5`}>
      <h2 className="mb-1 text-sm font-semibold text-gray-700">
        Customer tracking (WhatsApp)
      </h2>
      <p className="mb-3 break-all text-xs text-gray-500">
        {trackingUrl ?? "Set NEXT_PUBLIC_SITE_URL to generate the public link."}
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
          onConfirm={revoke}
          className="text-sm text-red-600 hover:underline"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
