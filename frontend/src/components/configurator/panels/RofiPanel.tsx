"use client";

import { useRiceStore } from "@/store/useRiceStore";
import { SliderField } from "@/app/(protected)/configure/_components/controls/SliderField";
import { ToggleField } from "@/app/(protected)/configure/_components/controls/ToggleField";
import type { RofiConfig, RofiMode } from "@/types/rice-config";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODES: { value: RofiMode; label: string; description: string }[] = [
  { value: "drun",     label: "drun",     description: "Applications installées" },
  { value: "launcher", label: "launcher", description: "Lanceur générique" },
  { value: "dmenu",    label: "dmenu",    description: "Menu stdin" },
  { value: "window",   label: "window",   description: "Fenêtres ouvertes" },
];

const POSITIONS: { value: RofiConfig["position"]; label: string }[] = [
  { value: "left",   label: "Gauche" },
  { value: "center", label: "Centre" },
  { value: "right",  label: "Droite" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function RofiPanel() {
  const launcher = useRiceStore((s) => s.config.launcher) as RofiConfig;
  const setLauncher = useRiceStore((s) => s.setLauncher);

  function patch<K extends keyof RofiConfig>(key: K, value: RofiConfig[K]) {
    setLauncher({ ...launcher, [key]: value });
  }

  return (
    <div className="space-y-8">
      {/* Mode */}
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Mode
        </p>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(({ value, label, description }) => (
            <button
              key={value}
              onClick={() => patch("mode", value)}
              className={[
                "flex flex-col items-start rounded-md border px-3 py-2.5 text-left transition-colors",
                launcher.mode === value
                  ? "border-foreground bg-foreground/5"
                  : "border-border hover:border-foreground/40",
              ].join(" ")}
            >
              <span className={["text-sm font-medium", launcher.mode === value ? "text-foreground" : "text-muted-foreground"].join(" ")}>
                {label}
              </span>
              <span className="text-[10px] text-muted-foreground/70 mt-0.5">{description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Width */}
      <SliderField
        label="Largeur"
        value={launcher.width}
        onChange={(v) => patch("width", v)}
        min={400}
        max={800}
        unit="px"
      />

      {/* Lines */}
      <SliderField
        label="Lignes affichées"
        value={launcher.lines}
        onChange={(v) => patch("lines", v)}
        min={5}
        max={15}
      />

      {/* Position */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Position
        </p>
        <div className="flex gap-2">
          {POSITIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => patch("position", value)}
              className={[
                "flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors",
                launcher.position === value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Icons */}
      <ToggleField
        label="Icônes d'applications"
        value={launcher.show_icons}
        onChange={(v) => patch("show_icons", v)}
        description="Afficher les icônes à côté des entrées"
      />
    </div>
  );
}
