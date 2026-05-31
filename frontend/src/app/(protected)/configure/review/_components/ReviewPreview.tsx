"use client";

import { useState } from "react";
import { toast } from "sonner";
import type {
  RiceConfig,
  HyprlandConfig,
  WaybarConfig,
  KittyConfig,
  HyprlockConfig,
  SwaylockConfig,
  SddmConfig,
} from "@/types/rice-config";
import { renderModuleText } from "@/lib/waybar-meta";

type PreviewView = "wm" | "terminal" | "lockscreen";

const VIEW_LABELS: Record<PreviewView, string> = {
  wm: "Bureau",
  terminal: "Terminal",
  lockscreen: "Verrouillage",
};

// ─── WM / Bureau preview ──────────────────────────────────────────────────────

function WMPreview({ config }: { config: RiceConfig }) {
  const { colors, font } = config;
  const wm = config.wm as HyprlandConfig;
  const waybar = config.bar as WaybarConfig;
  const kitty = config.terminal as KittyConfig;

  const isBarTop = waybar.position === "top";
  const barHeight = Math.max(20, Math.round(waybar.height * 0.65));
  const borderRadius = `${wm.rounding}px`;
  const borderSize = wm.border_size;
  const scaledGapOut = Math.round(wm.gaps_out * 0.55);
  const scaledGapIn = Math.round(wm.gaps_in * 0.55);
  const shadowActive = wm.shadow ? "0 8px 32px rgba(0,0,0,0.6)" : "none";
  const shadowInactive = wm.shadow ? "0 4px 16px rgba(0,0,0,0.4)" : "none";
  const termFont = kitty.font_family;
  const cursorChar = kitty.cursor_shape === "block" ? "█" : kitty.cursor_shape === "beam" ? "▏" : "▁";

  function barChip(m: string, color: string) {
    if (m === "hyprland/workspaces") {
      return (
        <div key={m} className="flex shrink-0 items-center gap-0.5">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className="flex h-3 w-3 items-center justify-center rounded-[2px] text-[6px] font-bold"
              style={{
                backgroundColor: n === 1 ? colors.accent : "transparent",
                color: n === 1 ? colors.background : colors.foreground + "50",
                border: n !== 1 ? `1px solid ${colors.border}` : "none",
              }}
            >
              {n}
            </span>
          ))}
        </div>
      );
    }
    return (
      <span key={m} className="shrink-0 whitespace-nowrap text-[9px]" style={{ color }}>
        {renderModuleText(m as Parameters<typeof renderModuleText>[0], waybar.show_icons, waybar.show_labels)}
      </span>
    );
  }

  return (
    <div
      className="aspect-video w-full flex flex-col overflow-hidden rounded-xl border border-border"
      style={{
        backgroundColor: colors.background,
        backgroundImage: wm.wallpaper_image ? `url(${wm.wallpaper_image})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {isBarTop && (
        <div
          className="flex shrink-0 items-center px-3"
          style={{ backgroundColor: colors.surface, height: `${barHeight}px`, borderBottom: `1px solid ${colors.border}`, fontFamily: font.body_family }}
        >
          <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
            {waybar.modules_left.map((m) => barChip(m, colors.foreground))}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {waybar.modules_center.map((m) => barChip(m, colors.foreground))}
          </div>
          <div className="flex flex-1 items-center justify-end gap-1.5 overflow-hidden">
            {waybar.modules_right.map((m) => barChip(m, colors.foreground + "80"))}
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0" style={{ padding: `${scaledGapOut}px`, gap: `${scaledGapIn}px` }}>
        {/* Active window — terminal */}
        <div
          className="flex flex-[2] flex-col overflow-hidden"
          style={{ border: `${borderSize}px solid ${colors.accent}`, borderRadius, opacity: wm.active_opacity, boxShadow: shadowActive }}
        >
          <div className="flex shrink-0 items-center gap-2 px-3 py-1.5" style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#febc2e" }} />
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#28c840" }} />
            <span className="ml-1 text-[9px]" style={{ color: colors.foreground + "60", fontFamily: termFont }}>kitty</span>
          </div>
          <div
            className="flex-1 overflow-hidden p-3"
            style={{ backgroundColor: colors.background, fontFamily: termFont, fontSize: "10px", lineHeight: 1.6 }}
          >
            <p><span style={{ color: colors.accent }}>~</span><span style={{ color: colors.foreground + "50" }}> $ </span><span style={{ color: colors.foreground }}>neofetch</span></p>
            {[["  /\\  ", "user@arch"], [" /  \\ ", "OS: Arch Linux"], ["/____\\", "WM: Hyprland"], ["      ", `Theme: ${config.name}`]].map(([art, info], i) => (
              <p key={i} style={{ display: "flex", gap: "8px" }}>
                <span style={{ color: colors.accent, whiteSpace: "pre" }}>{art}</span>
                <span style={{ color: i === 0 ? colors.accent : colors.foreground + "99" }}>{info}</span>
              </p>
            ))}
            <p style={{ display: "flex", gap: "3px", margin: "4px 0" }}>
              {Object.values(colors).map((c, i) => <span key={i} style={{ color: c }}>■</span>)}
            </p>
            <p><span style={{ color: colors.accent }}>~</span><span style={{ color: colors.foreground + "50" }}> $ </span>
              <span className={kitty.cursor_blink ? "animate-pulse" : ""} style={{ color: colors.foreground }}>{cursorChar}</span>
            </p>
          </div>
        </div>

        {/* Inactive window */}
        <div
          className="flex flex-[1] flex-col overflow-hidden"
          style={{ backgroundColor: colors.surface, border: `${borderSize}px solid ${colors.border}`, borderRadius, opacity: wm.inactive_opacity, boxShadow: shadowInactive }}
        >
          <div className="flex shrink-0 items-center gap-2 px-3 py-1.5" style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.border }} />
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.border }} />
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.border }} />
            <span className="ml-1 text-[9px]" style={{ color: colors.foreground + "40" }}>nvim</span>
          </div>
          <div className="p-3">
            {["local config = {}", '  theme = "ricefy",', "  lazy = true,", "", "  plugins = {", "    -- colorscheme", "  },", "}"].map((line, i) => (
              <p key={i} className="text-[9px] leading-relaxed truncate" style={{ color: colors.foreground + "55", fontFamily: termFont }}>{line || " "}</p>
            ))}
          </div>
        </div>
      </div>

      {!isBarTop && (
        <div
          className="flex shrink-0 items-center px-3"
          style={{ backgroundColor: colors.surface, height: `${barHeight}px`, borderTop: `1px solid ${colors.border}`, fontFamily: font.body_family }}
        >
          <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
            {waybar.modules_left.map((m) => barChip(m, colors.foreground))}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {waybar.modules_center.map((m) => barChip(m, colors.foreground))}
          </div>
          <div className="flex flex-1 items-center justify-end gap-1.5 overflow-hidden">
            {waybar.modules_right.map((m) => barChip(m, colors.foreground + "80"))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Terminal preview ─────────────────────────────────────────────────────────

function TerminalPreview({ config }: { config: RiceConfig }) {
  const { colors } = config;
  const kitty = config.terminal as KittyConfig;
  const termFont = kitty.font_family;
  const cursorChar = kitty.cursor_shape === "block" ? "█" : kitty.cursor_shape === "beam" ? "▏" : "▁";
  const wm = config.wm as HyprlandConfig;

  return (
    <div
      className="aspect-video w-full flex flex-col overflow-hidden rounded-xl"
      style={{ border: `${wm.border_size}px solid ${colors.accent}`, borderRadius: `${wm.rounding}px`, boxShadow: wm.shadow ? "0 8px 32px rgba(0,0,0,0.6)" : "none" }}
    >
      {/* Title bar */}
      <div
        className="flex shrink-0 items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}
      >
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#febc2e" }} />
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#28c840" }} />
        <span className="ml-2 text-xs" style={{ color: colors.foreground + "60", fontFamily: termFont }}>
          kitty — {kitty.font_family} {kitty.font_size}px
        </span>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          backgroundColor: colors.background,
          padding: `${kitty.padding_y}px ${kitty.padding_x}px`,
          fontFamily: termFont,
          fontSize: `${kitty.font_size}px`,
          lineHeight: 1.6,
        }}
      >
        <p><span style={{ color: colors.accent }}>~</span><span style={{ color: colors.foreground + "50" }}> $ </span><span style={{ color: colors.foreground }}>neofetch</span></p>
        {[
          ["  /\\  ", "user@arch", colors.accent],
          [" /  \\ ", `OS: Arch Linux`, colors.foreground + "cc"],
          ["/____\\", `WM: Hyprland`, colors.foreground + "cc"],
          ["      ", `Theme: ${config.name}`, colors.foreground + "cc"],
          ["      ", `Font: ${termFont}`, colors.foreground + "cc"],
          ["      ", `Terminal: kitty`, colors.foreground + "cc"],
        ].map(([art, info, infoColor], i) => (
          <p key={i} style={{ display: "flex", gap: "10px" }}>
            <span style={{ color: colors.accent, whiteSpace: "pre" }}>{art}</span>
            <span style={{ color: infoColor }}>{info}</span>
          </p>
        ))}
        <p style={{ display: "flex", gap: "4px", margin: "6px 0" }}>
          {Object.values(colors).map((c, i) => <span key={i} style={{ color: c, fontSize: `${kitty.font_size + 2}px` }}>■</span>)}
        </p>
        <p><span style={{ color: colors.accent }}>~</span><span style={{ color: colors.foreground + "50" }}> $ </span>
          <span className={kitty.cursor_blink ? "animate-pulse" : ""} style={{ color: colors.foreground }}>{cursorChar}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Lockscreen preview ───────────────────────────────────────────────────────

function LockscreenPreview({ config }: { config: RiceConfig }) {
  const { colors, font } = config;
  const lock = config.lockscreen;

  const bgColor =
    lock.kind === "hyprlock" ? (lock as HyprlockConfig).background_color :
    lock.kind === "swaylock" ? (lock as SwaylockConfig).color :
    (lock as SddmConfig).background_color;

  const bgImage =
    lock.kind === "hyprlock" ? (lock as HyprlockConfig).background_image :
    lock.kind === "swaylock" ? (lock as SwaylockConfig).background_image :
    (lock as SddmConfig).background_image;

  const hasBlur =
    lock.kind === "hyprlock" ? (lock as HyprlockConfig).blur :
    lock.kind === "swaylock" ? (lock as SwaylockConfig).blur :
    (lock as SddmConfig).blur;

  const layout =
    lock.kind === "hyprlock" ? (lock as HyprlockConfig).layout :
    lock.kind === "swaylock" ? (lock as SwaylockConfig).layout :
    (lock as SddmConfig).layout;

  const hasClock =
    lock.kind === "hyprlock" ? (lock as HyprlockConfig).clock :
    lock.kind === "swaylock" ? (lock as SwaylockConfig).clock :
    false;

  const showLogo = lock.kind === "sddm" ? (lock as SddmConfig).show_logo : false;
  const lockFont = lock.kind === "sddm" ? (lock as SddmConfig).font : font.body_family;
  const theme =
    lock.kind === "hyprlock" ? (lock as HyprlockConfig).theme :
    lock.kind === "swaylock" ? (lock as SwaylockConfig).theme :
    (lock as SddmConfig).theme;

  const layoutY =
    lock.kind === "hyprlock" ? (lock as HyprlockConfig).layout_y :
    lock.kind === "swaylock" ? (lock as SwaylockConfig).layout_y :
    (lock as SddmConfig).layout_y;

  const justifyX = layout === "left" ? "flex-start" : layout === "right" ? "flex-end" : "center";
  const alignY = (layoutY ?? "center") === "top" ? "flex-start" : (layoutY ?? "center") === "bottom" ? "flex-end" : "center";

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-border flex p-8"
      style={{
        backgroundColor: bgColor,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        justifyContent: justifyX,
        alignItems: alignY,
      }}
    >
      {hasBlur && (
        <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.35)" }} />
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          fontFamily: lockFont,
          padding: "0 32px",
        }}
      >
        {showLogo && (
          <p style={{ fontSize: "13px", color: colors.foreground + "90", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            arch-machine
          </p>
        )}
        {hasClock && (
          <p style={{ fontSize: "52px", fontWeight: 700, color: colors.foreground, lineHeight: 1, letterSpacing: "-0.02em" }}>
            14:30
          </p>
        )}
        <div
          style={{
            width: "200px",
            height: "38px",
            borderRadius: "8px",
            border: `1px solid ${colors.foreground + "30"}`,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
          }}
        >
          <span style={{ fontSize: "13px", color: colors.foreground + "40" }}>
            {lock.kind === "sddm" ? "username" : "password"}
          </span>
        </div>
        {lock.kind === "sddm" && (
          <div
            style={{
              width: "200px",
              height: "38px",
              borderRadius: "8px",
              backgroundColor: colors.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "13px", color: colors.background, fontWeight: 600 }}>Login</span>
          </div>
        )}
      </div>

      <div style={{ position: "absolute", bottom: "10px", right: "14px", fontSize: "11px", color: colors.foreground + "35" }}>
        {lock.kind} · {theme}
      </div>
    </div>
  );
}

// ─── ReviewPreview ────────────────────────────────────────────────────────────

export function ReviewPreview({ config, riceId }: { config: RiceConfig; riceId: string }) {
  const [view, setView] = useState<PreviewView>("wm");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rice_id: riceId }),
      });
      if (!res.ok) throw new Error("Generation failed");
      window.location.href = `/download?rice_id=${riceId}`;
    } catch {
      toast.error("Erreur lors de la génération. Réessaie.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Preview area — fills available height, preview centered */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-5">
        {view === "wm" && <WMPreview config={config} />}
        {view === "terminal" && <TerminalPreview config={config} />}
        {view === "lockscreen" && <LockscreenPreview config={config} />}
      </div>

      {/* Bottom bar — toggle + generate */}
      <div className="shrink-0 border-t border-border/20 px-5 py-3 space-y-2.5">
        {/* View switcher */}
        <div className="grid grid-cols-3 gap-1.5">
          {(["wm", "terminal", "lockscreen"] as PreviewView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={[
                "rounded-md py-1.5 text-xs font-medium transition-colors",
                view === v
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              ].join(" ")}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-md bg-foreground px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Génération en cours…" : "Générer mon rice"}
          </button>
        </div>
      </div>
    </div>
  );
}
