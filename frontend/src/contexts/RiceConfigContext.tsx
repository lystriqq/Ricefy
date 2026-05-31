"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRiceStore } from "@/store/useRiceStore";
import type { RiceConfig } from "@/types/rice-config";

// ─── Context Type ─────────────────────────────────────────────────────────────

type RiceConfigContextValue = {
  riceId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;
  loadConfig: (riceId: string) => Promise<void>;
  saveConfig: () => Promise<string | null>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const RiceConfigContext = createContext<RiceConfigContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RiceConfigProvider({
  children,
  initialRiceId,
}: {
  children: ReactNode;
  initialRiceId?: string;
}) {
  const [riceId, setRiceId] = useState<string | null>(initialRiceId ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoadingRef = useRef(false);

  const { config, setName, setColors, setFont, setWM, setBar, setTerminal, setLauncher, setLockScreen } =
    useRiceStore();

  // ── Dirty tracking ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoadingRef.current) return;
    setIsDirty(true);
  }, [config]);

  // ── Load ───────────────────────────────────────────────────────────────────

  const loadConfig = useCallback(async (id: string) => {
    setIsLoading(true);
    isLoadingRef.current = true;
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("rices")
        .select("id, config_json")
        .eq("id", id)
        .single();

      if (dbError) throw new Error(dbError.message);

      const saved = data.config_json as RiceConfig;
      setName(saved.name);
      setColors(saved.colors);
      setFont(saved.font);
      setWM(saved.wm);
      setBar(saved.bar);
      setTerminal(saved.terminal);
      setLauncher(saved.launcher);
      setLockScreen(saved.lockscreen);
      setRiceId(data.id);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load config");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [setName, setColors, setFont, setWM, setBar, setTerminal, setLauncher, setLockScreen]);

  // ── Load initial rice on mount ─────────────────────────────────────────────

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialRiceId) void loadConfig(initialRiceId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────

  const saveConfig = useCallback(async (): Promise<string | null> => {
    setIsSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const payload = {
        user_id: user.id,
        config_json: config,
        status: "draft" as const,
      };

      let id: string;
      if (riceId) {
        const { error: dbError } = await supabase
          .from("rices")
          .update({ config_json: config })
          .eq("id", riceId);
        if (dbError) throw new Error(dbError.message);
        id = riceId;
      } else {
        const { data, error: dbError } = await supabase
          .from("rices")
          .insert(payload)
          .select("id")
          .single();
        if (dbError) throw new Error(dbError.message);
        id = data.id;
        setRiceId(id);
      }

      setIsDirty(false);
      toast.success("Brouillon sauvegardé");
      return id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [config, riceId]);

  // ── Auto-save every 30s ────────────────────────────────────────────────────

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isDirty) await saveConfig();
    }, 30_000);
    return () => clearInterval(intervalId);
  }, [isDirty, saveConfig]);

  return (
    <RiceConfigContext.Provider
      value={{ riceId, isLoading, isSaving, isDirty, error, loadConfig, saveConfig }}
    >
      {children}
    </RiceConfigContext.Provider>
  );
}

// ─── Internal Hook ────────────────────────────────────────────────────────────

export function useRiceConfigContext() {
  const ctx = useContext(RiceConfigContext);
  if (!ctx) throw new Error("useRiceConfigContext must be used inside <RiceConfigProvider>");
  return ctx;
}
