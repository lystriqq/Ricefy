import type { ReactNode } from "react";

const STEPS = [
  { id: "configure", label: "Configure" },
  { id: "review", label: "Review" },
  { id: "download", label: "Download" },
] as const;

type Step = (typeof STEPS)[number]["id"];

type Props = {
  currentStep?: Step;
  preview: ReactNode;
  previewWidth?: string;
  children: ReactNode;
};

export function ConfiguratorLayout({
  currentStep = "configure",
  preview,
  previewWidth = "md:w-[400px]",
  children,
}: Props) {
  const activeIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Progress bar ── */}
      <div className="shrink-0 border-b border-border px-6 py-3">
        <ol className="flex items-center">
          {STEPS.map((step, i) => {
            const isDone = i < activeIndex;
            const isActive = step.id === currentStep;
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

      {/* ── Two-column body ──
          overflow:clip — coupe sans créer de scroll container,
          ce qui permet au sticky du panneau droit de fonctionner.
          Mobile: preview en haut (order-1), contrôles en bas (order-2).
          Desktop: contrôles à gauche, preview sticky à droite.
      ── */}
      <div className="flex min-h-0 flex-1 flex-col [overflow:clip] md:flex-row">
        {/* Left panel — scrolls internally */}
        <div className="order-2 flex min-h-0 min-w-0 flex-1 overflow-hidden md:order-1 md:border-r md:border-border">
          {children}
        </div>

        {/* Right panel — sticky */}
        <div className={`order-1 shrink-0 border-b border-border md:sticky md:top-0 md:order-2 md:max-h-screen md:overflow-y-auto md:border-b-0 ${previewWidth}`}>
          {preview}
        </div>
      </div>
    </div>
  );
}
