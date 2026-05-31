import { create } from "zustand";
import type { RiceConfig, ColorPalette, FontConfig } from "@/types/rice-config";
import { DEFAULT_RICE_CONFIG } from "@/lib/defaults";

// ─── Section IDs ─────────────────────────────────────────────────────────────

export const SECTION_IDS = [
  "colors",
  "font",
  "wm",
  "bar",
  "terminal",
  "launcher",
  "lockscreen",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

// ─── Store Type ───────────────────────────────────────────────────────────────

type RiceStore = {
  config: RiceConfig;
  activeSection: SectionId;

  // Navigation
  setActiveSection: (id: SectionId) => void;

  // Per-section setters
  setName: (name: string) => void;
  setColors: (colors: Partial<ColorPalette>) => void;
  setFont: (font: Partial<FontConfig>) => void;
  setWM: (wm: RiceConfig["wm"]) => void;
  setBar: (bar: RiceConfig["bar"]) => void;
  setTerminal: (terminal: RiceConfig["terminal"]) => void;
  setLauncher: (launcher: RiceConfig["launcher"]) => void;
  setLockScreen: (lockscreen: RiceConfig["lockscreen"]) => void;

  // Reset
  resetConfig: () => void;
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useRiceStore = create<RiceStore>((set) => ({
  config: DEFAULT_RICE_CONFIG,
  activeSection: "colors",

  setActiveSection: (id) => set({ activeSection: id }),

  setName: (name) =>
    set((state) => ({ config: { ...state.config, name } })),

  setColors: (colors) =>
    set((state) => ({
      config: {
        ...state.config,
        colors: { ...state.config.colors, ...colors },
      },
    })),

  setFont: (font) =>
    set((state) => ({
      config: {
        ...state.config,
        font: { ...state.config.font, ...font },
      },
    })),

  setWM: (wm) =>
    set((state) => ({ config: { ...state.config, wm } })),

  setBar: (bar) =>
    set((state) => ({ config: { ...state.config, bar } })),

  setTerminal: (terminal) =>
    set((state) => ({ config: { ...state.config, terminal } })),

  setLauncher: (launcher) =>
    set((state) => ({ config: { ...state.config, launcher } })),

  setLockScreen: (lockscreen) =>
    set((state) => ({ config: { ...state.config, lockscreen } })),

  resetConfig: () => set({ config: DEFAULT_RICE_CONFIG }),
}));
