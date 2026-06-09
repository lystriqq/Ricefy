"use client";

import { useState } from "react";
import { useRiceStore } from "@/store/useRiceStore";
import type {
  HyprlandConfig, WaybarConfig, KittyConfig, RofiConfig,
  HyprlockConfig, SwaylockConfig, SddmConfig,
} from "@/types/rice-config";
import { renderModuleText } from "@/lib/waybar-meta";

type ExpandedView = "desktop" | "rofi" | "lockscreen" | null;

const ENTRIES_BY_MODE = {
  drun:    [["▣","Files"],["▶","Terminal"],["◎","Firefox"],["⚙","Settings"],["✎","Code"],["◉","Discord"],["▤","Thunar"],["▥","Pavucontrol"],["◈","Steam"],["▦","VLC"],["▧","GIMP"],["▨","Inkscape"],["◇","Obsidian"],["◆","Zathura"],["▩","OBS"]],
  window:  [["◎","Firefox — Github"],["▶","kitty — ~/proj"],["✎","nvim — main.tsx"],["▣","Thunar"],["◉","Discord"],["▤","Spotify"],["⚙","Settings"],["◈","Hyprland"],["▦","VLC — film.mp4"],["▧","Steam"],["▨","kitty — ~/docs"],["◇","Firefox — Youtube"],["◆","nvim — config.lua"],["◈","OBS"],["▩","Pavucontrol"]],
  dmenu:   [["▶","option 1"],["▶","option 2"],["▶","option 3"],["▶","option 4"],["▶","option 5"],["▶","option 6"],["▶","option 7"],["▶","option 8"],["▶","option 9"],["▶","option 10"],["▶","option 11"],["▶","option 12"],["▶","option 13"],["▶","option 14"],["▶","option 15"]],
  launcher:[["▣","Files"],["▶","Terminal"],["◎","Browser"],["⚙","Settings"],["✎","Editor"],["◉","Music"],["▤","Monitor"],["▥","Calc"],["◈","Screenshot"],["▦","Color Picker"],["▧","Clipboard"],["▨","Emoji"],["◇","Password"],["◆","Timer"],["▩","Notes"]],
} as const;

function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Voir en plein écran"
      className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded border border-border bg-background/80 text-[10px] text-muted-foreground backdrop-blur-sm transition-colors hover:border-foreground/40 hover:text-foreground"
    >
      ⤢
    </button>
  );
}

