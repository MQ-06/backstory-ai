"use client";

import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CitationChip } from "@/components/ask/citation-chip";
import { WorkspaceHeader } from "@/components/workspace-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ArtifactKind = "code" | "ticket" | "interview";

type Artifact = {
  id: string;
  name: string;
  kind: ArtifactKind;
  meta: string;
  links: { label: string; variant: "code" | "ticket" | "interview" }[];
  detail: {
    lastModified: string;
    authors: string;
    lines: string;
    patchCount: string;
    busFactor: string;
    totalLinks: number;
  };
  horizons: { label: string; density: "high" | "med" | "low" }[];
};

const DEMO_ARTIFACTS: Artifact[] = [
  {
    id: "payroll-calc",
    name: "payroll_calc.py",
    kind: "code",
    meta: "Code · 4,812 chars · 14 links",
    links: [
      { label: "JIRA-4821", variant: "ticket" },
      { label: "Interview @ 04:12", variant: "interview" },
      { label: "batch_runner.py:89", variant: "code" },
    ],
    detail: {
      lastModified: "2019-03-14",
      authors: "Ahmed S., Priya K.",
      lines: "312",
      patchCount: "14",
      busFactor: "1",
      totalLinks: 14,
    },
    horizons: [
      { label: "JIRA-4821", density: "high" },
      { label: "Interview @ 04:12", density: "med" },
      { label: "batch_runner.py", density: "high" },
    ],
  },
  {
    id: "jira-4821",
    name: "JIRA-4821",
    kind: "ticket",
    meta: "Ticket · closed 2019 · 6 links",
    links: [
      { label: "payroll_calc.py:142", variant: "code" },
      { label: "RECON-7", variant: "ticket" },
    ],
    detail: {
      lastModified: "2019-11-02",
      authors: "Finance UAT",
      lines: "—",
      patchCount: "—",
      busFactor: "—",
      totalLinks: 6,
    },
    horizons: [{ label: "payroll_calc.py:142", density: "high" }],
  },
  {
    id: "interview-ahmed",
    name: "Interview — Ahmed S.",
    kind: "interview",
    meta: "Interview · 42 min · 94 segments",
    links: [
      { label: "payroll_calc.py:142", variant: "code" },
      { label: "@ 04:12", variant: "interview" },
    ],
    detail: {
      lastModified: "2026-03-01",
      authors: "Ahmed S.",
      lines: "—",
      patchCount: "—",
      busFactor: "—",
      totalLinks: 8,
    },
    horizons: [{ label: "Month-end batch", density: "med" }],
  },
];

const FILTERS: { id: "all" | ArtifactKind; label: string; count: number }[] = [
  { id: "all", label: "All", count: 3314 },
  { id: "code", label: "Code", count: 2341 },
  { id: "ticket", label: "Tickets", count: 879 },
  { id: "interview", label: "Interviews", count: 94 },
];

const COVERAGE = [
  { label: "Code", pct: 78, color: "bg-amber" },
  { label: "Tickets", pct: 62, color: "bg-blue-400" },
  { label: "Interviews", pct: 34, color: "bg-proof" },
  { label: "Docs", pct: 41, color: "bg-muted-foreground/40" },
];

export function LibraryPageClient() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | ArtifactKind>("all");
  const [selectedId, setSelectedId] = useState(DEMO_ARTIFACTS[0].id);

  const filtered = useMemo(() => {
    return DEMO_ARTIFACTS.filter((a) => {
      if (filter !== "all" && a.kind !== filter) return false;
      if (!query.trim()) return true;
      return a.name.toLowerCase().includes(query.toLowerCase());
    });
  }, [filter, query]);

  const selected = DEMO_ARTIFACTS.find((a) => a.id === selectedId) ?? DEMO_ARTIFACTS[0];

  return (
    <div>
      <WorkspaceHeader
        eyebrow="Memory"
        title="Library"
        description="Browse indexed artifacts — code, tickets, interviews, and documents linked across horizons."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="bg-receipt pl-9"
            placeholder="Search artifacts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-parchment px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                filter === f.id
                  ? "border-ink bg-ink text-receipt"
                  : "border-border bg-receipt text-muted-foreground hover:border-amber/30",
              )}
            >
              {f.label} ({f.count.toLocaleString()})
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="min-w-0">
          <p className="section-label mb-3 text-muted-foreground">Artifacts</p>
          <div className="overflow-hidden rounded-xl border border-border/80 bg-receipt shadow-soft">
            {filtered.map((artifact) => {
              const active = artifact.id === selectedId;
              return (
                <button
                  key={artifact.id}
                  type="button"
                  onClick={() => setSelectedId(artifact.id)}
                  className={cn(
                    "relative flex w-full flex-col gap-2 border-b border-border/60 px-4 py-4 text-left transition-colors last:border-b-0",
                    active ? "bg-amber/6" : "hover:bg-parchment/50",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-y-0 left-0 w-1 bg-amber" aria-hidden />
                  ) : null}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{artifact.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{artifact.meta}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {artifact.links.map((link) => (
                      <CitationChip key={link.label} label={link.label} variant={link.variant} as="span" />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Demo data — full library populates after source ingestion.
          </p>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-receipt p-4 shadow-soft">
            <p className="font-mono text-sm font-semibold text-ink">{selected.name}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              {(
                [
                  ["Last modified", selected.detail.lastModified],
                  ["Authors", selected.detail.authors],
                  ["Lines", selected.detail.lines],
                  ["Patch count", selected.detail.patchCount],
                  ["Bus factor", selected.detail.busFactor],
                  ["Total links", String(selected.detail.totalLinks)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 border-t border-dashed border-border/70 pt-4">
              <p className="section-label mb-2 text-muted-foreground">Linked across horizons</p>
              <div className="space-y-2">
                {selected.horizons.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-2.5 py-2 text-xs"
                  >
                    <span className="truncate font-mono">{h.label}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                        h.density === "high" && "bg-proof/12 text-proof",
                        h.density === "med" && "bg-amber/12 text-amber",
                        h.density === "low" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {h.density}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/ask"
              className={cn(buttonVariants(), "mt-5 w-full bg-ink text-receipt hover:bg-ink/90")}
            >
              Ask about this file
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-xl border border-border/80 bg-receipt p-4 shadow-soft">
            <p className="section-label mb-4 text-muted-foreground">Coverage by horizon</p>
            <div className="space-y-3">
              {COVERAGE.map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-mono font-medium text-ink">{row.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className={cn("h-full rounded-full transition-all", row.color)}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
