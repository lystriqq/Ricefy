import { createClient } from "@/lib/supabase/server";
import { RiceConfigProvider } from "@/contexts/RiceConfigContext";
import { ConfiguratorShell } from "./_components/ConfiguratorShell";

export const metadata = {
  title: "Configurateur — Ricefy",
  description: "Personnalise ton rice Hyprland",
};

export default async function ConfigurePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialRiceId: string | undefined;
  if (user) {
    const { data } = await supabase
      .from("rices")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    initialRiceId = data?.id;
  }

  return (
    <RiceConfigProvider initialRiceId={initialRiceId}>
      <ConfiguratorShell />
    </RiceConfigProvider>
  );
}
