import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Ricefy</h1>
      <p className="mt-3 text-sm text-zinc-400 max-w-sm">
        Génère ta configuration Hyprland en quelques clics. Personnalise, paie, télécharge.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/configure"
          className="text-sm bg-white text-black font-medium px-5 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Configurer mon rice
        </Link>
        {!user && (
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white px-5 py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
          >
            Se connecter
          </Link>
        )}
      </div>
    </div>
  );
}
