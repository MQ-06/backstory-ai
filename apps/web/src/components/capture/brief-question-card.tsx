"use client";

import { FileText } from "lucide-react";

import { CitationChip } from "@/components/ask/citation-chip";
import { cn } from "@/lib/utils";

type EvidenceChip = {
  label: string;
  variant: "code" | "ticket" | "interview";
};

export function BriefQuestionCard({
  rank,
  text,
  expanded,
  onToggle,
  evidenceChips = [],
  contextNote,
}: {
  rank: number;
  text: string;
  expanded: boolean;
  onToggle: () => void;
  evidenceChips?: EvidenceChip[];
  contextNote?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full rounded-xl border text-left transition-all",
        expanded
          ? "border-amber/40 bg-receipt shadow-soft"
          : "border-border/80 bg-receipt/60 hover:border-amber/25 hover:bg-receipt",
      )}
    >
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            expanded ? "bg-amber text-ink" : "bg-muted text-muted-foreground",
          )}
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base leading-snug text-ink sm:text-lg">{text}</p>

          {expanded ? (
            <div className="mt-4 border-t border-dashed border-border/70 pt-4">
              <p className="section-label mb-2 text-muted-foreground">Evidence</p>
              {evidenceChips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {evidenceChips.map((chip) => (
                    <CitationChip
                      key={chip.label}
                      label={chip.label}
                      variant={chip.variant}
                      as="span"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Signals from indexed sources</p>
              )}
              {contextNote ? (
                <p className="mt-3 text-sm italic leading-relaxed text-muted-foreground">
                  {contextNote}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-3" />
              <span>Tap to expand evidence</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
