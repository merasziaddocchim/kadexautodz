// Money is always integer dinars (bigint in Postgres) — never floats.
export function formatDZD(n: number): string {
  const sign = n < 0 ? "−" : "";
  const s = Math.abs(Math.trunc(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${s} DZD`;
}

// "2026-05-12" (or a full timestamp) -> "12/05/2026"
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// Local date as YYYY-MM-DD for <input type="date"> defaults.
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// nextCode(["C001","C002"], "C") -> "C003"; nextCode(codes, "ORD-") -> "ORD-004"
export function nextCode(existing: string[], prefix: string, pad = 3): string {
  let max = 0;
  for (const code of existing) {
    if (!code.startsWith(prefix)) continue;
    const n = parseInt(code.slice(prefix.length), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return prefix + String(max + 1).padStart(pad, "0");
}

export function parseDzd(value: string): number {
  const n = parseInt(value.replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(n) ? 0 : Math.max(0, n);
}
