"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CitationChip } from "@/components/ask/citation-chip";
import { useEngagement } from "@/components/providers";
import { WorkspaceHeader } from "@/components/workspace-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchLibrary, type LibraryArtifact } from "@/lib/api";
import { cn } from "@/lib/utils";

type ArtifactKind = LibraryArtifact["kind"] | "all";

export function LibraryPageClient() {
  const { getToken } = useAuth();
  const { activeEngagement } = useEngagement();
  const engagementId = activeEngagement?.id;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ArtifactKind>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["library", engagementId, filter, query],
    enabled: Boolean(engagementId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !engagementId) return { artifacts: [], summary: { total: 0, code: 0, ticket: 0, interview: 0, doc: 0 } };
      return fetchLibrary(token, engagementId, {
        kind: filter === "all" ? undefined : filter,
        q: query.trim() || undefined,
      });
    },
  });

  const artifacts = data?.artifacts ?? [];
  const summary = data?.summary;

  const filters = useMemo(
    () =>
      [
        { id: "all" as const, label: "All", count: summary?.total ?? 0 },
        { id: "code" as const, label: "Code", count: summary?.code ?? 0 },
        { id: "ticket" as const, label: "Tickets", count: summary?.ticket ?? 0 },
        { id: "interview" as const, label: "Interviews", count: summary?.interview ?? 0 },
        { id: "doc" as const, label: "Docs", count: summary?.doc ?? 0 },
      ].filter((f) => f.id === "all" || f.count > 0 || filter === f.id),
    [summary, filter],
  );

  const selected =
    artifacts.find((a) => a.id === selectedId) ?? artifacts[0] ?? null;

  const askHref = selected
    ? `/ask?q=${encodeURIComponent(`What should I know about ${selected.name}?`)}`
    : "/ask";

  const coverage = summary
    ? [
        { label: "Code", count: summary.code, color: "bg-amber" },
        { label: "Tickets", count: summary.ticket, color: "bg-blue-400" },
        { label: "Interviews", count: summary.interview, color: "bg-proof" },
        { label: "Docs", count: summary.doc, color: "bg-muted-foreground/40" },
      ]
    : [];

  const maxCoverage = Math.max(summary?.total ?? 1, 1);

  return (
    <div>
      <WorkspaceHeader
        eyebrow="Memory"
        title="Library"
        description="Browse indexed artifacts — code, tickets, interviews, and documents linked across horizons."
      />

      {!engagementId ? (
        <div className="rounded-xl border border-dashed border-amber/35 bg-amber/5 px-4 py-3 text-sm text-muted-foreground">
          Select an engagement to browse indexed artifacts.
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="bg-receipt pl-9"
                placeholder="Search artifacts…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
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

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading library…</p>
          ) : error ? (
            <p className="text-sm text-destructive">Could not load library.</p>
          ) : artifacts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-parchment/50 p-8 text-center text-sm text-muted-foreground">
              No artifacts indexed yet — connect sources from the Sources page, then return here.
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <section className="min-w-0">
                <p className="section-label mb-3 text-muted-foreground">Artifacts</p>
                <div className="overflow-hidden rounded-xl border border-border/80 bg-receipt shadow-soft">
                  {artifacts.map((artifact) => {
                    const active = artifact.id === (selected?.id ?? selectedId);
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
                        {artifact.links.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {artifact.links.map((link) => (
                              <CitationChip
                                key={link.label}
                                label={link.label}
                                variant={link.variant === "doc" ? "code" : link.variant}
                                as="span"
                              />
                            ))}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>

              <aside className="space-y-4">
                {selected ? (
                  <div className="rounded-xl border border-border/80 bg-receipt p-4 shadow-soft">
                    <p className="font-mono text-sm font-semibold text-ink">{selected.name}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                      {(
                        [
                          ["Last modified", selected.last_modified ?? "—"],
                          ["Authors", selected.authors ?? "—"],
                          ["Chunks", String(selected.chunk_count)],
                          ["Links", String(selected.link_count)],
                          ["Kind", selected.kind],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="mt-0.5 font-medium text-ink">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <Link
                      href={askHref}
                      className={cn(buttonVariants(), "mt-5 w-full bg-ink text-receipt hover:bg-ink/90")}
                    >
                      Ask about this file
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                ) : null}

                {coverage.length > 0 ? (
                  <div className="rounded-xl border border-border/80 bg-receipt p-4 shadow-soft">
                    <p className="section-label mb-4 text-muted-foreground">Coverage by type</p>
                    <div className="space-y-3">
                      {coverage.map((row) => (
                        <div key={row.label}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-muted-foreground">{row.label}</span>
                            <span className="font-mono font-medium text-ink">{row.count}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-border">
                            <div
                              className={cn("h-full rounded-full transition-all", row.color)}
                              style={{ width: `${Math.round((row.count / maxCoverage) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}
