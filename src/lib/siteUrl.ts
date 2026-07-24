// Absolute base URL for links we send to customers (tracking pages).
// Prefers an explicit, stable NEXT_PUBLIC_SITE_URL; falls back to Vercel's
// per-deployment VERCEL_URL at runtime. Returns "" when neither is set (e.g.
// local dev / a no-env build) so callers disable sharing rather than emit a
// relative or broken link.
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "";
}

// Absolute /suivi/<token> URL, or null if no base URL is configured.
export function buildTrackingUrl(token: string): string | null {
  const base = getSiteUrl();
  return base ? `${base}/suivi/${token}` : null;
}

export function waHref(waNumber: string, message: string): string {
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}
