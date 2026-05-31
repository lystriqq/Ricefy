"use client";

import { useEffect } from "react";
import { useRiceStore } from "@/store/useRiceStore";
import { SliderField } from "@/app/(protected)/configure/_components/controls/SliderField";
import { ToggleField } from "@/app/(protected)/configure/_components/controls/ToggleField";
import { SelectField } from "@/app/(protected)/configure/_components/controls/SelectField";
import { MONO_FONTS } from "@/types/rice-config";
import type { KittyConfig } from "@/types/rice-config";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONO_OPTIONS = MONO_FONTS.map((f) => ({ value: f, label: f }));

const CURSOR_SHAPES: { value: KittyConfig["cursor_shape"]; label: string }[] = [
  { value: "block",     label: "Bloc" },
  { value: "beam",      label: "Barre" },
  { value: "underline", label: "Souligné" },
];

const GF_SLUGS: Partial<Record<string, string>> = {
  "JetBrains Mono": "JetBrains+Mono:ital,wght@0,100..800;1,100..800",
  "Fira Code":      "Fira+Code:wght@300..700",
  "Source Code Pro":"Source+Code+Pro:ital,wght@0,200..900;1,200..900",
  "Inconsolata":    "Inconsolata:wdth,wght@50..200,200..900",
};

// ─── Main component ───────────────────────────────────────────────────────────

export function TerminalPanel() {
  const terminal = useRiceStore((s) => s.config.terminal) as KittyConfig;
  const monoFont = useRiceStore((s) => s.config.font.mono_family);
  const setTerminal = useRiceStore((s) => s.setTerminal);

  useEffect(() => {
    const slug = GF_SLUGS[terminal.font_family];
    if (!slug) return;
    const id = `gf-term-${terminal.font_family.replace(/\s+/g, "-").toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${slug}&display=swap`;
    document.head.appendChild(link);
  }, [terminal.font_family]);

  function patch<K extends keyof KittyConfig>(key: K, value: KittyConfig[K]) {
    setTerminal({ ...terminal, [key]: value });
  }

  return (
    <div className="space-y-8">
      {/* Font */}
      <SelectField
        label="Police"
        value={terminal.font_family}
        onChange={(v) => patch("font_family", v)}
        options={MONO_OPTIONS}
        description={`Police mono définie dans Polices : ${monoFont}`}
      />

      {/* Font size */}
      <SliderField
        label="Taille de police"
        value={terminal.font_size}
        onChange={(v) => patch("font_size", v)}
        min={10}
        max={16}
        unit="px"
      />

      {/* Padding */}
      <SliderField
        label="Padding horizontal"
        value={terminal.padding_x}
        onChange={(v) => patch("padding_x", v)}
        min={4}
        max={24}
        unit="px"
      />
      <SliderField
        label="Padding vertical"
        value={terminal.padding_y}
        onChange={(v) => patch("padding_y", v)}
        min={4}
        max={24}
        unit="px"
      />

      <div className="border-t border-border" />

      {/* Cursor shape */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Forme du curseur
        </p>
        <div className="flex gap-2">
          {CURSOR_SHAPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => patch("cursor_shape", value)}
              className={[
                "flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors",
                terminal.cursor_shape === value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cursor blink */}
      <ToggleField
        label="Curseur clignotant"
        value={terminal.cursor_blink}
        onChange={(v) => patch("cursor_blink", v)}
        description="Animation de clignotement du curseur"
      />
    </div>
  );
}
