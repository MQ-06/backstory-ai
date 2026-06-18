"use client";

import Link from "next/link";
import { X, XCircle } from "lucide-react";

import { VideoClipPlayer } from "@/components/video-clip-player";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { citationHref } from "@/components/ask/citation-utils";
import type { AskCitation } from "@/lib/api";
import { cn } from "@/lib/utils";

export function RefusalCard({ reason }: { reason: string }) {
  return (
    <Card className="border-refusal-foreground/20 bg-refusal shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-refusal-foreground">
          <XCircle className="size-5" />
          <CardTitle className="text-base font-semibold tracking-tight">I don&apos;t have this</CardTitle>
        </div>
        <CardDescription>
          Backstory refused to guess — honest refusal is always on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-base leading-relaxed text-muted-foreground">{reason}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/sources" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Connect sources
          </Link>
          <Link href="/interviews" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Record interview
          </Link>
        </div>
      </CardContent>
    </Card>
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
    <Card className="border-evidence/30 shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">{citation.label}</CardTitle>
          <CardDescription className="capitalize">{citation.citation_type} receipt</CardDescription>
        </div>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose} aria-label="Close">
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {citation.snippet ? (
          <p className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
