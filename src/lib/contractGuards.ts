import { CompanySettings, companyPlaceholders } from "@/lib/company";

const FIELD_LABELS_FR: Record<string, string> = {
  name: "Nom",
  address: "Adresse",
  city: "Ville",
  rc: "RC",
  nif: "NIF",
  nis: "NIS",
  art: "ART",
};

// Reasons (in French) a contract may not be issued yet. Empty array = OK.
// Kept in one place so the issue action and the contract page agree exactly.
export function contractBlockers(
  clientIdCard: string | null | undefined,
  company: CompanySettings | null
): string[] {
  const reasons: string[] = [];

  if (!clientIdCard || clientIdCard.trim() === "") {
    reasons.push(
      "Le client n’a pas de numéro de pièce d’identité — obligatoire pour établir le contrat."
    );
  }

  const missing = companyPlaceholders(company);
  if (missing.length > 0) {
    const labels = missing.map((f) => FIELD_LABELS_FR[f] ?? f).join(", ");
    reasons.push(
      `Les informations légales de l’entreprise sont incomplètes (${labels}) — à compléter dans Paramètres.`
    );
  }

  return reasons;
}
