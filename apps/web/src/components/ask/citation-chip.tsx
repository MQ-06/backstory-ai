"use client";

import { cn } from "@/lib/utils";

import type { AskCitation } from "@/lib/api";

export function citationChipVariant(
  type: AskCitation["citation_type"],
): "code" | "ticket" | "interview" {
  if (type === "interview") return "interview";
  if (type === "ticket") return "ticket";
  return "code";
}

type CitationChipProps = {
  label: string;
  variant?: "code" | "ticket" | "interview";
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  as?: "button" | "span";
};

export function CitationChip({
  label,
  variant = "code",
  selected,
  onClick,
  className,
  as = "button",
}: CitationChipProps) {
  const classes = cn(
    "citation-chip",
    variant === "code" && "citation-chip--code",
    variant === "ticket" && "citation-chip--ticket",
    variant === "interview" && "citation-chip--interview",
    selected && "citation-chip--selected",
    className,
  );

  if (as === "span" || !onClick) {
    return <span className={classes}>{label}</span>;
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {label}
    </button>
  );
}

export function CitationChipRow({
  citations,
  selectedId,
  onSelect,
  getKey,
}: {
  citations: AskCitation[];
  selectedId?: string | null;
  onSelect?: (citation: AskCitation) => void;
  getKey: (citation: AskCitation, index: number) => string;
}) {
  if (citations.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {citations.map((citation, index) => {
        const key = getKey(citation, index);
        return (
          <CitationChip
            key={key}
            label={citation.label}
            variant={citationChipVariant(citation.citation_type)}
            selected={selectedId === key}
            onClick={onSelect ? () => onSelect(citation) : undefined}
            as={onSelect ? "button" : "span"}
          />
        );
      })}
    </div>
  );
}
