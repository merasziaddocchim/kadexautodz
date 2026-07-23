import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import "./documents.css";

// Document pages render per-request and never prerender.
export const dynamic = "force-dynamic";

export default async function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <div className="doc-backdrop">{children}</div>;
}
