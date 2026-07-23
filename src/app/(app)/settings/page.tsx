import { createClient } from "@/lib/supabase/server";
import { CompanySettings, companyPlaceholders } from "@/lib/company";
import SettingsForm from "@/components/SettingsForm";
import { warnCls } from "@/components/ui";

export const metadata = { title: "Settings — Kadex Auto DZ" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);

  const settings = (data ?? null) as CompanySettings | null;

  if (!settings) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Company settings</h1>
        <p className={`${warnCls} mt-4`}>
          No company settings row was found. It is created during database
          setup — contact the administrator.
        </p>
      </div>
    );
  }

  const missing = companyPlaceholders(settings);

  return (
    <div>
      <h1 className="text-xl font-semibold">Company settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Used on invoices, receipts, and contracts.
      </p>
      {missing.length > 0 && (
        <p className={`${warnCls} mt-4 max-w-2xl`}>
          Some required fields still need completing before a contract can be
          issued. Fill in the company identity below and save.
        </p>
      )}
      <div className="mt-4">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
