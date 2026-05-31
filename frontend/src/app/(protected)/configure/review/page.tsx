import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RiceConfig } from "@/types/rice-config";
import { ReviewShell } from "./_components/ReviewShell";

export const metadata = {
  title: "Récapitulatif — Ricefy",
};

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect("/configure");

  const supabase = await createClient();
  const { data } = await supabase
    .from("rices")
    .select("id, config_json")
    .eq("id", id)
    .single();

  if (!data) redirect("/configure");

  return <ReviewShell config={data.config_json as RiceConfig} riceId={data.id} />;
}
