"use client";

import { useAuth } from "@clerk/nextjs";
import {
  Code2,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Ticket,
  XCircle,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { useEngagement } from "@/components/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { streamAsk, type AskCitation, type AskDoneEvent } from "@/lib/api";
import { cn } from "@/lib/utils";

const STARTER_QUESTIONS = [
  "Why does the payroll job fail on months with 31 days?",
  "Who last changed the month-end batch retry logic?",
  "What tickets mention the banking API workaround?",
];

const CITATION_ICON = {
  code: Code2,
  ticket: Ticket,
  doc: FileText,
  commit: Code2,
  text: FileText,
} as const;

function CitationChip({ citation }: { citation: AskCitation }) {
  const Icon = CITATION_ICON[citation.citation_type as keyof typeof CITATION_ICON] ?? FileText;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="font-medium leading-snug">{citation.label}</p>
        {citation.snippet ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{citation.snippet}</p>
        ) : null}
      </div>
    </div>
  );
}

function RefusalCard({ reason }: { reason: string }) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <XCircle className="size-5" />
          <CardTitle className="text-base">I don&apos;t have this</CardTitle>
        </div>
        <CardDescription>
          Backstory refused to guess — honest refusal is always on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{reason}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Try connecting more sources, re-syncing indexed content, or rephrasing your question.
        </p>
      </CardContent>
    </Card>
  );
}

export function AskPageClient() {
  const { getToken } = useAuth();
  const { activeEngagement } = useEngagement();
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [citations, setCitations] = useState<AskCitation[]>([]);
  const [refusalReason, setRefusalReason] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const engagementId = activeEngagement?.id;

  const resetAnswer = () => {
    setStatus(null);
    setAnswerText("");
    setCitations([]);
    setRefusalReason(null);
    setError(null);
  };

  const handleAsk = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || !engagementId || isAsking) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    resetAnswer();
    setIsAsking(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in — refresh the page and try again.");

      const seenCitationKeys = new Set<string>();

      await streamAsk({
        token,
        engagementId,
        question: trimmed,
        signal: controller.signal,
        onStatus: setStatus,
        onToken: (tokenText) => setAnswerText((prev) => prev + tokenText),
        onCitation: (citation) => {
          const key = `${citation.label}-${citation.passage_id ?? citation.id}`;
          if (seenCitationKeys.has(key)) return;
          seenCitationKeys.add(key);
          setCitations((prev) => [...prev, citation]);
        },
        onRefusal: (reason) => setRefusalReason(reason),
        onError: (message) => setError(message),
        onDone: (event: AskDoneEvent) => {
          if (event.refused) {
            setRefusalReason((prev) => prev ?? "No grounded evidence found.");
            setAnswerText("");
          } else if (event.answer_text) {
            setAnswerText(event.answer_text);
          }
          if (event.citations?.length) {
            setCitations(event.citations);
          }
        },
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsAsking(false);
      setStatus(null);
    }
  }, [question, engagementId, isAsking, getToken]);

  const showResults =
    isAsking || Boolean(answerText || refusalReason || error || citations.length > 0);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Ask"
        description="Plain-language questions with Answer Receipts — every claim backed by proof."
      />

      {!engagementId ? (
        <p className="text-sm text-muted-foreground">Select an engagement to ask questions.</p>
      ) : null}

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-1 shadow-card">
        <div className="rounded-xl bg-muted/40 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <span className="text-sm font-medium">Memory query</span>
            {isAsking ? (
              <Badge variant="secondary" className="ml-auto gap-1 text-xs">
                <Loader2 className="size-3 animate-spin" />
                {status ?? "Thinking…"}
              </Badge>
            ) : null}
          </div>
          <Textarea
            className={cn(
              "min-h-[120px] resize-none border-0 bg-transparent text-base shadow-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground/70",
            )}
            placeholder="Why does the payroll job fail on months with 31 days?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isAsking || !engagementId}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleAsk();
              }
            }}
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              ⌘/Ctrl + Enter to send · answers stream from indexed sources
            </p>
            <Button
              size="sm"
              onClick={() => void handleAsk()}
              disabled={isAsking || !engagementId || question.trim().length < 3}
            >
              {isAsking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Ask
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Starter questions
        </p>
        <div className="flex flex-wrap gap-2">
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestion(q)}
              disabled={isAsking}
              className={cn(
                "rounded-full border border-border bg-background px-3 py-1.5 text-left text-sm",
                "transition-colors hover:border-primary/40 hover:bg-accent",
                question === q && "border-primary/50 bg-accent",
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {showResults ? (
        <div className="mt-10 space-y-6">
          {error ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-destructive">Could not generate answer</CardTitle>
                <CardDescription>
                  Retrieval may have worked, but the LLM step failed. Fix the issue below and retry.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-destructive">{error}</CardContent>
            </Card>
          ) : null}

          {refusalReason ? <RefusalCard reason={refusalReason} /> : null}

          {answerText && !refusalReason ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Answer</CardTitle>
                <CardDescription>Claims below are tied to retrieved sources.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{answerText}</p>
              </CardContent>
            </Card>
          ) : null}

          {citations.length > 0 ? (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {answerText || refusalReason ? "Receipts" : "Retrieved evidence (generation pending or failed)"}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {citations.map((c, i) => (
                  <CitationChip key={c.id ?? `${c.label}-${i}`} citation={c} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