export function ConfigPreview() {
  const [expanded, setExpanded] = useState<ExpandedView>(null);
  const config = useRiceStore((s) => s.config);
  const { colors, font, bar, terminal } = config;
  const wm = config.wm as HyprlandConfig;

  const waybar = bar as WaybarConfig;
  const kitty = terminal as KittyConfig;
  const rofi = config.launcher.kind === "rofi" ? (config.launcher as RofiConfig) : null;
  const isBarTop = waybar.position === "top";
  const barHeight = Math.max(16, Math.round(waybar.height * 0.5));
  const borderRadius = `${wm.rounding}px`;
  const termFont = kitty.font_family;
  const scaledPx = Math.max(2, Math.round(kitty.padding_x * 0.28));
  const scaledPy = Math.max(2, Math.round(kitty.padding_y * 0.28));
  const cursorChar = kitty.cursor_shape === "block" ? "█" : kitty.cursor_shape === "beam" ? "▏" : "▁";
  const borderSize = wm.border_size;
  const scaledGapOut = Math.round(wm.gaps_out * 0.45);
  const scaledGapIn = Math.round(wm.gaps_in * 0.45);
  const shadowActive = wm.shadow ? "0 6px 24px rgba(0,0,0,0.55)" : "none";
  const shadowInactive = wm.shadow ? "0 3px 12px rgba(0,0,0,0.35)" : "none";

  function barChip(m: string, color: string) {
    if (m === "hyprland/workspaces") {
      return (
        <div key={m} className="flex shrink-0 items-center gap-0.5">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className="flex h-2.5 w-2.5 items-center justify-center rounded-[2px] text-[5px] font-bold"
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
    if (m === "custom/separator") {
      return (
        <span key={m} className="shrink-0" style={{ color: colors.border }}>|</span>
      );
    }
    return (
      <span key={m} className="shrink-0 whitespace-nowrap" style={{ color }}>
        {renderModuleText(m as Parameters<typeof renderModuleText>[0], waybar.show_icons, waybar.show_labels)}
      </span>
    );
  }

  // ── Render helpers (plain functions, not components — no hooks) ─────────────

  function renderDesktop(minH: string) {
    return (
      <div
        className="flex flex-col overflow-hidden rounded-lg border border-border"
        style={{
          backgroundColor: colors.background,
          backgroundImage: wm.wallpaper_image ? `url(${wm.wallpaper_image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: minH,
          height: minH,
        }}
      >
        {isBarTop && (
          <div
            className="flex shrink-0 items-center px-2"
            style={{ backgroundColor: colors.surface, height: `${barHeight}px`, borderBottom: `1px solid ${colors.border}`, fontFamily: font.mono_family, fontSize: "8px" }}
          >
            <div className="flex flex-1 items-center gap-1 overflow-hidden">
              {waybar.modules_left.map((m) => barChip(m, colors.foreground))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {waybar.modules_center.map((m) => barChip(m, colors.foreground))}
            </div>
            <div className="flex flex-1 items-center justify-end gap-1 overflow-hidden">
              {waybar.modules_right.map((m) => barChip(m, colors.foreground + "80"))}
            </div>
          </div>
        )}

        <div className="flex flex-1 min-h-0" style={{ padding: `${scaledGapOut}px`, gap: `${scaledGapIn}px` }}>
          {/* Active window */}
          <div
            className="flex flex-[2] flex-col overflow-hidden"
            style={{ border: `${borderSize}px solid ${colors.accent}`, borderRadius, opacity: wm.active_opacity, boxShadow: shadowActive }}
          >
            <div className="flex shrink-0 items-center gap-1.5 px-2 py-1" style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#febc2e" }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#28c840" }} />
              <span className="ml-1 text-[7px]" style={{ color: colors.foreground + "60", fontFamily: termFont }}>kitty</span>
            </div>
            <div
              className="flex-1 overflow-hidden"
              style={{ backgroundColor: colors.background, padding: `${scaledPy}px ${scaledPx}px`, fontFamily: termFont, fontSize: `${Math.round(kitty.font_size * 0.6)}px`, lineHeight: 1.5 }}
            >
              <p>
                <span style={{ color: colors.accent }}>~</span>
                <span style={{ color: colors.foreground + "50" }}> $ </span>
                <span style={{ color: colors.foreground }}>neofetch</span>
              </p>
              {[["  /\\  ", "user@arch"], [" /  \\ ", "OS: Arch Linux"], ["/____\\", "WM: Hyprland"]].map(([art, info], i) => (
                <p key={i} style={{ display: "flex", gap: "6px" }}>
                  <span style={{ color: colors.accent, whiteSpace: "pre" }}>{art}</span>
                  <span style={{ color: i === 0 ? colors.accent : colors.foreground + "99" }}>{info}</span>
                </p>
              ))}
              <p style={{ display: "flex", gap: "2px", margin: "2px 0" }}>
                {Object.values(colors).map((c, i) => <span key={i} style={{ color: c }}>■</span>)}
              </p>
              <p>
                <span style={{ color: colors.accent }}>~</span>
                <span style={{ color: colors.foreground + "50" }}> $ </span>
                <span className={kitty.cursor_blink ? "animate-pulse" : ""} style={{ color: colors.foreground }}>{cursorChar}</span>
              </p>
            </div>
          </div>

          {/* Inactive window */}
          <div
            className="flex flex-[1] flex-col overflow-hidden"
            style={{ backgroundColor: colors.surface, border: `${borderSize}px solid ${colors.border}`, borderRadius, opacity: wm.inactive_opacity, boxShadow: shadowInactive }}
          >
            <div className="flex shrink-0 items-center gap-1.5 px-2 py-1" style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.border }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.border }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.border }} />
              <span className="ml-1 text-[7px]" style={{ color: colors.foreground + "40" }}>nvim</span>
            </div>
            <div className="px-2 py-1.5">
              {["local config = {}", '  theme = "ricefy",', "  lazy = true,"].map((line, i) => (
                <p key={i} className="text-[7px] leading-relaxed truncate" style={{ color: colors.foreground + "50", fontFamily: termFont }}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        {!isBarTop && (
          <div
            className="flex shrink-0 items-center px-2"
            style={{ backgroundColor: colors.surface, height: `${barHeight}px`, borderTop: `1px solid ${colors.border}`, fontFamily: font.mono_family, fontSize: "8px" }}
          >
            <div className="flex flex-1 items-center gap-1 overflow-hidden">
              {waybar.modules_left.map((m) => barChip(m, colors.foreground))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {waybar.modules_center.map((m) => barChip(m, colors.foreground))}
            </div>
            <div className="flex flex-1 items-center justify-end gap-1 overflow-hidden">
              {waybar.modules_right.map((m) => barChip(m, colors.foreground + "80"))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderRofi(rofiCfg: RofiConfig, fullscreen = false) {
    const entries = ENTRIES_BY_MODE[rofiCfg.mode];
    const visible = rofiCfg.lines;
    const rowFontSize = visible <= 7 ? 8 : visible <= 10 ? 7 : 6;
    const rowPy = visible <= 7 ? 3 : visible <= 10 ? 2 : 1;
    const widthPct = fullscreen
      ? `${Math.round(20 + (rofiCfg.width - 400) / (800 - 400) * 40)}%`
      : `${Math.round(30 + (rofiCfg.width - 400) / (800 - 400) * 50)}%`;
    const justifyPos = rofiCfg.position === "center" ? "center" : rofiCfg.position === "left" ? "flex-start" : "flex-end";

    return (
      <div
        className="overflow-hidden rounded-md border border-border"
        style={{ backgroundColor: colors.background, padding: "10px", display: "flex", justifyContent: justifyPos, minHeight: fullscreen ? "60vh" : undefined }}
      >
        <div className="overflow-hidden rounded" style={{ width: widthPct, minWidth: "100px", border: `1px solid ${colors.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
          <div style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.accent}`, padding: "4px 8px", display: "flex", alignItems: "center", gap: "5px", fontSize: "8px" }}>
            <span style={{ color: colors.foreground + "40" }}>◎</span>
            <span style={{ color: colors.foreground + "35" }}>Search...</span>
            <span style={{ marginLeft: "auto", color: colors.foreground + "25", fontSize: "7px" }}>{rofiCfg.mode}</span>
          </div>
          {entries.slice(0, visible).map(([icon, label], i) => (
            <div
              key={i}
              style={{
                backgroundColor: i === 0 ? colors.accent + "20" : colors.surface,
                borderLeft: i === 0 ? `2px solid ${colors.accent}` : "2px solid transparent",
                padding: `${rowPy}px 8px`,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: `${rowFontSize}px`,
              }}
            >
              {rofiCfg.show_icons && <span style={{ color: i === 0 ? colors.accent : colors.foreground + "50" }}>{icon}</span>}
              <span style={{ color: i === 0 ? colors.foreground : colors.foreground + "75" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderLockscreen(fullscreen = false) {
    const lock = config.lockscreen;
    const bgColor =
      lock.kind === "hyprlock" ? (lock as HyprlockConfig).background_color :
      lock.kind === "swaylock" ? (lock as SwaylockConfig).color :
      (lock as SddmConfig).background_color;
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
      true;
    const showLogo = lock.kind === "sddm" ? (lock as SddmConfig).show_logo : false;
    const lockFont = lock.kind === "sddm" ? (lock as SddmConfig).font : font.heading_family;
    const bgImage =
      lock.kind === "hyprlock" ? (lock as HyprlockConfig).background_image :
      lock.kind === "swaylock" ? (lock as SwaylockConfig).background_image :
      (lock as SddmConfig).background_image;
    const layoutY =
      lock.kind === "hyprlock" ? (lock as HyprlockConfig).layout_y :
      lock.kind === "swaylock" ? (lock as SwaylockConfig).layout_y :
      (lock as SddmConfig).layout_y;

    const justifyX = layout === "left" ? "flex-start" : layout === "right" ? "flex-end" : "center";
    const alignY = (layoutY ?? "center") === "top" ? "flex-start" : (layoutY ?? "center") === "bottom" ? "flex-end" : "center";

    return (
      <div
        className="overflow-hidden rounded-md border border-border"
        style={{
          backgroundColor: bgColor,
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: fullscreen ? "70vh" : "90px",
          display: "flex",
          alignItems: alignY,
          justifyContent: justifyX,
          padding: "12px",
          position: "relative",
        }}
      >
        {hasBlur && (
          <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.3)" }} />
        )}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", fontFamily: lockFont }}>
          {hasClock && <p style={{ fontSize: "18px", fontWeight: 700, color: colors.foreground, lineHeight: 1 }}>14:30</p>}
          {hasClock && <p style={{ fontSize: "7px", color: colors.foreground + "80", letterSpacing: "0.02em", marginBottom: "2px" }}>Monday, June 9</p>}
          {showLogo && <p style={{ fontSize: "9px", color: colors.accent, letterSpacing: "0.05em", opacity: 0.7 }}>{config.name}</p>}
          {lock.kind === "sddm" && (
            <div style={{ width: "32px", height: "1.5px", backgroundColor: colors.accent, opacity: 0.6, margin: "3px 0" }} />
          )}
          {lock.kind === "sddm" && (
            <p style={{ fontSize: "7px", color: colors.foreground + "40", letterSpacing: "0.03em" }}>user</p>
          )}
          <div style={{ width: "80px", height: "14px", borderRadius: `${Math.min(wm.rounding, 6)}px`, border: `1px solid ${colors.foreground + "40"}`, backgroundColor: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", padding: "0 6px" }}>
            <span style={{ fontSize: "7px", color: colors.foreground + "40" }}>password</span>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: "4px", right: "6px", fontSize: "7px", color: colors.foreground + "20" }}>
          ricefy.org
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-4 p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Aperçu</p>

        {/* Desktop mockup */}
        <div className="relative">
          <ExpandButton onClick={() => setExpanded("desktop")} />
          {renderDesktop("220px")}
        </div>

        {/* Rofi preview */}
        {rofi && (
          <div className="relative">
            <ExpandButton onClick={() => setExpanded("rofi")} />
            {renderRofi(rofi)}
          </div>
        )}

        {/* Lockscreen preview */}
        <div className="relative">
          <ExpandButton onClick={() => setExpanded("lockscreen")} />
          {renderLockscreen()}
        </div>

        {/* WM params strip */}
        <div className="rounded-md border border-border bg-muted/50 px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-muted-foreground">gaps</span>
            <span className="font-mono font-medium">{wm.gaps_in}/{wm.gaps_out}px</span>
            <span className="text-muted-foreground">border</span>
            <span className="font-mono font-medium">{wm.border_size}px</span>
            <span className="text-muted-foreground">r</span>
            <span className="font-mono font-medium">{wm.rounding}px</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            {([{ label: "blur", value: wm.blur }, { label: "shadow", value: wm.shadow }, { label: "anim", value: wm.animations }] as const).map(({ label, value }) => (
              <span key={label} className="transition-colors" style={{ color: value ? colors.accent : colors.foreground + "30" }}>
                {value ? "●" : "○"} {label}
              </span>
            ))}
            <span className="ml-auto font-mono text-muted-foreground">{wm.active_opacity.toFixed(2)} / {wm.inactive_opacity.toFixed(2)}</span>
          </div>
        </div>

        {/* Color palette */}
        <div className="flex items-center gap-1.5">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key} title={key} className="h-5 flex-1 rounded-sm border border-border" style={{ backgroundColor: value }} />
          ))}
        </div>

        {/* Config summary */}
        <div className="space-y-1.5">
          {[
            ["Police UI", font.body_family],
            ["Terminal", `${terminal.kind} · ${termFont}`],
            ["Launcher", config.launcher.kind],
            ["Lockscreen", config.lockscreen.kind],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fullscreen modal ── */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          onClick={() => setExpanded(null)}
        >
          <div
            className="relative flex max-h-full w-full max-w-4xl flex-col overflow-auto rounded-xl border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {expanded === "desktop" ? "Bureau" : expanded === "rofi" ? "Launcher" : "Écran de verrouillage"}
              </p>
              <button
                onClick={() => setExpanded(null)}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-auto p-6">
              {expanded === "desktop" && renderDesktop("65vh")}
              {expanded === "rofi" && rofi && renderRofi(rofi, true)}
              {expanded === "lockscreen" && renderLockscreen(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
