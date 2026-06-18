"use client";

const ITEMS = [
  "Answer Receipts",
  "Honest refusal",
  "Tenant-scoped memory",
  "Code-linked citations",
  "Expert interviews",
  "Archaeology Brief",
] as const;

export function TickerBand() {
  return (
    <div className="marketing-ticker group/ticker overflow-hidden py-3.5">
      <div className="marketing-ticker-inner flex w-max gap-12 whitespace-nowrap px-6 text-xs font-bold uppercase tracking-[0.22em] group-hover/ticker:[animation-play-state:paused]">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-12">
            {item}
            <span className="size-1.5 rounded-full bg-amber" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
