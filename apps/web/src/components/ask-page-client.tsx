"use client";

import { useAuth } from "@clerk/nextjs";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { RefusalCard, SourceInspector } from "@/components/ask/inspector-panel";
import { ReceiptRail } from "@/components/ask/receipt-rail";
import { WorkspaceHeader } from "@/components/workspace-header";
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

function citationKey(citation: AskCitation, index: number) {
  return citation.id ?? `${citation.label}-${citation.passage_id ?? index}`;
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
  const [selectedCitation, setSelectedCitation] = useState<AskCitation | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const engagementId = activeEngagement?.id;

  const resetAnswer = () => {
    setStatus(null);
    setAnswerText("");
    setCitations([]);
    setRefusalReason(null);
    setError(null);
    setSelectedCitation(null);
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

  const selectedId = selectedCitation
    ? citationKey(selectedCitation, citations.indexOf(selectedCitation))
    : null;

  return (
    <div>
      <WorkspaceHeader
        eyebrow="Institutional memory"
        title="Ask a question"
        description="Every answer ships with receipts — code lines, tickets, docs, or interview timestamps. No evidence, no claim."
      />

      {!engagementId ? (
        <div className="mb-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Select or create an engagement in the sidebar to query memory.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
            <div className="flex items-center justify-between border-b border-border/70 bg-muted/25 px-5 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span className="text-sm font-semibold">Memory query</span>
              </div>
              {isAsking ? (
                <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
                  <Loader2 className="size-3 animate-spin" />
                  {status ?? "Thinking…"}
                </Badge>
              ) : null}
            </div>
            <div className="p-5 sm:p-6">
              <Textarea
                className={cn(
                  "min-h-[120px] resize-none border-0 bg-transparent text-base leading-relaxed shadow-none",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-muted-foreground/60",
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
                <p className="text-xs text-muted-foreground">⌘/Ctrl + Enter to send</p>
                <Button
                  size="default"
                  className="gap-2 shadow-md shadow-primary/20"
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

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuestion(q)}
                  disabled={isAsking}
                  className={cn(
                    "max-w-full rounded-xl border border-border/80 bg-card px-3.5 py-2 text-left text-sm transition-all",
                    "hover:border-primary/35 hover:bg-primary/5 hover:shadow-soft",
                    question === q && "border-primary/45 bg-primary/8 ring-1 ring-primary/20",
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {showResults ? (
            <div className="space-y-5">
              {error ? (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-destructive">
                      Could not generate answer
                    </CardTitle>
                    <CardDescription>
                      Retrieval may have worked, but the LLM step failed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-destructive">{error}</CardContent>
                </Card>
              ) : null}

              {refusalReason ? <RefusalCard reason={refusalReason} /> : null}

              {answerText && !refusalReason ? (
                <Card className="shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold tracking-tight">Answer</CardTitle>
                    <CardDescription>Claims are tied to receipts on the right.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="max-w-prose whitespace-pre-wrap text-lg leading-relaxed">
                      {answerText}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {/* Mobile: inspector below answer */}
              <div className="lg:hidden">
                <SourceInspector
                  citation={selectedCitation}
                  engagementId={engagementId}
                  onClose={() => setSelectedCitation(null)}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-[4.5rem] space-y-3">
            <ReceiptRail
              citations={citations}
              selectedId={selectedId}
              onSelect={setSelectedCitation}
              isLoading={isAsking}
              status={status}
            />
            <SourceInspector
              citation={selectedCitation}
              engagementId={engagementId}
              onClose={() => setSelectedCitation(null)}
            />
          </div>
        </div>
      </div>

      {/* Mobile receipt list when results exist */}
      {showResults && citations.length > 0 ? (
        <div className="mt-6 xl:hidden">
          <ReceiptRail
            citations={citations}
            selectedId={selectedId}
            onSelect={setSelectedCitation}
            isLoading={isAsking}
            status={status}
          />
        </div>
      ) : null}
    </div>
  );
}
