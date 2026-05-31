"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRiceStore, SECTION_IDS, type SectionId } from "@/store/useRiceStore";
import { useRiceConfig } from "@/hooks/useRiceConfig";
import { SECTIONS } from "./sections";
import { SectionNav } from "./SectionNav";
import { ConfiguratorLayout } from "@/components/configurator/ConfiguratorLayout";
import { ConfigPreview } from "@/components/configurator/ConfigPreview";

export function ConfiguratorShell() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSection = useRiceStore((s) => s.activeSection);
  const setActiveSection = useRiceStore((s) => s.setActiveSection);
  const config = useRiceStore((s) => s.config);
  const resetConfig = useRiceStore((s) => s.resetConfig);
  const { saveConfig, isSaving, isDirty, error } = useRiceConfig();

  // ── Activate section from URL param on mount ──────────────────────────────
  useEffect(() => {
    const s = searchParams.get("section") as SectionId | null;
    if (s && SECTION_IDS.includes(s)) setActiveSection(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentSection = SECTIONS.find((s) => s.id === activeSection);
  const SectionComponent = currentSection?.component;

  async function handleContinue() {
    const id = await saveConfig();
    if (id) router.push(`/configure/review?id=${id}`);
  }

  return (
    <ConfiguratorLayout preview={<ConfigPreview />}>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── Sidebar navigation ── */}
        <SectionNav />

        {/* ── Section content ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Section header */}
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold">{currentSection?.label}</h2>
            <p className="text-xs text-muted-foreground">
              {currentSection?.description}
            </p>
          </div>

          {/* Scrollable options */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {SectionComponent && <SectionComponent />}
          </div>

          {/* Footer actions */}
          <div className="shrink-0 flex items-center justify-between border-t border-border px-6 py-4">
            {/* Left */}
            <button
              onClick={resetConfig}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Réinitialiser
            </button>

            {/* Center — dirty indicator */}
            <div className="flex items-center gap-1.5">
              {isDirty && (
                <span className="text-[11px] text-muted-foreground">
                  · non sauvegardé
                </span>
              )}
              {error && (
                <span className="max-w-[180px] truncate text-[11px] text-red-500">
                  {error}
                </span>
              )}
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <span className="font-medium text-foreground">{config.name}</span>
                <span>·</span>
                <span>{config.wm.kind}</span>
              </div>

              <button
                onClick={() => void saveConfig()}
                disabled={isSaving || !isDirty}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? "..." : "Sauvegarder"}
              </button>

              <button
                onClick={() => void handleContinue()}
                disabled={isSaving}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuer →
              </button>
            </div>
          </div>
        </div>
      </div>
    </ConfiguratorLayout>
  );
}
