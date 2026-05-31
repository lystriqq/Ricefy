import type { WaybarModule } from "@/types/rice-config";

export const MODULE_META: Record<WaybarModule, { label: string; icon: string; preview: string }> = {
  "hyprland/workspaces": { label: "Workspaces", icon: "⬜",  preview: "1 2 3" },
  "hyprland/window":     { label: "Titre",       icon: "▣",   preview: "kitty" },
  "hyprland/taskbar":    { label: "Taskbar",      icon: "≡",   preview: "≡" },
  "hyprland/submap":     { label: "Submap",       icon: "◈",   preview: "[S]" },
  "clock":               { label: "Horloge",      icon: "◷",   preview: "14:30" },
  "custom/date":         { label: "Date",          icon: "◻",   preview: "mer 28" },
  "custom/separator":    { label: "Séparateur",    icon: "|",   preview: "|" },
  "cpu":                 { label: "CPU",           icon: "▤",   preview: "12%" },
  "memory":              { label: "RAM",           icon: "▥",   preview: "4G" },
  "disk":                { label: "Disk",          icon: "▦",   preview: "45G" },
  "temperature":         { label: "Temp",          icon: "◉",   preview: "42°" },
  "network":             { label: "Réseau",        icon: "⇆",   preview: "wifi" },
  "bluetooth":           { label: "Bluetooth",     icon: "◎",   preview: "BT" },
  "battery":             { label: "Batterie",      icon: "▲",   preview: "80%" },
  "pulseaudio":          { label: "Volume",        icon: "♪",   preview: "60%" },
  "tray":                { label: "Tray",          icon: "⬚",   preview: "⬚" },
  "custom/power":        { label: "Power",         icon: "⏻",   preview: "⏻" },
};

export function renderModuleText(
  mod: WaybarModule,
  showIcons: boolean,
  showLabels: boolean,
): string {
  const meta = MODULE_META[mod];
  if (showIcons && showLabels) return `${meta.icon} ${meta.preview}`;
  if (showIcons) return meta.icon;
  if (showLabels) return meta.preview;
  return meta.icon;
}
