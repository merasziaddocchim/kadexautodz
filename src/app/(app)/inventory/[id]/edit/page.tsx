import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CarForm from "@/components/CarForm";

export const metadata = { title: "Edit car — Kadex Auto DZ" };

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [carRes, brandsRes, modelsRes, colorsRes] = await Promise.all([
    supabase
      .from("cars")
      .select(
        "id, code, brand_id, model_id, color_id, year, vin, wholesale_price_dzd, import_fees_dzd, list_price_dzd, location"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("models").select("id, brand_id, name").order("name"),
    supabase.from("colors").select("id, name").order("name"),
  ]);
  const firstError =
    carRes.error ?? brandsRes.error ?? modelsRes.error ?? colorsRes.error;
  if (firstError) throw new Error(firstError.message);
  if (!carRes.data) notFound();
  const car = carRes.data;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Edit {car.code}</h1>
      <CarForm
        mode="edit"
        carId={car.id}
        code={car.code}
        brands={brandsRes.data ?? []}
        models={modelsRes.data ?? []}
        colors={colorsRes.data ?? []}
        initial={{
          brand_id: car.brand_id,
          model_id: car.model_id,
          color_id: car.color_id,
          year: car.year,
          vin: car.vin ?? "",
          wholesale_price_dzd: car.wholesale_price_dzd,
          import_fees_dzd: car.import_fees_dzd,
          list_price_dzd: car.list_price_dzd,
          location: car.location,
        }}
      />
    </div>
  );
}
