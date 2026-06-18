"use client";

import Link from "next/link";
import { X, XCircle } from "lucide-react";

import { VideoClipPlayer } from "@/components/video-clip-player";
import { AnswerReceipt } from "@/components/ask/answer-receipt";
import { Button, buttonVariants } from "@/components/ui/button";
import { citationHref } from "@/components/ask/citation-utils";
import type { AskCitation } from "@/lib/api";
import { cn } from "@/lib/utils";

export function RefusalCard({ reason }: { reason: string }) {
  return (
    <AnswerReceipt>
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center gap-2 text-refusal-foreground">
          <XCircle className="size-5 shrink-0" />
          <h2 className="font-display text-xl">I don&apos;t have this</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Backstory refused to guess — honest refusal is always on.
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{reason}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/sources" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Connect sources
          </Link>
          <Link href="/interviews" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Record interview
          </Link>
        </div>
      </div>
    </AnswerReceipt>
  );
}

export function SourceInspector({
  citation,
  engagementId,
  onClose,
}: {
  citation: AskCitation | null;
  engagementId: string | undefined;
  onClose: () => void;
}) {
  if (!citation) return null;

  const href = citationHref(citation);
  const isInterview =
    citation.citation_type === "interview" && citation.locator?.interview_id && engagementId;

  return (
    <div className="rounded-xl border border-amber/25 bg-receipt p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-semibold text-ink">{citation.label}</p>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
            {citation.citation_type} receipt
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose} aria-label="Close">
          <X className="size-4" />
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {citation.snippet ? (
          <p className="rounded-lg border border-border/60 bg-parchment/60 p-3 text-sm leading-relaxed text-muted-foreground">
            {citation.snippet}
          </p>
        ) : null}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
          >
            Open source
          </a>
        ) : null}
        {isInterview ? (
          <VideoClipPlayer
            engagementId={engagementId}
            interviewId={String(citation.locator!.interview_id)}
            startSeconds={Number(citation.locator!.start_seconds ?? 0)}
            snippet={citation.snippet}
            label={citation.label}
          />
        ) : null}
      </div>
    </div>
  );
}
