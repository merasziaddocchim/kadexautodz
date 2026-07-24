// Normalize an Algerian phone number into the `wa.me` form: `213XXXXXXXXX`
// (country code + 9 national digits, no +, no spaces). Returns null when the
// input can't be turned into a valid number, so callers can disable a button
// rather than build a broken WhatsApp link.
//
// Accepts: "0550 12 34 56", "+213 550-12-34-56", "00213550123456",
// "213550123456", "550123456", with spaces/dashes/dots/parentheses.
export function toWaNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Keep digits and a leading +, drop everything else.
  let d = raw.replace(/[^\d+]/g, "");
  d = d.replace(/^\+/, "");
  if (d.startsWith("00")) d = d.slice(2);

  if (d.startsWith("213")) d = d.slice(3);
  // Drop a national trunk "0" — as a local prefix (0550…) or written after
  // the country code (+213 (0) 550…).
  if (d.startsWith("0")) d = d.slice(1);

  // National number must be exactly 9 digits (mobile 5/6/7, landline 2/3/4).
  if (!/^[2-7]\d{8}$/.test(d)) return null;

  return "213" + d;
}
