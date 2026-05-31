"use client";

import { useRiceStore } from "@/store/useRiceStore";
import { SelectField } from "@/app/(protected)/configure/_components/controls/SelectField";
import { SliderField } from "@/app/(protected)/configure/_components/controls/SliderField";
import { ToggleField } from "@/app/(protected)/configure/_components/controls/ToggleField";
import { ColorField } from "@/app/(protected)/configure/_components/controls/ColorField";
import { ImageUploadField } from "@/app/(protected)/configure/_components/controls/ImageUploadField";
import { SANS_FONTS } from "@/types/rice-config";
import type {
  LockKind,
  LockLayout,
  LockLayoutY,
  HyprlockConfig,
  SwaylockConfig,
  SddmConfig,
} from "@/types/rice-config";
import { DEFAULT_LOCKSCREENS } from "@/lib/defaults";

// ─── Constants ────────────────────────────────────────────────────────────────

const KIND_OPTIONS: { value: LockKind; label: string; description: string }[] = [
  { value: "hyprlock", label: "Hyprlock", description: "Wayland natif (recommandé)" },
  { value: "swaylock", label: "Swaylock", description: "Compatible Sway/Hyprland" },
  { value: "sddm",     label: "SDDM",     description: "Display manager (démarrage)" },
];

const LAYOUT_X: LockLayout[]  = ["left", "center", "right"];
const LAYOUT_Y: LockLayoutY[] = ["top", "center", "bottom"];

const DATE_FORMATS = [
  { value: "%H:%M",    label: "%H:%M  →  14:30" },
  { value: "%H:%M:%S", label: "%H:%M:%S  →  14:30:00" },
  { value: "%I:%M %p", label: "%I:%M %p  →  02:30 PM" },
];

const HYPRLOCK_THEMES = [
  { value: "centered", label: "Centered",  description: "Horloge + champ centré" },
  { value: "minimal",  label: "Minimal",   description: "Champ seul, sans déco" },
  { value: "split",    label: "Split",     description: "Login à gauche, fond à droite" },
  { value: "corners",  label: "Corners",   description: "Éléments dans les coins" },
];

const SWAYLOCK_THEMES = [
  { value: "minimal", label: "Minimal",  description: "Couleur unie + input" },
  { value: "blur",    label: "Blur",     description: "Fond flouté + input" },
  { value: "modern",  label: "Modern",   description: "Overlay sombre + horloge" },
];

const SDDM_THEMES = [
  { value: "simple",                   label: "Simple",         description: "Défaut minimaliste" },
  { value: "sugar-candy",              label: "Sugar Candy",    description: "Arrondi, moderne" },
  { value: "astronaut",                label: "Astronaut",      description: "Sombre, espace" },
  { value: "where-is-my-sddm-theme",  label: "Where Is My",    description: "Ultra minimal" },
];

const FONT_OPTIONS = SANS_FONTS.map((f) => ({ value: f, label: f }));

// ─── Layout picker (3×3 grid) ─────────────────────────────────────────────────

