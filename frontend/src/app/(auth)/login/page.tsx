"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === "Invalid login credentials") {
        setError("Email ou mot de passe incorrect");
      } else if (error.message === "Email not confirmed") {
        setError("Vérifie ta boîte mail pour confirmer ton compte");
      } else {
        setError("Une erreur est survenue, réessaie");
      }
      setLoading(false);
      return;
    }

    router.push("/configure");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Connexion</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">Email</label>
          <input
            suppressHydrationWarning
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-zinc-400">Mot de passe</label>
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <input
            suppressHydrationWarning
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="bg-white text-black font-medium py-2.5 rounded-lg text-sm hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p className="text-sm text-zinc-500 text-center">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-white hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
