import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { btnPrimary } from "@/components/ui";
import CarsTable, { CarRow } from "@/components/CarsTable";
import { carAvailability, CarLocation, OrderStatus } from "@/lib/types";

export const metadata = { title: "Inventory — Kadex Auto DZ" };

interface CarRecord {
  id: string;
  code: string;
  year: number;
  vin: string | null;
  wholesale_price_dzd: number;
  import_fees_dzd: number;
  list_price_dzd: number;
  location: CarLocation;
  brand: { name: string };
  model: { name: string };
  color: { name: string };
  orders: { status: OrderStatus }[];
}

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select(
      `id, code, year, vin, wholesale_price_dzd, import_fees_dzd, list_price_dzd, location,
       brand:brands(name), model:models(name), color:colors(name), orders(status)`
    )
    .order("code");
  if (error) throw new Error(error.message);

  const rows: CarRow[] = ((data ?? []) as unknown as CarRecord[]).map((c) => {
    const landed = c.wholesale_price_dzd + c.import_fees_dzd;
    return {
      id: c.id,
      code: c.code,
      car: `${c.brand.name} ${c.model.name}`,
      color: c.color.name,
      year: c.year,
      vin: c.vin ?? "",
      location: c.location,
      availability: carAvailability(c.orders),
      wholesale: c.wholesale_price_dzd,
      fees: c.import_fees_dzd,
      landed,
      list: c.list_price_dzd,
      margin: c.list_price_dzd - landed,
    };
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Inventory</h1>
        <Link href="/inventory/new" className={btnPrimary}>
          Add car
        </Link>
      </div>
      <CarsTable rows={rows} />
    </div>
  );
}
