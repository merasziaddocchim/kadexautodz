import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClientForm from "@/components/ClientForm";

export const metadata = { title: "Edit client — Kadex Auto DZ" };

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, code, name, phone, email, city, notes, address, id_card_number, id_card_issued_at, id_card_issued_by, birth_date, birth_place"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Edit {data.code}</h1>
      <ClientForm
        mode="edit"
        clientId={data.id}
        code={data.code}
        initial={{
          name: data.name,
          phone: data.phone ?? "",
          email: data.email ?? "",
          city: data.city ?? "",
          notes: data.notes ?? "",
          address: data.address ?? "",
          id_card_number: data.id_card_number ?? "",
          id_card_issued_at: data.id_card_issued_at ?? "",
          id_card_issued_by: data.id_card_issued_by ?? "",
          birth_date: data.birth_date ?? "",
          birth_place: data.birth_place ?? "",
        }}
      />
    </div>
  );
}
