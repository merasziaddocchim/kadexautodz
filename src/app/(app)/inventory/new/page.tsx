import { createClient } from "@/lib/supabase/server";
import { nextCode } from "@/lib/format";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Add car — Kadex Auto DZ" };

export default async function NewCarPage() {
  const supabase = await createClient();
  const [brandsRes, modelsRes, colorsRes, codesRes] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("models").select("id, brand_id, name").order("name"),
    supabase.from("colors").select("id, name").order("name"),
    supabase.from("cars").select("code"),
  ]);
  const firstError =
    brandsRes.error ?? modelsRes.error ?? colorsRes.error ?? codesRes.error;
  if (firstError) throw new Error(firstError.message);

  const code = nextCode(
    (codesRes.data ?? []).map((r) => r.code as string),
    "V"
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Add car</h1>
      <CarForm
        mode="create"
        code={code}
        brands={brandsRes.data ?? []}
        models={modelsRes.data ?? []}
        colors={colorsRes.data ?? []}
      />
    </div>
  );
}
