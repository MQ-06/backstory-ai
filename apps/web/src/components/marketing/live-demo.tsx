"use client";

import { FileCode2, Ticket, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Citation = {
  id: string;
  icon: typeof FileCode2;
  label: string;
  tone: "code" | "ticket" | "video";
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
        tone: "code",
        snippet: "BATCH_DAYS = 30  # FIXME: breaks on 31-day months",
      },
      {
        id: "ticket",
        icon: Ticket,
        label: "JIRA-4821",
        tone: "ticket",
        snippet: "Regulatory reporting requires calendar-month boundaries; hard-coded 30 rejected in UAT.",
      },
      {
        id: "video",
        icon: Video,
        label: "Interview @ 04:12",
        tone: "video",
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
        tone: "code",
        snippet: "OVERRIDE_PAYROLL: true  # emergency path — see JIRA-5102",
      },
      {
        id: "ticket2",
        icon: Ticket,
        label: "JIRA-5102",
        tone: "ticket",
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
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
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
      <div
        className="absolute -inset-10 rounded-[2.5rem] blur-3xl transition-opacity duration-500"
        style={{
          background:
            scenario.kind === "refusal"
              ? "radial-gradient(ellipse at center, oklch(0.12 0.006 132 / 40%), transparent 70%)"
              : "radial-gradient(ellipse at center, oklch(0.48 0.10 132 / 55%), oklch(0.08 0.004 132 / 25%), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="marketing-preview-dark relative overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[oklch(0.55_0.14_25)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.72_0.12_85)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.55_0.11_132)]" />
            </div>
            <span className="ml-1 font-mono text-[11px] text-white/50">Ask · Acme Payroll</span>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
              scenario.kind === "refusal"
                ? "bg-white/10 text-white/70"
                : "bg-primary/20 text-[oklch(0.78_0.1_132)]",
            )}
          >
            {scenario.kind === "refusal" ? "Refusal" : "Receipt"}
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => runScenario(s.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                  scenarioId === s.id
                    ? "border-primary/50 bg-primary/20 text-[oklch(0.85_0.08_132)]"
                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/80",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="min-h-[3.25rem] rounded-xl border border-white/8 bg-white/5 p-3.5 text-sm text-white/70">
            <Typewriter text={scenario.question} active={typing} />
          </div>

          <div
            className={cn(
              "space-y-3 rounded-xl border p-4 transition-all duration-500",
              scenario.kind === "refusal"
                ? "border-white/10 bg-white/5"
                : "border-primary/25 bg-black/30",
              phase === "thinking" && "opacity-60",
            )}
          >
            {phase === "thinking" ? (
              <div className="flex items-center gap-2 py-2 text-sm text-white/50">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 rounded-full bg-primary animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
                Searching memory…
              </div>
            ) : scenario.kind === "refusal" ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white/90">{scenario.answer}</p>
                {scenario.refusalHint ? (
                  <p className="text-xs leading-relaxed text-white/45">{scenario.refusalHint}</p>
                ) : null}
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-white/85">{scenario.answer}</p>
                {scenario.citations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {scenario.citations.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setSelectedCitation((prev) => (prev === c.id ? null : c.id))
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                          selectedCitation === c.id
                            ? "scale-[1.02] border-primary bg-primary/25 text-white shadow-lg shadow-primary/20"
                            : c.tone === "code"
                              ? "border-primary/40 bg-primary/15 text-[oklch(0.72_0.11_132)] hover:border-primary/60"
                              : c.tone === "ticket"
                                ? "border-white/15 bg-white/8 text-white/75 hover:border-white/25"
                                : "border-primary/30 bg-primary/10 text-[oklch(0.78_0.1_132)] hover:border-primary/50",
                        )}
                      >
                        <c.icon className="size-3" />
                        {c.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div
            className={cn(
              "overflow-hidden rounded-xl border border-primary/20 bg-primary/5 transition-all duration-300",
              activeCitation ? "max-h-24 opacity-100 p-3" : "max-h-0 opacity-0 p-0 border-transparent",
            )}
          >
            {activeCitation ? (
              <p className="font-mono text-[11px] leading-relaxed text-[oklch(0.78_0.08_132)]">
                {activeCitation.snippet}
              </p>
            ) : null}
          </div>

          <p className="text-center text-[10px] font-bold uppercase tracking-[0.24em] text-primary/80">
            {scenario.kind === "refusal" ? "Honest refusal · no guesswork" : "Answer Receipt · click a citation"}
          </p>
        </div>
      </div>
    </div>
  );
}
