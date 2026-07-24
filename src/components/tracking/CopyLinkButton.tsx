"use client";

import { useState } from "react";
import { btnSecondary } from "@/components/ui";

export default function CopyLinkButton({ url }: { url: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!url}
      title={url ?? "URL du site non configurée"}
      className={`${btnSecondary} ${!url ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {copied ? "Copié !" : "Copier le lien"}
    </button>
  );
}
