"use client";

import { Code2, FileText, Mic, Ticket } from "lucide-react";

import {
  CITATION_ICON,
  citationHorizon,
  citationHref,
} from "@/components/ask/citation-utils";
import type { AskCitation } from "@/lib/api";
import { cn } from "@/lib/utils";

type EvidencePanelProps = {
  citations: AskCitation[];
  selectedId: string | null;
  onSelect: (citation: AskCitation) => void;
  isLoading?: boolean;
  status?: string | null;
};

function EvidenceSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-amber" />
        <h3 className="section-label text-muted-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function ReceiptRail({
  citations,
  selectedId,
  onSelect,
  isLoading,
  status,
}: EvidencePanelProps) {
  const codeCitations = citations.filter((c) =>
    ["code", "commit"].includes(c.citation_type),
  );
  const ticketCitations = citations.filter((c) => c.citation_type === "ticket");
  const interviewCitations = citations.filter((c) => c.citation_type === "interview");
  const docCitations = citations.filter((c) => c.citation_type === "doc");

  const renderItem = (citation: AskCitation, index: number) => {
    const key = citation.id ?? `${citation.label}-${index}`;
    const selected = selectedId === key;
    const Icon =
      CITATION_ICON[citation.citation_type as keyof typeof CITATION_ICON] ?? FileText;
    const href = citationHref(citation);
    const horizon = citationHorizon(citation.citation_type);

    return (
      <button
        key={key}
        type="button"
        onClick={() => onSelect(citation)}
        className={cn(
          "w-full rounded-lg border px-3 py-2.5 text-left transition-all",
          selected
            ? "border-amber/40 bg-amber/8 shadow-soft ring-1 ring-amber/15"
            : "border-border/80 bg-receipt hover:border-amber/25 hover:bg-parchment/50",
        )}
      >
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 size-3.5 shrink-0 text-amber" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-semibold leading-snug text-ink">{citation.label}</p>
            {citation.snippet ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {citation.snippet}
              </p>
            ) : null}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {horizon === "leaving" ? (
                <span className="stamp-badge stamp-badge--proof text-[9px]">Interview</span>
              ) : null}
              {href ? (
                <span className="text-[10px] text-muted-foreground">↗ open</span>
              ) : null}
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <aside className="flex flex-col gap-3">
      <div className="rounded-xl border border-border/80 bg-receipt p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-label text-amber">Evidence</h2>
          <span className="flex size-6 items-center justify-center rounded-full bg-amber text-[11px] font-bold text-ink">
            {citations.length}
          </span>
        </div>
        {isLoading ? (
          <p className="mt-2 text-xs text-amber animate-pulse">{status ?? "Searching…"}</p>
        ) : null}
      </div>

      {citations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-parchment/50 px-4 py-10 text-center text-sm text-muted-foreground">
          {isLoading ? "Gathering evidence…" : "Receipts appear with your answer."}
        </div>
      ) : (
        <div className="space-y-4">
          {codeCitations.length > 0 ? (
            <EvidenceSection title="Code" icon={Code2}>
              <div className="space-y-2">{codeCitations.map(renderItem)}</div>
            </EvidenceSection>
          ) : null}
          {ticketCitations.length > 0 ? (
            <EvidenceSection title="Ticket" icon={Ticket}>
              <div className="space-y-2">{ticketCitations.map(renderItem)}</div>
            </EvidenceSection>
          ) : null}
          {interviewCitations.length > 0 ? (
            <EvidenceSection title="Interview" icon={Mic}>
              <div className="space-y-2">{interviewCitations.map(renderItem)}</div>
            </EvidenceSection>
          ) : null}
          {docCitations.length > 0 ? (
            <EvidenceSection title="Document" icon={FileText}>
              <div className="space-y-2">{docCitations.map(renderItem)}</div>
            </EvidenceSection>
          ) : null}
        </div>
      )}

      {citations.length > 0 ? (
        <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">
          No source, no claim. Every sentence above traces to one of these artifacts.
        </p>
      ) : null}
    </aside>
  );
}
