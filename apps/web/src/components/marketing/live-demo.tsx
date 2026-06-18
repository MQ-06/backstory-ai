"use client";

import { FileCode2, Ticket, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CitationChip } from "@/components/ask/citation-chip";
import { AnswerReceipt, ReceiptFooter } from "@/components/ask/answer-receipt";
import { cn } from "@/lib/utils";

type Citation = {
  id: string;
  icon: typeof FileCode2;
  label: string;
  variant: "code" | "ticket" | "interview";
  snippet: string;
};

type Scenario = {
  id: string;
  label: string;
  question: string;
  kind: "answer" | "refusal";
  answer: string;
  citations: Citation[];
  refusalHint?: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "month-end",
    label: "Month-end failure",
    question: "Why does the month-end job fail on 31-day months?",
    kind: "answer",
    answer:
      "The batch uses a hard-coded days=30 assumption. Finance added a workaround in 2019; the ticket explains the regulatory reason.",
    citations: [
      {
        id: "code",
        icon: FileCode2,
        label: "payroll_calc.py:142",
        variant: "code",
        snippet: "BATCH_DAYS = 30  # FIXME: breaks on 31-day months",
      },
      {
        id: "ticket",
        icon: Ticket,
        label: "JIRA-4821",
        variant: "ticket",
        snippet: "Regulatory reporting requires calendar-month boundaries; hard-coded 30 rejected in UAT.",
      },
      {
        id: "video",
        icon: Video,
        label: "Interview @ 04:12",
        variant: "interview",
        snippet: "Expert: \"We never fixed it — finance runs a manual patch every January and March.\"",
      },
    ],
  },
  {
    id: "refusal",
    label: "Honest refusal",
    question: "What was the original COBOL module name for estate tax?",
    kind: "refusal",
    answer: "I don't have this",
    refusalHint:
      "No indexed commit, ticket, doc, or interview mentions an estate-tax COBOL module for this engagement.",
    citations: [],
  },
  {
    id: "override",
    label: "Ticket + code",
    question: "Who approved the payroll override flag in production?",
    kind: "answer",
    answer:
      "The OVERRIDE_PAYROLL flag shipped in PR #892; JIRA-5102 records CFO sign-off before go-live.",
    citations: [
      {
        id: "code2",
        icon: FileCode2,
        label: "config/payroll.yml:8",
        variant: "code",
        snippet: "OVERRIDE_PAYROLL: true  # emergency path — see JIRA-5102",
      },
      {
        id: "ticket2",
        icon: Ticket,
        label: "JIRA-5102",
        variant: "ticket",
        snippet: "Approved by CFO 2018-11-02. Must expire after migration phase 2.",
      },
    ],
  },
];

function Typewriter({ text, active }: { text: string; active: boolean }) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (!active) {
      setShown(text);
      return;
    }

    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 18);

    return () => window.clearInterval(id);
  }, [text, active]);

  return (
    <span>
      {shown}
      {active && shown.length < text.length ? (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-amber align-middle" />
      ) : null}
    </span>
  );
}

export function LiveDemo() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [phase, setPhase] = useState<"idle" | "thinking" | "done">("done");

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const activeCitation = scenario.citations.find((c) => c.id === selectedCitation);

  const runScenario = useCallback((id: string) => {
    setScenarioId(id);
    setSelectedCitation(null);
    setTyping(true);
    setPhase("thinking");

    window.setTimeout(() => setPhase("done"), 650);
    window.setTimeout(() => setTyping(false), 900);
  }, []);

  return (
    <div className="animate-float-gentle relative mx-auto max-w-md lg:max-w-none">
      <div className="marketing-receipt-preview relative overflow-hidden rounded-2xl">
        {/* Window chrome */}
        <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-parchment/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[#e8a598]" />
              <span className="size-2.5 rounded-full bg-[#e8c87a]" />
              <span className="size-2.5 rounded-full bg-[#a8c898]" />
            </div>
            <span className="ml-1 font-mono text-[10px] text-muted-foreground">Ask · Acme Payroll</span>
          </div>
          <span className="font-display text-[11px] tracking-wide text-amber">RECEIPT</span>
        </div>

        <div className="space-y-4 bg-receipt p-5">
          {/* Scenario pills */}
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => runScenario(s.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                  scenarioId === s.id
                    ? "border-amber/50 bg-amber/15 text-ink"
                    : "border-border bg-parchment/50 text-muted-foreground hover:border-amber/30 hover:text-ink",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Question */}
          <div className="evidence-tape rounded-lg px-3.5 py-3 text-sm text-ink">
            <Typewriter text={scenario.question} active={typing} />
          </div>

          {/* Answer area */}
          <div
            className={cn(
              "transition-opacity duration-500",
              phase === "thinking" && "opacity-60",
            )}
          >
            {phase === "thinking" ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 rounded-full bg-amber animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
                Searching memory…
              </div>
            ) : scenario.kind === "refusal" ? (
              <div className="space-y-2 rounded-lg border border-dashed border-border bg-parchment/50 p-4">
                <p className="font-display text-base text-ink">{scenario.answer}</p>
                {scenario.refusalHint ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">{scenario.refusalHint}</p>
                ) : null}
              </div>
            ) : (
              <AnswerReceipt perforated={false} className="shadow-none border-0">
                <div className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-proof" />
                    <p className="text-sm leading-relaxed text-ink">{scenario.answer}</p>
                  </div>
                  {scenario.citations.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {scenario.citations.map((c) => (
                        <CitationChip
                          key={c.id}
                          label={c.label}
                          variant={c.variant}
                          selected={selectedCitation === c.id}
                          onClick={() =>
                            setSelectedCitation((prev) => (prev === c.id ? null : c.id))
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                {scenario.citations.length > 0 ? (
                  <ReceiptFooter className="px-4 py-3">
                    <p className="section-label text-muted-foreground">Receipts</p>
                  </ReceiptFooter>
                ) : null}
              </AnswerReceipt>
            )}
          </div>

          {/* Citation snippet preview */}
          <div
            className={cn(
              "overflow-hidden rounded-lg border border-amber/20 bg-amber/5 transition-all duration-300",
              activeCitation ? "max-h-24 opacity-100 p-3" : "max-h-0 opacity-0 p-0 border-transparent",
            )}
          >
            {activeCitation ? (
              <p className="font-mono text-[11px] leading-relaxed text-ink/80">{activeCitation.snippet}</p>
            ) : null}
          </div>

          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {scenario.kind === "refusal" ? "Honest refusal · no guesswork" : "Answer Receipt · click a citation"}
          </p>
        </div>
      </div>
    </div>
  );
}