function LayoutPicker({
  layout,
  layoutY,
  onChange,
}: {
  layout: LockLayout;
  layoutY: LockLayoutY;
  onChange: (x: LockLayout, y: LockLayoutY) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Position du formulaire
      </p>
      <div className="inline-grid grid-cols-3 gap-1 rounded-md border border-border p-1.5">
        {LAYOUT_Y.map((y) =>
          LAYOUT_X.map((x) => {
            const active = layout === x && layoutY === y;
            return (
              <button
                key={`${x}-${y}`}
                onClick={() => onChange(x, y)}
                title={`${x} / ${y}`}
                className={[
                  "h-7 w-7 rounded transition-colors",
                  active ? "bg-foreground" : "bg-muted/30 hover:bg-muted",
                ].join(" ")}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Theme picker (shared pattern) ───────────────────────────────────────────

function ThemePicker<T extends string>({
  themes,
  value,
  onChange,
}: {
  themes: { value: T; label: string; description: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Thème
      </p>
      <div className="grid grid-cols-2 gap-2">
        {themes.map(({ value: v, label, description }) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={[
              "flex flex-col items-start rounded-md border px-3 py-2.5 text-left transition-colors",
              value === v
                ? "border-foreground bg-foreground/5"
                : "border-border hover:border-foreground/40",
            ].join(" ")}
          >
            <span className={["text-sm font-medium", value === v ? "text-foreground" : "text-muted-foreground"].join(" ")}>
              {label}
            </span>
            <span className="text-[10px] text-muted-foreground/70 mt-0.5">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Per-kind option panels ───────────────────────────────────────────────────

function HyprlockOptions({ config }: { config: HyprlockConfig }) {
  const setLockScreen = useRiceStore((s) => s.setLockScreen);
  function patch<K extends keyof HyprlockConfig>(key: K, value: HyprlockConfig[K]) {
    setLockScreen({ ...config, [key]: value });
  }
  return (
    <div className="space-y-6">
      <ThemePicker themes={HYPRLOCK_THEMES} value={config.theme} onChange={(v) => patch("theme", v)} />
      <div className="border-t border-border" />
      <ImageUploadField
        label="Image de fond"
        value={config.background_image}
        onChange={(v) => patch("background_image", v)}
        uploadPath="lockscreen"
      />
      {!config.background_image && (
        <ColorField label="Couleur de fond" value={config.background_color} onChange={(v) => patch("background_color", v)} />
      )}
      <ToggleField label="Blur" value={config.blur} onChange={(v) => patch("blur", v)} description="Flou du fond d'écran" />
      {config.blur && (
        <SliderField label="Intensité du blur" value={config.blur_size} onChange={(v) => patch("blur_size", v)} min={1} max={20} />
      )}
      <div className="border-t border-border" />
      <ToggleField label="Horloge" value={config.clock} onChange={(v) => patch("clock", v)} description="Afficher l'heure" />
      {config.clock && (
        <SelectField label="Format" value={config.date_format} onChange={(v) => patch("date_format", v)} options={DATE_FORMATS} />
      )}
      <div className="border-t border-border" />
      <LayoutPicker
        layout={config.layout}
        layoutY={config.layout_y}
        onChange={(x, y) => setLockScreen({ ...config, layout: x, layout_y: y })}
      />
    </div>
  );
}

function SwaylockOptions({ config }: { config: SwaylockConfig }) {
  const setLockScreen = useRiceStore((s) => s.setLockScreen);
  function patch<K extends keyof SwaylockConfig>(key: K, value: SwaylockConfig[K]) {
    setLockScreen({ ...config, [key]: value });
  }
  return (
    <div className="space-y-6">
      <ThemePicker themes={SWAYLOCK_THEMES} value={config.theme} onChange={(v) => patch("theme", v)} />
      <div className="border-t border-border" />
      <ImageUploadField
        label="Image de fond"
        value={config.background_image}
        onChange={(v) => patch("background_image", v)}
        uploadPath="lockscreen"
      />
      {!config.background_image && (
        <ColorField label="Couleur de fond" value={config.color} onChange={(v) => patch("color", v)} />
      )}
      <ToggleField label="Blur" value={config.blur} onChange={(v) => patch("blur", v)} description="Flou du fond d'écran" />
      <ToggleField label="Horloge" value={config.clock} onChange={(v) => patch("clock", v)} description="Afficher l'heure" />
      <div className="border-t border-border" />
      <LayoutPicker
        layout={config.layout}
        layoutY={config.layout_y}
        onChange={(x, y) => setLockScreen({ ...config, layout: x, layout_y: y })}
      />
    </div>
  );
}

function SddmOptions({ config }: { config: SddmConfig }) {
  const setLockScreen = useRiceStore((s) => s.setLockScreen);
  function patch<K extends keyof SddmConfig>(key: K, value: SddmConfig[K]) {
    setLockScreen({ ...config, [key]: value });
  }
  return (
    <div className="space-y-6">
      <ThemePicker themes={SDDM_THEMES} value={config.theme} onChange={(v) => patch("theme", v)} />
      <div className="border-t border-border" />
      <ImageUploadField
        label="Image de fond"
        value={config.background_image}
        onChange={(v) => patch("background_image", v)}
        uploadPath="lockscreen"
      />
      {!config.background_image && (
        <ColorField label="Couleur de fond" value={config.background_color} onChange={(v) => patch("background_color", v)} />
      )}
      <SelectField label="Police" value={config.font} onChange={(v) => patch("font", v)} options={FONT_OPTIONS} />
      <ToggleField label="Logo / hostname" value={config.show_logo} onChange={(v) => patch("show_logo", v)} description="Afficher le nom de la machine" />
      <ToggleField label="Blur" value={config.blur} onChange={(v) => patch("blur", v)} description="Flou du fond d'écran" />
      {config.blur && (
        <SliderField label="Intensité du blur" value={config.blur_size} onChange={(v) => patch("blur_size", v)} min={1} max={20} />
      )}
      <div className="border-t border-border" />
      <LayoutPicker
        layout={config.layout}
        layoutY={config.layout_y}
        onChange={(x, y) => setLockScreen({ ...config, layout: x, layout_y: y })}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LockscreenPanel() {
  const lockscreen = useRiceStore((s) => s.config.lockscreen);
  const setLockScreen = useRiceStore((s) => s.setLockScreen);

  function handleKindChange(kind: LockKind) {
    if (kind === lockscreen.kind) return;
    setLockScreen(DEFAULT_LOCKSCREENS[kind]);
  }

  return (
    <div className="space-y-6">
      {/* Kind selector */}
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Type
        </p>
        <div className="grid grid-cols-3 gap-2">
          {KIND_OPTIONS.map(({ value, label, description }) => (
            <button
              key={value}
              onClick={() => handleKindChange(value)}
              className={[
                "flex flex-col items-start rounded-md border px-3 py-2.5 text-left transition-colors",
                lockscreen.kind === value
                  ? "border-foreground bg-foreground/5"
                  : "border-border hover:border-foreground/40",
              ].join(" ")}
            >
              <span className={["text-sm font-medium", lockscreen.kind === value ? "text-foreground" : "text-muted-foreground"].join(" ")}>
                {label}
              </span>
              <span className="text-[10px] text-muted-foreground/70 mt-0.5">{description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {lockscreen.kind === "hyprlock" && <HyprlockOptions config={lockscreen} />}
      {lockscreen.kind === "swaylock" && <SwaylockOptions config={lockscreen} />}
      {lockscreen.kind === "sddm"     && <SddmOptions config={lockscreen} />}
    </div>
  );
}
