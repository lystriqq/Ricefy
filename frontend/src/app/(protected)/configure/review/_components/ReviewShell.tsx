"use client";

import Link from "next/link";
import { ReviewPreview } from "./ReviewPreview";
import type {
  RiceConfig,
  HyprlandConfig,
  WaybarConfig,
  KittyConfig,
  RofiConfig,
  WofiConfig,
  HyprlockConfig,
  SwaylockConfig,
  SddmConfig,
} from "@/types/rice-config";

const STEPS = [
  { id: "configure", label: "Configure" },
  { id: "review", label: "Review" },
  { id: "download", label: "Download" },
] as const;

function Section({
  label,
  sectionId,
  children,
}: {
  label: string;
  sectionId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/40">
          {label}
        </span>
        <Link
          href={`/configure?section=${sectionId}`}
          className="text-[9px] text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 hover:text-muted-foreground"
        >
          modifier
        </Link>
      </div>
      <div className="space-y-px">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-[10px] text-muted-foreground/40">{label}</span>
      <span className="truncate text-right font-mono text-[10px] text-muted-foreground/60">{value}</span>
    </div>
  );
}

// ─── ReviewShell ──────────────────────────────────────────────────────────────

export function ReviewShell({
  config,
  riceId,
}: {
  config: RiceConfig;
  riceId: string;
}) {
  const { colors, font, wm, bar, terminal, launcher, lockscreen } = config;
  const hypr = wm as HyprlandConfig;
  const waybar = bar as WaybarConfig;
  const kitty = terminal as KittyConfig;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Progress bar */}
      <div className="shrink-0 border-b border-border px-6 py-3">
        <ol className="flex items-center">
          {STEPS.map((step, i) => {
            const isDone = i < 1;
            const isActive = step.id === "review";
            return (
              <li key={step.id} className="flex items-center">
                <span
                  className={[
                    "text-xs font-medium",
                    isActive
                      ? "text-foreground"
                      : isDone
                        ? "text-foreground/50"
                        : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mx-3 text-xs text-muted-foreground/40">→</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Two-column body */}
      <div className="flex min-h-0 flex-1 flex-col [overflow:clip] md:flex-row">
        {/* Left — specs (25%) */}
        <div className="order-2 flex min-h-0 flex-col overflow-hidden border-r border-border md:order-1 md:w-1/4">
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {/* Colors — full width */}
              <div className="col-span-2">
                <Section label="Couleurs" sectionId="colors">
                  <div className="mb-1 flex gap-0.5">
                    {Object.entries(colors).map(([key, value]) => (
                      <div
                        key={key}
                        title={`${key}: ${value}`}
                        className="h-2.5 flex-1 rounded-[2px] opacity-60"
                        style={{ backgroundColor: value }}
                      />
                    ))}
                  </div>
                  <Row label="accent" value={colors.accent} />
                  <Row label="bg" value={colors.background} />
                  <Row label="fg" value={colors.foreground} />
                </Section>
              </div>

              {/* Font */}
              <Section label="Polices" sectionId="font">
                <Row label="heading" value={font.heading_family} />
                <Row label="body" value={font.body_family} />
                <Row label="mono" value={font.mono_family} />
                <Row label="taille" value={`${font.size}px`} />
              </Section>

              {/* WM */}
              <Section label="Window Manager" sectionId="wm">
                <Row label="gaps" value={`${hypr.gaps_in} / ${hypr.gaps_out}px`} />
                <Row label="border" value={`${hypr.border_size}px`} />
                <Row label="rounding" value={`${hypr.rounding}px`} />
                <Row label="opacity" value={`${hypr.active_opacity} / ${hypr.inactive_opacity}`} />
                <div className="flex gap-2 pt-px">
                  {([["blur", hypr.blur], ["shadow", hypr.shadow], ["anim", hypr.animations]] as const).map(([l, v]) => (
                    <span key={l} className="text-[9px]" style={{ color: v ? "var(--muted-foreground)" : "color-mix(in srgb, var(--muted-foreground) 25%, transparent)" }}>
                      {v ? "●" : "○"} {l}
                    </span>
                  ))}
                </div>
              </Section>

              {/* Bar */}
              <Section label="Barre" sectionId="bar">
                <Row label="position" value={waybar.position} />
                <Row label="hauteur" value={`${waybar.height}px`} />
                <Row label="gauche" value={waybar.modules_left.join(", ") || "—"} />
                <Row label="centre" value={waybar.modules_center.join(", ") || "—"} />
                <Row label="droite" value={waybar.modules_right.join(", ") || "—"} />
              </Section>

              {/* Terminal */}
              <Section label="Terminal" sectionId="terminal">
                <Row label="police" value={kitty.font_family} />
                <Row label="taille" value={`${kitty.font_size}px`} />
                <Row label="padding" value={`${kitty.padding_x} / ${kitty.padding_y}px`} />
                <Row label="curseur" value={`${kitty.cursor_shape}${kitty.cursor_blink ? " blink" : ""}`} />
              </Section>

              {/* Launcher */}
              <Section label="Launcher" sectionId="launcher">
                <Row label="outil" value={launcher.kind} />
                {launcher.kind === "rofi" && (
                  <>
                    <Row label="mode" value={(launcher as RofiConfig).mode} />
                    <Row label="lignes" value={String((launcher as RofiConfig).lines)} />
                    <Row label="position" value={(launcher as RofiConfig).position} />
                  </>
                )}
                {launcher.kind === "wofi" && (
                  <Row label="taille" value={`${(launcher as WofiConfig).width} × ${(launcher as WofiConfig).height}px`} />
                )}
              </Section>

              {/* Lockscreen — full width */}
              <div className="col-span-2">
                <Section label="Verrouillage" sectionId="lockscreen">
                  <div className="grid grid-cols-2 gap-x-4">
                    <div className="space-y-px">
                      <Row label="outil" value={lockscreen.kind} />
                      {lockscreen.kind === "hyprlock" && (
                        <>
                          <Row label="thème" value={(lockscreen as HyprlockConfig).theme} />
                          <Row label="position" value={`${(lockscreen as HyprlockConfig).layout} · ${(lockscreen as HyprlockConfig).layout_y}`} />
                        </>
                      )}
                      {lockscreen.kind === "swaylock" && (
                        <>
                          <Row label="thème" value={(lockscreen as SwaylockConfig).theme} />
                          <Row label="position" value={`${(lockscreen as SwaylockConfig).layout} · ${(lockscreen as SwaylockConfig).layout_y}`} />
                        </>
                      )}
                      {lockscreen.kind === "sddm" && (
                        <>
                          <Row label="thème" value={(lockscreen as SddmConfig).theme} />
                          <Row label="police" value={(lockscreen as SddmConfig).font} />
                        </>
                      )}
                    </div>
                    <div className="space-y-px">
                      {lockscreen.kind === "hyprlock" && (
                        <>
                          <Row label="horloge" value={(lockscreen as HyprlockConfig).clock ? "oui" : "non"} />
                          <Row label="blur" value={(lockscreen as HyprlockConfig).blur ? "oui" : "non"} />
                        </>
                      )}
                    </div>
                  </div>
                </Section>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border/40 px-4 py-3">
            <Link
              href={`/configure?id=${riceId}`}
              className="text-[11px] text-muted-foreground/40 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline"
            >
              ← retour au configurateur
            </Link>
          </div>
        </div>

        {/* Right — preview (75%) */}
        <div className="order-1 flex shrink-0 flex-col border-b border-border md:order-2 md:w-3/4 md:border-b-0 md:sticky md:top-0">
          <ReviewPreview config={config} riceId={riceId} />
        </div>
      </div>
    </div>
  );
}
