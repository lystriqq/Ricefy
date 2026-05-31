"use client";

import { useEffect } from "react";
import { useRiceStore } from "@/store/useRiceStore";
import { SelectField } from "@/app/(protected)/configure/_components/controls/SelectField";
import { SliderField } from "@/app/(protected)/configure/_components/controls/SliderField";
import { SANS_FONTS } from "@/types/rice-config";

// ─── Nerd Fonts (SIL OFL) ─────────────────────────────────────────────────────

const NERD_FONTS = [
  "JetBrains Mono",
  "Fira Code",
  "Hack",
  "Iosevka",
  "Cascadia Code",
  "Source Code Pro",
  "Mononoki",
  "Inconsolata",
] as const;


const GOOGLE_FONTS_SLUGS: Record<string, string> = {
  // Nerd Fonts disponibles sur Google Fonts
  "JetBrains Mono": "JetBrains+Mono:ital,wght@0,100..800;1,100..800",
  "Fira Code": "Fira+Code:wght@300..700",
  "Source Code Pro": "Source+Code+Pro:ital,wght@0,200..900;1,200..900",
  Inconsolata: "Inconsolata:wdth,wght@50..200,200..900",
  // Polices interface
  Inter: "Inter:wght@300..700",
  "IBM Plex Sans": "IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400",
  "Noto Sans": "Noto+Sans:wght@300..700",
  Roboto: "Roboto:wght@300;400;500;700",
  Ubuntu: "Ubuntu:wght@300;400;500;700",
  Cantarell: "Cantarell:wght@400;700",
};

const nerdFontOptions = NERD_FONTS.map((f) => ({ value: f, label: f }));
const sansOptions = SANS_FONTS.map((f): { value: string; label: string } => ({
  value: f,
  label: f,
}));

const TERMINAL_SAMPLE = `~ $ ls ./dotfiles
hyprland/  waybar/  kitty/  rofi/

~ $ cat hyprland.conf
gaps_in = 5
gaps_out = 10
rounding = 8`;

// ─── Dynamic Google Fonts loader ──────────────────────────────────────────────

function useDynamicFont(fontFamily: string) {
  useEffect(() => {
    const slug = GOOGLE_FONTS_SLUGS[fontFamily];
    if (!slug) return;
    const id = `gfont-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${slug}&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FontsPanel() {
  const font = useRiceStore((s) => s.config.font);
  const terminal = useRiceStore((s) => s.config.terminal);
  const setFont = useRiceStore((s) => s.setFont);
  const setTerminal = useRiceStore((s) => s.setTerminal);

  const termFont = terminal.kind === "kitty" ? terminal.font_family : font.mono_family;

  useDynamicFont(font.body_family);
  useDynamicFont(termFont);

  function handleTerminalFontChange(family: string) {
    setFont({ mono_family: family });
    if (terminal.kind === "kitty") {
      setTerminal({ ...terminal, font_family: family });
    }
  }

  function handleSizeChange(size: number) {
    setFont({ size });
    if (terminal.kind === "kitty") {
      setTerminal({ ...terminal, font_size: size });
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Waybar / interface ── */}
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Interface (Waybar, Rofi)
        </p>
        <div
          className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground"
          style={{ fontFamily: font.body_family }}
        >
          workspace 1 · 2 · 3{"  "}|{"  "}14:30{"  "}|{"  "}▲ 45%{"  "}wifi
        </div>
        <SelectField
          label="Police"
          value={font.body_family}
          onChange={(v) => setFont({ body_family: v, heading_family: v })}
          options={sansOptions}
        />
      </div>

      {/* ── Terminal ── */}
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Terminal (Kitty)
        </p>
        <pre
          className="overflow-x-auto rounded-md border border-border bg-muted px-3 py-3 leading-relaxed text-foreground"
          style={{ fontFamily: termFont, fontSize: `${font.size}px` }}
        >
          {TERMINAL_SAMPLE}
        </pre>
        <SelectField
          label="Police"
          value={termFont}
          onChange={handleTerminalFontChange}
          options={nerdFontOptions}
        />
      </div>

      {/* ── Size ── */}
      <SliderField
        label="Taille de base"
        value={font.size}
        onChange={handleSizeChange}
        min={10}
        max={16}
        unit="px"
        description="Appliquée au terminal et à l'interface"
      />
    </div>
  );
}
