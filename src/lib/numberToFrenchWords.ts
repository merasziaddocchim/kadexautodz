// Converts an integer amount to French words, for legal documents.
// Handles 0 .. 999 999 999. No external dependency.
// French conventions: "quatre-vingts"/"quatre-vingt", "cent"/"cents",
// invariable "mille", "et un" / "et onze" liaisons.

const ONES = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
];

const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

// 0..99. `trailing` = this word ends the whole number (affects "quatre-vingts").
function below100(n: number, trailing: boolean): string {
  if (n <= 16) return ONES[n];
  if (n < 20) return "dix-" + ONES[n - 10]; // dix-sept, dix-huit, dix-neuf
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t <= 6) {
    const base = TENS[t];
    if (u === 0) return base;
    if (u === 1) return base + " et un";
    return base + "-" + ONES[u];
  }
  if (t === 7) {
    if (u === 0) return "soixante-dix";
    if (u === 1) return "soixante et onze";
    return "soixante-" + below100(10 + u, true); // soixante-douze .. soixante-dix-neuf
  }
  // t === 8 or 9
  if (n === 80) return trailing ? "quatre-vingts" : "quatre-vingt";
  if (t === 8) return "quatre-vingt-" + ONES[u]; // quatre-vingt-un .. -neuf (no "et")
  return "quatre-vingt-" + below100(10 + u, true); // quatre-vingt-dix .. -dix-neuf
}

// 0..999. `beforeMille` suppresses the agreement "s" on cent/quatre-vingt,
// because a following invariable "mille" blocks it.
function below1000(n: number, beforeMille: boolean): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h === 0) return below100(r, !beforeMille);
  const hundred = h === 1 ? "cent" : ONES[h] + " cent";
  if (r === 0) {
    if (h > 1 && !beforeMille) return hundred + "s"; // deux cents
    return hundred;
  }
  return hundred + " " + below100(r, !beforeMille);
}

export function toFrenchWords(n: number): string {
  if (!Number.isFinite(n)) return "";
  n = Math.trunc(Math.abs(n));
  if (n === 0) return "zéro";
  if (n > 999_999_999) return ""; // out of supported range

  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const units = n % 1000;

  const parts: string[] = [];
  if (millions > 0) {
    parts.push(
      millions === 1 ? "un million" : below1000(millions, false) + " millions"
    );
  }
  if (thousands > 0) {
    // "mille" is invariable and never preceded by "un".
    parts.push(thousands === 1 ? "mille" : below1000(thousands, true) + " mille");
  }
  if (units > 0) {
    parts.push(below1000(units, false));
  }
  return parts.join(" ");
}

// Amount in words followed by the currency. Returns "" if out of range so the
// caller can fall back to figures.
export function montantEnLettresDZD(n: number): string {
  const words = toFrenchWords(n);
  if (words === "") return "";
  const unit = n <= 1 ? "dinar algérien" : "dinars algériens";
  return `${words} ${unit}`;
}

export function capitalizeFirst(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

// Amount held in CENTIMES, spelled out: 94460350 ->
// "neuf cent quarante-quatre mille six cent trois dinars algériens et
// cinquante centimes". Uses the absolute value — the sign is carried by the
// figures next to it. Returns "" if out of supported range.
export function montantCentimesEnLettresDZD(centimes: number): string {
  const abs = Math.abs(Math.trunc(centimes));
  const dinars = Math.floor(abs / 100);
  const cents = abs % 100;

  const dinarWords = montantEnLettresDZD(dinars);
  if (dinarWords === "") return "";
  if (cents === 0) return dinarWords;

  const centWords = toFrenchWords(cents);
  const centUnit = cents === 1 ? "centime" : "centimes";
  return `${dinarWords} et ${centWords} ${centUnit}`;
}
