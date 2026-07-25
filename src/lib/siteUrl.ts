// Absolute base URL for links we send to customers (tracking pages).
//
// IMPORTANT: VERCEL_URL is the *per-deployment* hostname (e.g.
// my-app-9f3k2m-team.vercel.app). Under Vercel's Deployment Protection those
// generated URLs require a Vercel login, so a customer opening one is asked to
// sign in to Vercel. It is only a last-resort fallback for staff previews —
// customer-facing links must come from NEXT_PUBLIC_SITE_URL (the stable
// production domain).
export type SiteUrlSource = "explicit" | "vercel" | "none";

export function getSiteUrlInfo(): { url: string; source: SiteUrlSource } {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return { url: explicit.replace(/\/+$/, ""), source: "explicit" };
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel) return { url: `https://${vercel}`, source: "vercel" };
  return { url: "", source: "none" };
}

export function getSiteUrl(): string {
  return getSiteUrlInfo().url;
}

// True when the base URL is not safe to send to a customer.
export function isCustomerSafeSiteUrl(): boolean {
  return getSiteUrlInfo().source === "explicit";
}

// Absolute /suivi/<token> URL, or null if no base URL is configured.
export function buildTrackingUrl(token: string): string | null {
  const base = getSiteUrl();
  return base ? `${base}/suivi/${token}` : null;
}

export function waHref(waNumber: string, message: string): string {
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}
