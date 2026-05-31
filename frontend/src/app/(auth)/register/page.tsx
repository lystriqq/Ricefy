"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message === "User already registered") {
        setError("Un compte existe déjà avec cet email");
      } else {
        setError("Une erreur est survenue, réessaie");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm flex flex-col gap-4 text-center">
          <div className="text-4xl">📬</div>
          <h1 className="text-2xl font-semibold">Vérifie ton email</h1>
          <p className="text-zinc-400 text-sm">
            On a envoyé un lien de confirmation à{" "}
            <span className="text-white">{email}</span>
          </p>
          <p className="text-zinc-500 text-xs">
            Clique sur le lien dans l&apos;email pour activer ton compte.
          </p>
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white mt-4"
          >
            Retour à la connexion →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Créer un compte</h1>

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
          <label className="text-sm text-zinc-400">Mot de passe</label>
          <input
            suppressHydrationWarning
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">
            Confirmer le mot de passe
          </label>
          <input
            suppressHydrationWarning
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600"
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading || !email || !password || !confirmPassword}
          className="bg-white text-black font-medium py-2.5 rounded-lg text-sm hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>

        <p className="text-sm text-zinc-500 text-center">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-white hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
