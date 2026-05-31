"use client";

import { useRiceStore } from "@/store/useRiceStore";
import { ColorField } from "@/app/(protected)/configure/_components/controls/ColorField";
import type { ColorPalette } from "@/types/rice-config";

// ─── Predefined palettes ──────────────────────────────────────────────────────

const PREDEFINED_PALETTES: Record<string, ColorPalette> = {
  "Catppuccin Mocha": {
    accent: "#cba6f7",
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    border: "#313244",
    surface: "#181825",
  },
  Nord: {
    accent: "#88c0d0",
    background: "#2e3440",
    foreground: "#eceff4",
    border: "#3b4252",
    surface: "#242933",
  },
  Gruvbox: {
    accent: "#d79921",
    background: "#282828",
    foreground: "#ebdbb2",
    border: "#3c3836",
    surface: "#1d2021",
  },
  Dracula: {
    accent: "#bd93f9",
    background: "#282a36",
    foreground: "#f8f8f2",
    border: "#44475a",
    surface: "#21222c",
  },
  "Tokyo Night": {
    accent: "#7aa2f7",
    background: "#1a1b26",
    foreground: "#c0caf5",
    border: "#292e42",
    surface: "#16161e",
  },
  "One Dark": {
    accent: "#61afef",
    background: "#282c34",
    foreground: "#abb2bf",
    border: "#3e4451",
    surface: "#21252b",
  },
};

// ─── Random palette generator ─────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): string {
  const lf = l / 100;
  const a = (s * Math.min(lf, 1 - lf)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lf - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateRandomPalette(): ColorPalette {
  const hue = Math.floor(Math.random() * 360);
  const bgL = Math.floor(Math.random() * 8) + 10;
  return {
    accent: hslToHex(hue, 70, 65),
    background: hslToHex(hue, 12, bgL),
    foreground: hslToHex(hue, 15, 85),
    border: hslToHex(hue, 10, bgL + 10),
    surface: hslToHex(hue, 12, bgL + 5),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ColorsPanel() {
  const colors = useRiceStore((s) => s.config.colors);
  const setColors = useRiceStore((s) => s.setColors);

  return (
    <div className="space-y-8">
      {/* Predefined palettes */}
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Palettes prédéfinies
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PREDEFINED_PALETTES).map(([name, palette]) => (
            <button
              key={name}
              onClick={() => setColors(palette)}
              className="group flex flex-col gap-2 rounded-md border border-border p-2.5 text-left transition-colors hover:border-foreground/30 hover:bg-muted"
            >
              <div className="flex gap-1">
                {Object.values(palette).map((color, i) => (
                  <span
                    key={i}
                    className="h-3 flex-1 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Random palette */}
      <button
        onClick={() => setColors(generateRandomPalette())}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <span aria-hidden>↺</span>
        Palette aléatoire
      </button>

      {/* Individual pickers */}
      <div className="space-y-6">
        <ColorField
          label="Accent"
          value={colors.accent}
          onChange={(v) => setColors({ accent: v })}
          description="Couleur principale de mise en évidence"
        />
        <ColorField
          label="Arrière-plan"
          value={colors.background}
          onChange={(v) => setColors({ background: v })}
          description="Fond général du bureau"
        />
        <ColorField
          label="Premier plan"
          value={colors.foreground}
          onChange={(v) => setColors({ foreground: v })}
          description="Couleur du texte principal"
        />
        <ColorField
          label="Bordure"
          value={colors.border}
          onChange={(v) => setColors({ border: v })}
          description="Couleur des bordures de fenêtres"
        />
        <ColorField
          label="Surface"
          value={colors.surface}
          onChange={(v) => setColors({ surface: v })}
          description="Fond des widgets et cartes"
        />
      </div>
    </div>
  );
}
