"use client";

import { useState } from "react";
import { btnDanger, btnPrimary, btnSecondary } from "@/components/ui";

export default function ConfirmButton({
  label,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  className,
  onConfirm,
}: {
  label: string;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  className?: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className ?? (variant === "danger" ? btnDanger : btnPrimary)}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={btnSecondary}
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={variant === "danger" ? btnDanger : btnPrimary}
                disabled={busy}
                onClick={confirm}
              >
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
