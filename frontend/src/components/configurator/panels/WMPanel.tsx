"use client";

import { useRiceStore } from "@/store/useRiceStore";
import { SliderField } from "@/app/(protected)/configure/_components/controls/SliderField";
import { ToggleField } from "@/app/(protected)/configure/_components/controls/ToggleField";
import { ImageUploadField } from "@/app/(protected)/configure/_components/controls/ImageUploadField";
import type { HyprlandConfig, WallpaperTool } from "@/types/rice-config";

const WALLPAPER_TOOLS: { value: WallpaperTool; label: string; description: string }[] = [
  { value: "hyprpaper", label: "hyprpaper", description: "Officiel Hyprland" },
  { value: "swww",      label: "swww",      description: "Transitions animées" },
  { value: "swaybg",    label: "swaybg",    description: "Simple et léger" },
];

// ─── Presets ──────────────────────────────────────────────────────────────────

type WMPreset = {
  label: string;
  hint: string;
  values: Pick<HyprlandConfig, "gaps_in" | "gaps_out" | "border_size" | "rounding">;
};

const PRESETS: WMPreset[] = [
  {
    label: "Minimal",
    hint: "gaps 4/8 · b1 · r8",
    values: { gaps_in: 4, gaps_out: 8, border_size: 1, rounding: 8 },
  },
  {
    label: "Cozy",
    hint: "gaps 8/16 · b2 · r12",
    values: { gaps_in: 8, gaps_out: 16, border_size: 2, rounding: 12 },
  },
  {
    label: "Zero",
    hint: "gaps 0 · b0 · r0",
    values: { gaps_in: 0, gaps_out: 0, border_size: 0, rounding: 0 },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function WMPanel() {
  const wm = useRiceStore((s) => s.config.wm) as HyprlandConfig;
  const setWM = useRiceStore((s) => s.setWM);

  function patch<K extends keyof HyprlandConfig>(key: K, value: HyprlandConfig[K]) {
    setWM({ ...wm, [key]: value });
  }

  return (
    <div className="space-y-8">
      {/* Wallpaper */}
      <div className="space-y-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Fond d&apos;écran
        </p>
        <ImageUploadField
          label="Image"
          value={wm.wallpaper_image}
          onChange={(v) => patch("wallpaper_image", v)}
          uploadPath="wallpaper"
        />
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Outil
          </p>
          <div className="grid grid-cols-3 gap-2">
            {WALLPAPER_TOOLS.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => patch("wallpaper_tool", value)}
                className={[
                  "flex flex-col items-start rounded-md border px-3 py-2.5 text-left transition-colors",
                  wm.wallpaper_tool === value
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-foreground/40",
                ].join(" ")}
              >
                <span className={["text-sm font-medium", wm.wallpaper_tool === value ? "text-foreground" : "text-muted-foreground"].join(" ")}>
                  {label}
                </span>
                <span className="mt-0.5 text-[10px] text-muted-foreground/70">{description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Presets */}
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Presets
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setWM({ ...wm, ...preset.values })}
              className="flex flex-col gap-1 rounded-md border border-border p-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted"
            >
              <span className="text-sm font-medium">{preset.label}</span>
              <span className="text-[10px] text-muted-foreground">{preset.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Espacement */}
      <div className="space-y-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Espacement
        </p>
        <SliderField
          label="Gaps internes"
          value={wm.gaps_in}
          onChange={(v) => patch("gaps_in", v)}
          min={0}
          max={20}
          unit="px"
          description="Espacement entre les fenêtres"
        />
        <SliderField
          label="Gaps externes"
          value={wm.gaps_out}
          onChange={(v) => patch("gaps_out", v)}
          min={0}
          max={40}
          unit="px"
          description="Espacement avec les bords de l'écran"
        />
      </div>

      {/* Fenêtres */}
      <div className="space-y-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Fenêtres
        </p>
        <SliderField
          label="Épaisseur des bordures"
          value={wm.border_size}
          onChange={(v) => patch("border_size", v)}
          min={0}
          max={8}
          unit="px"
        />
        <SliderField
          label="Arrondi des coins"
          value={wm.rounding}
          onChange={(v) => patch("rounding", v)}
          min={0}
          max={20}
          unit="px"
        />
        <SliderField
          label="Opacité active"
          value={wm.active_opacity}
          onChange={(v) => patch("active_opacity", v)}
          min={0.5}
          max={1.0}
          step={0.05}
          description="Fenêtre au premier plan"
        />
        <SliderField
          label="Opacité inactive"
          value={wm.inactive_opacity}
          onChange={(v) => patch("inactive_opacity", v)}
          min={0.5}
          max={1.0}
          step={0.05}
          description="Fenêtres en arrière-plan"
        />
      </div>

      <div className="border-t border-border" />

      {/* Effets */}
      <div className="space-y-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Effets
        </p>
        <ToggleField
          label="Animations"
          value={wm.animations}
          onChange={(v) => patch("animations", v)}
          description="Transitions et animations de fenêtres"
        />
        <ToggleField
          label="Blur"
          value={wm.blur}
          onChange={(v) => patch("blur", v)}
          description="Flou d'arrière-plan (gaussian blur)"
        />
        {wm.blur && (
          <SliderField
            label="Intensité du blur"
            value={wm.blur_size}
            onChange={(v) => patch("blur_size", v)}
            min={1}
            max={20}
          />
        )}
        <ToggleField
          label="Ombres"
          value={wm.shadow}
          onChange={(v) => patch("shadow", v)}
          description="Ombres portées sur les fenêtres"
        />
      </div>
    </div>
  );
}
