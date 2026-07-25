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

// A single amount may not exceed 100 000 000,00 DZD. That is far above any
// real transit line, but low enough to catch a mistyped or pasted figure
// before it reaches a numbered document.
export const MAX_AMOUNT_CENTIMES = 10_000_000_000;

// montantCentimesEnLettresDZD only spells amounts up to 999 999 999 dinars.
// Past that it returns "" and the document would print a blank amount in
// words — so totals have to stay inside that range.
export const MAX_TOTAL_CENTIMES = 99_999_999_900;

// "78 275,50" / "78275.50" / "78275,5" -> 7827550 centimes.
// Returns null when the input is not a plain amount. A typo must never
// silently become 0 on a fiscal document.
export function parseCentimes(input: string): number | null {
  const cleaned = input.replace(/\s/g, "");
  if (cleaned === "") return null;
  // Digits, then at most one separator followed by one or two decimals.
  if (!/^-?\d+([.,]\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned.replace(",", "."));
  if (!Number.isFinite(value)) return null;
  const centimes = Math.round(value * 100);
  return Number.isSafeInteger(centimes) ? centimes : null;
}

export type AmountProblem = "invalid" | "negative" | "too_large";

// Validates one typed amount. Blank is the caller's business: a blank line is
// legitimate and prints blank, so callers skip empty strings.
export function checkAmount(input: string): AmountProblem | null {
  const centimes = parseCentimes(input);
  if (centimes === null) return "invalid";
  if (centimes < 0) return "negative";
  if (centimes > MAX_AMOUNT_CENTIMES) return "too_large";
  return null;
}

// TVA applies to the TRANSIT column only — debours are advanced on the
// client's behalf and are not taxed.
export const TVA_RATE_PERCENT = 9;

export function tvaOnTransit(transitCentimes: number): number {
  return Math.round((transitCentimes * TVA_RATE_PERCENT) / 100);
}
