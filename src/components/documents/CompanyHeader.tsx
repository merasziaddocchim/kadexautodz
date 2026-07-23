import { CompanySettings } from "@/lib/company";

// Company identity block for document headers. Fields that are empty are
// simply omitted; placeholder values (À COMPLÉTER) are shown as-is so the
// owner sees what still needs filling in.
export default function CompanyHeader({
  company,
}: {
  company: CompanySettings | null;
}) {
  if (!company) return null;
  const idLine = [
    company.rc && `RC : ${company.rc}`,
    company.nif && `NIF : ${company.nif}`,
    company.nis && `NIS : ${company.nis}`,
    company.art && `ART : ${company.art}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  const contactLine = [
    company.phone && `Tél : ${company.phone}`,
    company.email && company.email,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div>
      <p className="text-base font-bold uppercase tracking-wide">
        {company.name}
        {company.legal_form ? ` — ${company.legal_form}` : ""}
      </p>
      {company.address && <p>{company.address}</p>}
      {company.city && <p>{company.city}</p>}
      {idLine && <p className="mt-1 text-[11px] text-gray-600">{idLine}</p>}
      {contactLine && <p className="text-[11px] text-gray-600">{contactLine}</p>}
    </div>
  );
}
