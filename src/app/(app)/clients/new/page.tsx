import { createClient } from "@/lib/supabase/server";
import { nextCode } from "@/lib/format";
import ClientForm from "@/components/ClientForm";

export const metadata = { title: "Add client — Kadex Auto DZ" };

export default async function NewClientPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("code");
  if (error) throw new Error(error.message);

  const code = nextCode(
    (data ?? []).map((r) => r.code as string),
    "C"
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Add client</h1>
      <ClientForm mode="create" code={code} />
    </div>
  );
}
