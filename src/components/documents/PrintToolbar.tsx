"use client";

import { btnPrimary, btnSecondary } from "@/components/ui";

// Hidden when printing. Screen-only controls for the document pages.
export default function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="no-print mx-auto mb-4 flex w-[210mm] max-w-full items-center justify-between px-1">
      <a href={backHref} className={btnSecondary}>
        ← Retour
      </a>
      <button type="button" onClick={() => window.print()} className={btnPrimary}>
        Imprimer / Enregistrer en PDF
      </button>
    </div>
  );
}
