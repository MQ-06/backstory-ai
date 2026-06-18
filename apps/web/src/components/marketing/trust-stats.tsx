"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import { useInView } from "@/hooks/use-in-view";

const STATS = [
  { key: "zero", display: "0", label: "hallucinated claims shipped", animate: false as const },
  { key: "hundred", display: 100, suffix: "%", label: "citations on every answer", animate: true as const },
  { key: "one", display: "1", label: "tenant boundary per engagement", animate: false as const },
  { key: "inf", display: "∞", label: "institutional memory preserved", animate: false as const },
];

function AnimatedStat({ target, suffix = "" }: { target: number; suffix?: string }) {
  const { ref, inView } = useInView(0.3);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setN(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <p ref={ref as RefObject<HTMLParagraphElement>} className="font-display text-4xl text-amber">
      {n}
      {suffix}
    </p>
  );
}

export function TrustStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {STATS.map((stat) => (
        <div
          key={stat.key}
          className="marketing-feature-card rounded-xl p-6 text-center transition-transform duration-300 hover:scale-[1.02]"
        >
          {stat.animate ? (
            <AnimatedStat target={stat.display as number} suffix={stat.suffix} />
          ) : (
            <p className="font-display text-4xl text-amber">{stat.display}</p>
          )}
          <p className="mt-2 text-xs leading-snug text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
