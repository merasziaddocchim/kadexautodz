"use client";

// A WhatsApp share link, or a disabled button with a tooltip explaining why
// (missing/invalid phone, or no site URL) — never a broken wa.me link.
export default function WhatsAppButton({
  href,
  label,
  disabledReason,
  className = "",
}: {
  href: string | null;
  label: string;
  disabledReason?: string | null;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-medium";
  if (!href) {
    return (
      <button
        type="button"
        disabled
        title={disabledReason ?? "Indisponible"}
        className={`${base} cursor-not-allowed bg-gray-100 text-gray-400 ${className}`}
      >
        {label}
      </button>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} bg-emerald-600 text-white hover:bg-emerald-700 ${className}`}
    >
      {label}
    </a>
  );
}
