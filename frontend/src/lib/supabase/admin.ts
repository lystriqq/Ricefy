import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec le service role key.
 * BACKEND UNIQUEMENT — ne jamais importer dans un composant client ou "use client".
 * Utilisable uniquement dans : Route Handlers, Server Actions, scripts serveur.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
