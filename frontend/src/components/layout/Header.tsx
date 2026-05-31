"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

export function Header() {
  const router = useRouter();
  const { user, loading } = useUser();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-border px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Ricefy" width={24} height={24} />
        <span className="text-sm font-medium">Ricefy</span>
      </Link>

      <nav className="flex items-center gap-4">
        {!loading && (
          <>
            {user ? (
              <>
                <Link
                  href="/configure"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Configurer
                </Link>
                <Link
                  href="/profile"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Se connecter
              </Link>
            )}
          </>
        )}
      </nav>
    </header>
  );
}
