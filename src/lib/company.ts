export const PLACEHOLDER = "À COMPLÉTER";

export interface CompanySettings {
  id: string;
  name: string | null;
  legal_form: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  rc: string | null;
  nif: string | null;
  nis: string | null;
  art: string | null;
  bank_name: string | null;
  rib: string | null;
  capital_dzd: number | null;
}

// Identity fields that must be filled before a contract can be issued.
const REQUIRED_FIELDS: (keyof CompanySettings)[] = [
  "name",
  "address",
  "city",
  "rc",
  "nif",
  "nis",
  "art",
];

// Returns the list of required fields still holding the placeholder value.
export function companyPlaceholders(c: CompanySettings | null): string[] {
  if (!c) return ["(paramètres non configurés)"];
  return REQUIRED_FIELDS.filter(
    (f) => !c[f] || String(c[f]).trim() === PLACEHOLDER
  ).map(String);
}
