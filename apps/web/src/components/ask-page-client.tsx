"use client";

import { useAuth } from "@clerk/nextjs";
import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AnswerReceipt, ReceiptFooter } from "@/components/ask/answer-receipt";
import { CitationChipRow } from "@/components/ask/citation-chip";
import { RefusalCard, SourceInspector } from "@/components/ask/inspector-panel";
import { ReceiptRail } from "@/components/ask/receipt-rail";
import { WorkspaceHeader } from "@/components/workspace-header";
import { useEngagement } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { streamAsk, type AskCitation, type AskDoneEvent } from "@/lib/api";
import { cn, formatErrorMessage } from "@/lib/utils";

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
  const searchParams = useSearchParams();
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [citations, setCitations] = useState<AskCitation[]>([]);
  const [refusalReason, setRefusalReason] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<AskCitation | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoAskedRef = useRef(false);

  const engagementId = activeEngagement?.id;

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuestion(q);
    autoAskedRef.current = false;
  }, [searchParams]);

  const resetAnswer = () => {
    setStatus(null);
    setAnswerText("");
    setCitations([]);
    setRefusalReason(null);
    setError(null);
    setSelectedCitation(null);
  };

  const handleAsk = useCallback(
    async (questionOverride?: string) => {
      const trimmed = (questionOverride ?? question).trim();
      if (!trimmed || !engagementId || isAsking) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      resetAnswer();
      setAskedQuestion(trimmed);
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
          onError: (message) => setError(formatErrorMessage(message, "Ask failed")),
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
        const message = formatErrorMessage(err, "Could not complete ask request");
        setError(message);
      } finally {
        setIsAsking(false);
        setStatus(null);
      }
    },
    [question, engagementId, isAsking, getToken],
  );

  useEffect(() => {
    const q = searchParams.get("q")?.trim();
    const auto = searchParams.get("auto") === "1";
    if (!auto || !q || !engagementId || isAsking || autoAskedRef.current) return;
    if (question.trim() !== q) return;
    autoAskedRef.current = true;
    void handleAsk(q);
  }, [searchParams, engagementId, question, isAsking, handleAsk]);

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
        <div className="mb-6 rounded-xl border border-dashed border-amber/35 bg-amber/5 px-4 py-3 text-sm text-muted-foreground">
          Select or create an engagement in the sidebar to query memory.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="min-w-0 space-y-5">
          {/* Query input */}
          <div className="overflow-hidden rounded-xl border border-border/80 bg-receipt shadow-soft">
            <div className="p-5 sm:p-6">
              <Textarea
                className={cn(
                  "min-h-[100px] resize-none border-0 bg-transparent font-display text-lg leading-relaxed shadow-none",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-muted-foreground/50",
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
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground">⌘/Ctrl + Enter to send</p>
                <div className="flex items-center gap-3">
                  {isAsking ? (
                    <span className="flex items-center gap-1.5 text-xs text-amber">
                      <Loader2 className="size-3 animate-spin" />
                      {status ?? "Searching…"}
                    </span>
                  ) : null}
                  <Button
                    size="default"
                    className="gap-2 bg-ink px-5 text-receipt hover:bg-ink/90"
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
          </div>

          {/* Starter questions */}
          <div>
            <p className="section-label mb-2.5 text-muted-foreground">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuestion(q)}
                  disabled={isAsking}
                  className={cn(
                    "max-w-full rounded-full border border-border/80 bg-receipt px-4 py-2 text-left text-sm transition-all",
                    "hover:border-amber/35 hover:bg-amber/5 hover:shadow-soft",
                    question === q && "border-amber/45 bg-amber/8 ring-1 ring-amber/20",
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {showResults ? (
            <div className="space-y-5">
              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                  <h2 className="font-display text-lg text-destructive">Could not generate answer</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Retrieval may have worked, but the LLM step failed.
                  </p>
                  <p className="mt-3 text-sm text-destructive">{error}</p>
                </div>
              ) : null}

              {refusalReason ? <RefusalCard reason={refusalReason} /> : null}

              {answerText && !refusalReason ? (
                <AnswerReceipt>
                  <div className="px-5 py-4 sm:px-6">
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-proof" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{askedQuestion}</p>
                        <p className="mt-4 max-w-prose whitespace-pre-wrap text-base leading-[1.75] text-ink">
                          {answerText}
                        </p>
                      </div>
                    </div>
                  </div>
                  {citations.length > 0 ? (
                    <ReceiptFooter>
                      <p className="section-label mb-3 text-muted-foreground">Receipts</p>
                      <CitationChipRow
                        citations={citations}
                        selectedId={selectedId}
                        onSelect={setSelectedCitation}
                        getKey={citationKey}
                      />
                    </ReceiptFooter>
                  ) : null}
                </AnswerReceipt>
              ) : null}

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
          <div className="sticky top-14 space-y-3">
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
