"use client";

import { ExternalLink, FileText } from "lucide-react";

import { HorizonBadge } from "@/components/atlas/horizon-badge";
import {
  CITATION_ICON,
  citationHorizon,
  citationHref,
} from "@/components/ask/citation-utils";
import type { AskCitation } from "@/lib/api";
import { cn } from "@/lib/utils";

type ReceiptRailProps = {
  citations: AskCitation[];
  selectedId: string | null;
  onSelect: (citation: AskCitation) => void;
  isLoading?: boolean;
  status?: string | null;
};

export function ReceiptRail({
  citations,
  selectedId,
  onSelect,
  isLoading,
  status,
}: ReceiptRailProps) {
  return (
    <aside className="flex flex-col gap-3">
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold tracking-tight">Receipts</h2>
          {isLoading ? (
            <span className="text-xs text-primary animate-pulse">{status ?? "Searching…"}</span>
          ) : (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-primary">
              {citations.length}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Proof streams in as memory is searched — click to inspect.
        </p>
      </div>

      {citations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 px-4 py-10 text-center text-sm text-muted-foreground">
          {isLoading ? "Gathering evidence…" : "Receipts appear with your answer."}
        </div>
      ) : (
        <ul className="space-y-2">
          {citations.map((citation, index) => {
            const Icon =
              CITATION_ICON[citation.citation_type as keyof typeof CITATION_ICON] ?? FileText;
            const key = citation.id ?? `${citation.label}-${index}`;
            const selected = selectedId === key;
            const horizon = citationHorizon(citation.citation_type);
            const href = citationHref(citation);

            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelect(citation)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                    selected
                      ? "border-primary/45 bg-primary/8 shadow-soft ring-1 ring-primary/15"
                      : "border-border/80 bg-card hover:border-primary/25 hover:bg-muted/30",
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium leading-snug">{citation.label}</span>
                      {href ? <ExternalLink className="size-3 text-muted-foreground" /> : null}
                    </div>
                    {horizon ? (
                      <div className="mt-1.5">
                        <HorizonBadge kind={horizon}>
                          {horizon === "leaving" ? "Interview" : "Archive"}
                        </HorizonBadge>
                      </div>
                    ) : null}
                    {citation.snippet ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {citation.snippet}
                      </p>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
