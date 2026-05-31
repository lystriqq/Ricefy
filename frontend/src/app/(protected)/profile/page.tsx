import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type RiceStatus = "draft" | "paid" | "generating" | "ready" | "failed";

type Rice = {
  id: string;
  status: RiceStatus;
  zip_url: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<RiceStatus, string> = {
  draft: "Brouillon",
  paid: "En attente",
  generating: "En cours",
  ready: "Prêt",
  failed: "Échoué",
};

const STATUS_COLORS: Record<RiceStatus, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  paid: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  generating: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ready: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rices } = await supabase
    .from("rices")
    .select("id, status, zip_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const riceList = (rices ?? []) as Rice[];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-10">

      {/* Infos utilisateur */}
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Mon profil</h1>
        <p className="text-sm text-zinc-400">{user.email}</p>
        <p className="text-xs text-zinc-600">
          Inscrit le {formatDate(user.created_at)}
        </p>
      </section>

      {/* Liste des rices */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Mes rices</h2>
          <Link
            href="/configure"
            className="text-sm bg-white text-black font-medium px-4 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Créer un nouveau rice
          </Link>
        </div>

        {riceList.length === 0 ? (
          <div className="border border-zinc-800 rounded-xl px-6 py-12 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-zinc-400">
              Tu n&apos;as pas encore généré de rice.
            </p>
            <Link
              href="/configure"
              className="text-sm bg-white text-black font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Créer un rice
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {riceList.map((rice) => (
              <li
                key={rice.id}
                className="border border-zinc-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-zinc-500">
                    {formatDate(rice.created_at)}
                  </span>
                  <span className="text-sm font-mono text-zinc-500">
                    #{rice.id.slice(0, 8)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Badge statut */}
                  <span
                    className={`flex items-center gap-1.5 text-xs border px-2.5 py-1 rounded-full ${STATUS_COLORS[rice.status]}`}
                  >
                    {rice.status === "generating" && (
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    )}
                    {STATUS_LABELS[rice.status]}
                  </span>

                  {/* Bouton téléchargement */}
                  {rice.status === "ready" && rice.zip_url && (
                    <a
                      href={rice.zip_url}
                      download
                      className="text-sm bg-white text-black font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                      Télécharger
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
