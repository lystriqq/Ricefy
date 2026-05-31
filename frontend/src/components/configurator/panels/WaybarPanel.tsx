"use client";

import { useRef } from "react";
import { useRiceStore } from "@/store/useRiceStore";
import { SliderField } from "@/app/(protected)/configure/_components/controls/SliderField";
import { ToggleField } from "@/app/(protected)/configure/_components/controls/ToggleField";
import type { WaybarModule, WaybarConfig } from "@/types/rice-config";
import { MODULE_META } from "@/lib/waybar-meta";

// ─── Zone definitions ─────────────────────────────────────────────────────────

const ZONE_MODULES: Record<"left" | "center" | "right", WaybarModule[]> = {
  left:   ["hyprland/workspaces", "hyprland/window", "hyprland/taskbar", "hyprland/submap"],
  center: ["clock", "custom/date", "custom/separator"],
  right:  ["cpu", "memory", "disk", "temperature", "network", "bluetooth", "battery", "pulseaudio", "tray", "custom/power"],
};

// ─── Module zone with drag & drop ────────────────────────────────────────────

function ModuleZone({
  label,
  available,
  active,
  onToggle,
  onReorder,
}: {
  label: string;
  available: WaybarModule[];
  active: WaybarModule[];
  onToggle: (mod: WaybarModule) => void;
  onReorder: (mods: WaybarModule[]) => void;
}) {
  const dragIdx = useRef<number | null>(null);

  function handleDrop(dropIdx: number) {
    if (dragIdx.current === null || dragIdx.current === dropIdx) return;
    const next = [...active];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dropIdx, 0, moved);
    onReorder(next);
    dragIdx.current = null;
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      {/* Active modules — draggable chips */}
      {active.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {active.map((mod, i) => (
            <div
              key={mod}
              draggable
              onDragStart={() => { dragIdx.current = i; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { dragIdx.current = null; }}
              className="flex cursor-grab items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs transition-opacity active:cursor-grabbing active:opacity-40"
            >
              <span className="select-none text-[10px] text-muted-foreground/40">⠿</span>
              {MODULE_META[mod].label}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground/50 italic">Aucun module actif</p>
      )}

      {/* Checkboxes — add/remove */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {available.map((mod) => (
          <label key={mod} className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={active.includes(mod)}
              onChange={() => onToggle(mod)}
              className="h-3 w-3 accent-foreground"
            />
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {MODULE_META[mod].label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WaybarPanel() {
  const bar = useRiceStore((s) => s.config.bar) as WaybarConfig;
  const setBar = useRiceStore((s) => s.setBar);

  function patch<K extends keyof WaybarConfig>(key: K, value: WaybarConfig[K]) {
    setBar({ ...bar, [key]: value });
  }

  function toggleModule(zone: keyof typeof ZONE_MODULES, mod: WaybarModule) {
    const key = `modules_${zone}` as "modules_left" | "modules_center" | "modules_right";
    const current = bar[key];
    patch(key, current.includes(mod) ? current.filter((m) => m !== mod) : [...current, mod]);
  }

  function reorder(zone: keyof typeof ZONE_MODULES, mods: WaybarModule[]) {
    const key = `modules_${zone}` as "modules_left" | "modules_center" | "modules_right";
    patch(key, mods);
  }

  return (
    <div className="space-y-8">
      {/* Position */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Position
        </p>
        <div className="flex gap-2">
          {(["top", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => patch("position", pos)}
              className={[
                "flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors",
                bar.position === pos
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
              ].join(" ")}
            >
              {pos === "top" ? "Haut" : "Bas"}
            </button>
          ))}
        </div>
      </div>

      {/* Height */}
      <SliderField
        label="Hauteur"
        value={bar.height}
        onChange={(v) => patch("height", v)}
        min={24}
        max={48}
        unit="px"
      />

      <div className="border-t border-border" />

      {/* Module zones */}
      <ModuleZone
        label="Gauche"
        available={ZONE_MODULES.left}
        active={bar.modules_left}
        onToggle={(m) => toggleModule("left", m)}
        onReorder={(ms) => reorder("left", ms)}
      />
      <ModuleZone
        label="Centre"
        available={ZONE_MODULES.center}
        active={bar.modules_center}
        onToggle={(m) => toggleModule("center", m)}
        onReorder={(ms) => reorder("center", ms)}
      />
      <ModuleZone
        label="Droite"
        available={ZONE_MODULES.right}
        active={bar.modules_right}
        onToggle={(m) => toggleModule("right", m)}
        onReorder={(ms) => reorder("right", ms)}
      />

      <div className="border-t border-border" />

      {/* Display toggles */}
      <div className="space-y-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Affichage
        </p>
        <ToggleField
          label="Icônes"
          value={bar.show_icons}
          onChange={(v) => patch("show_icons", v)}
          description="Afficher les icônes des modules"
        />
        <ToggleField
          label="Labels texte"
          value={bar.show_labels}
          onChange={(v) => patch("show_labels", v)}
          description="Afficher les labels texte des modules"
        />
      </div>
    </div>
  );
}
