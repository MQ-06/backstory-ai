"use client";

import { Download, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

import { BriefQuestionCard } from "@/components/capture/brief-question-card";
import { ExpertSidebar, type ExpertProfile, type ModuleHeat } from "@/components/capture/expert-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ArchaeologyBrief } from "@/lib/api";
import { cn } from "@/lib/utils";

const DEMO_EXPERTS: ExpertProfile[] = [
  {
    id: "ahmed",
    name: "Ahmed S.",
    initials: "AS",
    role: "Sr. Engineer — retiring in 42 days",
    risk: "high",
    daysRemaining: 42,
  },
  {
    id: "priya",
    name: "Priya K.",
    initials: "PK",
    role: "Tech Lead — 18 months tenure",
    risk: "med",
  },
  {
    id: "james",
    name: "James M.",
    initials: "JM",
    role: "Batch ops — stable handoff",
    risk: "low",
  },
];

const DEMO_SIGNALS = [
  { label: "14× RECON-7 patches (2009–24)", tone: "high" as const },
  { label: "6 after-hours commits", tone: "med" as const },
  { label: "bus-factor 1 on payroll_calc", tone: "high" as const },
  { label: "3 open tickets, no owner", tone: "med" as const },
];

const DEMO_MODULES: ModuleHeat[] = [
  { path: "payroll_calc.py", risk: "high" },
  { path: "batch_runner.py", risk: "high" },
  { path: "ledger_sync.py", risk: "med" },
  { path: "config/payroll.yml", risk: "low" },
  { path: "utils/dates.py", risk: "none" },
];

function evidenceFromRecord(evidence: Record<string, unknown> | null) {
  if (!evidence) return { chips: [], note: undefined as string | undefined };
  const chips: { label: string; variant: "code" | "ticket" | "interview" }[] = [];
  const label = evidence.label as string | undefined;
  const path = evidence.path as string | undefined;
  const signalType = evidence.signal_type as string | undefined;

  if (label) {
    chips.push({
      label,
      variant: signalType === "ticket" ? "ticket" : signalType === "interview" ? "interview" : "code",
    });
  } else if (path) {
    chips.push({ label: path, variant: "code" });
  }

  const note =
    typeof evidence.context === "string"
      ? evidence.context
      : signalType
        ? `Signal type: ${signalType} — expert context may not exist in tickets or commits.`
        : undefined;

  return { chips, note };
}

type ArchaeologyBriefPanelProps = {
  brief: ArchaeologyBrief | null;
  expertName: string;
  modulePath: string;
  onExpertNameChange: (v: string) => void;
  onModulePathChange: (v: string) => void;
  onGenerate: () => void;
  onStartInterview: () => void;
  isGenerating: boolean;
  isStartingInterview: boolean;
  error: string | null;
};

export function ArchaeologyBriefPanel({
  brief,
  expertName,
  modulePath,
  onExpertNameChange,
  onModulePathChange,
  onGenerate,
  onStartInterview,
  isGenerating,
  isStartingInterview,
  error,
}: ArchaeologyBriefPanelProps) {
  const [selectedExpertId, setSelectedExpertId] = useState("ahmed");
  const [expandedRank, setExpandedRank] = useState<number | null>(1);

  const selectedExpert = DEMO_EXPERTS.find((e) => e.id === selectedExpertId) ?? DEMO_EXPERTS[0];
  const displayExpert = brief?.expert_name || expertName || selectedExpert.name;
  const displayModule = brief?.module_path || modulePath || "payroll_calc.py + batch_runner.py";

  return (
    <div className="grid gap-8 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <ExpertSidebar
        experts={DEMO_EXPERTS}
        selectedExpertId={selectedExpertId}
        onSelectExpert={setSelectedExpertId}
        moduleHeat={DEMO_MODULES}
        signals={DEMO_SIGNALS}
      />

      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-tight sm:text-3xl">Archaeology Brief</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Expert-only questions tied to indexed signals — generated from Git, tickets, and module
              risk before the interview starts.
            </p>
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              {displayExpert} · {displayModule}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" disabled={!brief}>
              <Download className="size-3.5" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={onGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Regenerate
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-receipt p-4 shadow-soft">
          <p className="section-label mb-3 text-amber">Generate brief</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Expert name"
              value={expertName}
              onChange={(e) => onExpertNameChange(e.target.value)}
              className="bg-parchment/50"
            />
            <Input
              placeholder="Module path filter (optional)"
              value={modulePath}
              onChange={(e) => onModulePathChange(e.target.value)}
              className="bg-parchment/50"
            />
          </div>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          {!brief ? (
            <Button
              className="mt-3 bg-ink text-receipt hover:bg-ink/90"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating…
                </>
              ) : (
                "Generate Archaeology Brief"
              )}
            </Button>
          ) : null}
        </div>

        {brief?.error_message ? (
          <p className="text-sm text-amber">{brief.error_message}</p>
        ) : null}

        {brief && brief.questions.length > 0 ? (
          <div className="space-y-3">
            {brief.questions.map((q) => {
              const { chips, note } = evidenceFromRecord(q.evidence);
              const expanded = expandedRank === q.rank;
              return (
                <BriefQuestionCard
                  key={q.id}
                  rank={q.rank}
                  text={q.question_text}
                  expanded={expanded}
                  onToggle={() => setExpandedRank(expanded ? null : q.rank)}
                  evidenceChips={chips}
                  contextNote={note}
                />
              );
            })}
          </div>
        ) : brief ? (
          <p className="rounded-xl border border-dashed border-border bg-parchment/50 p-8 text-center text-sm text-muted-foreground">
            Brief generated but no questions yet — connect more sources or try a different module filter.
          </p>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-parchment/50 p-8 text-center text-sm text-muted-foreground">
            Generate a brief to see expert-only questions with evidence chips.
          </p>
        )}

        {brief?.status === "ready" && brief.questions.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-border/70 pt-5">
            <Button variant="outline" disabled>
              <Download className="size-4" />
              Download PDF
            </Button>
            <Button
              className={cn("bg-ink text-receipt hover:bg-ink/90")}
              onClick={onStartInterview}
              disabled={isStartingInterview}
            >
              {isStartingInterview ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Start interview ↗
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
