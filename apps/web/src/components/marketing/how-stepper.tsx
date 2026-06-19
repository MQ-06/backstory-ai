"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: "01",
    title: "Connect sources",
    text: "Git, tickets, docs — indexed per engagement. One tenant boundary, zero cross-leakage.",
    detail: "OAuth to GitHub · upload runbooks. Each source shows ingest status in real time.",
  },
  {
    step: "02",
    title: "Capture experts",
    text: "Archaeology Brief surfaces risk signals; Interview Studio records time-coded video.",
    detail: "Brief questions tie to code paths and tickets before the expert ever sits down.",
  },
  {
    step: "03",
    title: "Ask with receipts",
    text: "Plain-language questions → cited answers or honest refusal. Every claim clickable.",
    detail: "Dual grounding gates strip unsupported claims before anything reaches the UI.",
  },
] as const;

export function HowStepper() {
  const [active, setActive] = useState(0);
  const current = STEPS[active];

  return (
    <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
      <div className="flex flex-col gap-2">
        {STEPS.map((item, index) => {
          const isActive = index === active;
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "group flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300",
                isActive
                  ? "border-amber/40 bg-amber/8 shadow-soft"
                  : "border-transparent bg-transparent hover:border-border hover:bg-parchment/60",
              )}
            >
              <span
                className={cn(
                  "font-mono text-sm font-bold transition-colors",
                  isActive ? "text-amber" : "text-muted-foreground",
                )}
              >
                {item.step}
              </span>
              <div>
                <h3 className="font-display text-lg tracking-tight">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div
        key={active}
        className="marketing-feature-card rounded-2xl p-8 animate-fade-up"
      >
        <p className="section-label text-amber">Step {current.step}</p>
        <h3 className="mt-3 font-display text-2xl tracking-tight">{current.title}</h3>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{current.detail}</p>
        <div className="mt-8 flex gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i === active ? "bg-amber" : "bg-border hover:bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
