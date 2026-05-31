// ─── Color Palette ────────────────────────────────────────────────────────────

export type ColorPalette = {
  accent: string;
  background: string;
  foreground: string;
  border: string;
  surface: string;
};

// ─── Font Config ──────────────────────────────────────────────────────────────

export type FontConfig = {
  heading_family: string;
  body_family: string;
  mono_family: string;
  size: number; // base size in px
};

// ─── WM Config ────────────────────────────────────────────────────────────────

export type WallpaperTool = "hyprpaper" | "swww" | "swaybg";

export type HyprlandConfig = {
  kind: "hyprland";
  gaps_in: number;
  gaps_out: number;
  border_size: number;
  rounding: number;
  active_opacity: number;
  inactive_opacity: number;
  blur: boolean;
  blur_size: number;
  animations: boolean;
  shadow: boolean;
  wallpaper_image?: string;
  wallpaper_tool: WallpaperTool;
};

export type WMConfig = HyprlandConfig;
// future: | SwayConfig | I3Config

// ─── Bar Config ───────────────────────────────────────────────────────────────

export type WaybarModule =
  | "hyprland/workspaces"
  | "hyprland/window"
  | "hyprland/taskbar"
  | "hyprland/submap"
  | "clock"
  | "custom/date"
  | "custom/separator"
  | "cpu"
  | "memory"
  | "disk"
  | "temperature"
  | "network"
  | "bluetooth"
  | "battery"
  | "pulseaudio"
  | "tray"
  | "custom/power";

export type WaybarConfig = {
  kind: "waybar";
  position: "top" | "bottom";
  height: number;
  spacing: number;
  modules_left: WaybarModule[];
  modules_center: WaybarModule[];
  modules_right: WaybarModule[];
  show_icons: boolean;
  show_labels: boolean;
};

export type BarConfig = WaybarConfig;
// future: | PolybarConfig

// ─── Terminal Config ──────────────────────────────────────────────────────────

export type CursorShape = "block" | "beam" | "underline";

export type KittyConfig = {
  kind: "kitty";
  font_family: string;
  font_size: number;
  padding_x: number;
  padding_y: number;
  cursor_shape: CursorShape;
  cursor_blink: boolean;
};

export type TerminalConfig = KittyConfig;
// future: | AlacrittyConfig | FootConfig

// ─── App Launcher Config ──────────────────────────────────────────────────────

export type RofiMode = "launcher" | "dmenu" | "drun" | "window";

export type RofiConfig = {
  kind: "rofi";
  mode: RofiMode;
  width: number;
  lines: number;
  position: "left" | "center" | "right";
  show_icons: boolean;
};

export type WofiConfig = {
  kind: "wofi";
  width: number;
  height: number;
  show_icons: boolean;
};

export type AppLauncherConfig = RofiConfig | WofiConfig;

// ─── Lock Screen Config ───────────────────────────────────────────────────────

export type LockLayout = "center" | "left" | "right";
export type LockLayoutY = "top" | "center" | "bottom";

export type HyprlockConfig = {
  kind: "hyprlock";
  theme: string;
  background_color: string;
  background_image?: string;
  blur: boolean;
  blur_size: number;
  clock: boolean;
  date_format: string;
  layout: LockLayout;
  layout_y: LockLayoutY;
};

export type SwaylockConfig = {
  kind: "swaylock";
  theme: string;
  color: string;
  background_image?: string;
  blur: boolean;
  clock: boolean;
  layout: LockLayout;
  layout_y: LockLayoutY;
};

export type SddmConfig = {
  kind: "sddm";
  theme: string;
  background_color: string;
  background_image?: string;
  font: string;
  show_logo: boolean;
  blur: boolean;
  blur_size: number;
  layout: LockLayout;
  layout_y: LockLayoutY;
};

export type LockScreenConfig = HyprlockConfig | SwaylockConfig | SddmConfig;

// ─── Root Config ──────────────────────────────────────────────────────────────

export type RiceConfig = {
  name: string;
  colors: ColorPalette;
  font: FontConfig;
  wm: WMConfig;
  bar: BarConfig;
  terminal: TerminalConfig;
  launcher: AppLauncherConfig;
  lockscreen: LockScreenConfig;
};

// ─── Kind Helpers ─────────────────────────────────────────────────────────────

export type WMKind = WMConfig["kind"];
export type BarKind = BarConfig["kind"];
export type TermKind = TerminalConfig["kind"];
export type LauncherKind = AppLauncherConfig["kind"];
export type LockKind = LockScreenConfig["kind"];

// ─── Constants ────────────────────────────────────────────────────────────────

export const SANS_FONTS = [
  "Geist Sans",
  "Inter",
  "IBM Plex Sans",
  "Noto Sans",
  "Roboto",
  "Ubuntu",
  "Cantarell",
] as const;

export const MONO_FONTS = [
  "JetBrains Mono",
  "Fira Code",
  "Cascadia Code",
  "Hack Nerd Font",
  "Iosevka Nerd Font",
  "Source Code Pro",
  "Inconsolata",
  "IBM Plex Mono",
] as const;

export const WAYBAR_MODULES: WaybarModule[] = [
  "hyprland/workspaces",
  "hyprland/window",
  "hyprland/taskbar",
  "hyprland/submap",
  "clock",
  "custom/date",
  "custom/separator",
  "cpu",
  "memory",
  "disk",
  "temperature",
  "network",
  "bluetooth",
  "battery",
  "pulseaudio",
  "tray",
  "custom/power",
];

