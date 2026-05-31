"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type RiceStatus = "draft" | "paid" | "generating" | "ready" | "failed";

export function DownloadShell({ riceId }: { riceId: string }) {
  const [status, setStatus] = useState<RiceStatus | null>(null);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function poll() {
      const { data } = await supabase
        .from("rices")
        .select("status, zip_url")
        .eq("id", riceId)
        .single();

      if (data) {
        setStatus(data.status as RiceStatus);
        if (data.zip_url) setZipUrl(data.zip_url);
        if (data.status === "ready" || data.status === "failed") {
          clearInterval(intervalId);
        }
      }
    }

    poll();
    const intervalId = setInterval(poll, 3000);
    return () => clearInterval(intervalId);
  }, [riceId]);

  if (status === "ready" && zipUrl) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <CheckCircle className="size-12 text-foreground/60" strokeWidth={1.5} />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold">Rice prêt !</h1>
          <p className="text-sm text-muted-foreground">
            Télécharge le zip et suis le script d&apos;installation inclus.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button asChild size="lg">
            <a href={zipUrl} download>
              <Download className="mr-2 size-4" />
              Télécharger mon rice
            </a>
          </Button>
          <Link
            href="/profile"
            className="text-xs text-muted-foreground/50 underline-offset-2 hover:text-muted-foreground hover:underline"
          >
            Voir mes rices
          </Link>
        </div>
        <div className="mt-4 border-t border-border pt-6 flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Ricefy est gratuit et open-source.
          </p>
          <a
            href="https://ko-fi.com/lystriqq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline transition-colors"
          >
            ☕ Soutenir le projet sur Ko-fi
          </a>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <XCircle className="size-12 text-destructive/60" strokeWidth={1.5} />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold">Erreur de génération</h1>
          <p className="text-sm text-muted-foreground">
            Une erreur est survenue. Ouvre une issue sur GitHub.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/profile">Voir mes rices</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <Loader2 className="size-10 animate-spin text-foreground/30" strokeWidth={1.5} />
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold">Génération en cours…</h1>
        <p className="text-sm text-muted-foreground">
          Tes dotfiles sont en train d&apos;être générés.
        </p>
      </div>
      <p className="text-xs text-muted-foreground/40">
        Cette page se met à jour automatiquement.
      </p>
    </div>
  );
}
