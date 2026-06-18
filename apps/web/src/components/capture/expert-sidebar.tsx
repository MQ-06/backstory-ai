"use client";

import { cn } from "@/lib/utils";

export type ExpertProfile = {
  id: string;
  name: string;
  initials: string;
  role: string;
  risk: "high" | "med" | "low";
  daysRemaining?: number;
};

export type ModuleHeat = {
  path: string;
  risk: "high" | "med" | "low" | "none";
};

const RISK_BADGE: Record<ExpertProfile["risk"], string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  med: "bg-amber/15 text-amber border-amber/30",
  low: "bg-proof/12 text-proof border-proof/25",
};

const RISK_SQUARE: Record<ModuleHeat["risk"], string> = {
  high: "bg-red-500",
  med: "bg-amber",
  low: "bg-proof/60",
  none: "bg-border",
};

export function ExpertSidebar({
  experts,
  selectedExpertId,
  onSelectExpert,
  moduleHeat,
  signals,
}: {
  experts: ExpertProfile[];
  selectedExpertId: string;
  onSelectExpert: (id: string) => void;
  moduleHeat: ModuleHeat[];
  signals: { label: string; tone: "high" | "med" | "low" }[];
}) {
  return (
    <aside className="space-y-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="section-label text-muted-foreground">Experts</p>
          <span className="text-[10px] text-muted-foreground">by risk score</span>
        </div>
        <div className="space-y-2">
          {experts.map((expert) => {
            const selected = expert.id === selectedExpertId;
            return (
              <button
                key={expert.id}
                type="button"
                onClick={() => onSelectExpert(expert.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                  selected
                    ? "border-amber/35 bg-amber/8 shadow-soft"
                    : "border-border/80 bg-receipt hover:border-amber/20",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-parchment text-xs font-bold text-ink">
                  {expert.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-ink">{expert.name}</p>
                    <span
                      className={cn(
                        "rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase",
                        RISK_BADGE[expert.risk],
                      )}
                    >
                      {expert.risk}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{expert.role}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="section-label mb-3 text-muted-foreground">Module heat</p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          {signals.map((signal) => (
            <div
              key={signal.label}
              className={cn(
                "rounded-lg border px-2.5 py-2 text-[10px] leading-snug",
                signal.tone === "high" && "border-red-200 bg-red-50 text-red-900",
                signal.tone === "med" && "border-amber/30 bg-amber/8 text-ink",
                signal.tone === "low" && "border-border bg-parchment/60 text-muted-foreground",
              )}
            >
              {signal.label}
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {moduleHeat.map((mod) => (
            <div
              key={mod.path}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-receipt px-3 py-2"
            >
              <span className="truncate font-mono text-xs text-ink">{mod.path}</span>
              <span className={cn("size-3 shrink-0 rounded-sm", RISK_SQUARE[mod.risk])} />
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
