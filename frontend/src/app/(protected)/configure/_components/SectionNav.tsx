"use client";

import { useRiceStore } from "@/store/useRiceStore";
import { SECTIONS } from "./sections";

export function SectionNav() {
  const activeSection = useRiceStore((s) => s.activeSection);
  const setActiveSection = useRiceStore((s) => s.setActiveSection);

  return (
    <nav className="flex w-52 shrink-0 flex-col gap-0.5 border-r border-border p-3">
      {SECTIONS.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={[
              "group flex flex-col items-start rounded-md px-3 py-2 text-left transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            <span className="text-sm font-medium">{section.label}</span>
            <span
              className={[
                "text-[11px] leading-tight",
                isActive ? "text-background/70" : "text-muted-foreground/70",
              ].join(" ")}
            >
              {section.description}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
