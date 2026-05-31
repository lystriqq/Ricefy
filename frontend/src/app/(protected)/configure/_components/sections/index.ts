import type { ComponentType } from "react";
import type { SectionId } from "@/store/useRiceStore";
import { ColorsSection } from "./ColorsSection";
import { FontSection } from "./FontSection";
import { WMSection } from "./WMSection";
import { BarSection } from "./BarSection";
import { TerminalSection } from "./TerminalSection";
import { LauncherSection } from "./LauncherSection";
import { LockScreenSection } from "./LockScreenSection";

export type SectionDef = {
  id: SectionId;
  label: string;
  description: string;
  component: ComponentType;
};

export const SECTIONS: SectionDef[] = [
  {
    id: "colors",
    label: "Couleurs",
    description: "Palette de couleurs globale",
    component: ColorsSection,
  },
  {
    id: "font",
    label: "Polices",
    description: "Familles de polices",
    component: FontSection,
  },
  {
    id: "wm",
    label: "Window Manager",
    description: "Hyprland — fenêtres & effets",
    component: WMSection,
  },
  {
    id: "bar",
    label: "Barre",
    description: "Waybar — modules & position",
    component: BarSection,
  },
  {
    id: "terminal",
    label: "Terminal",
    description: "Kitty — apparence & police",
    component: TerminalSection,
  },
  {
    id: "launcher",
    label: "Launcher",
    description: "Rofi / Wofi — lanceur d'apps",
    component: LauncherSection,
  },
  {
    id: "lockscreen",
    label: "Verrouillage",
    description: "Hyprlock / Swaylock / SDDM",
    component: LockScreenSection,
  },
];
