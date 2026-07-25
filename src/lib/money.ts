// Transit documents carry centimes (e.g. 78 275,50), unlike order/payment
// money which is whole dinars. Stored as bigint CENTIMES (dinars × 100) —
// still integers, never floats.

// 7827550 -> "78 275,50" (French: space thousands, comma decimals)
export function formatCentimes(centimes: number): string {
  const n = Math.trunc(centimes);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const dinars = Math.floor(abs / 100);
  const cents = abs % 100;
  const grouped = dinars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${grouped},${cents.toString().padStart(2, "0")}`;
}

export function formatCentimesDZD(centimes: number): string {
  return `${formatCentimes(centimes)} DZD`;
}

// "78 275,50" / "78275.50" / "78275,5" -> 7827550 centimes
export function parseCentimes(input: string): number {
  const cleaned = input.replace(/\s/g, "").replace(",", ".");
  if (cleaned === "" || cleaned === "-") return 0;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

// TVA applies to the TRANSIT column only — debours are advanced on the
// client's behalf and are not taxed.
export const TVA_RATE_PERCENT = 9;

export function tvaOnTransit(transitCentimes: number): number {
  return Math.round((transitCentimes * TVA_RATE_PERCENT) / 100);
}
