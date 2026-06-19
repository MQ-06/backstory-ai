"use client";

import { Download, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BriefQuestionCard } from "@/components/capture/brief-question-card";
import {
  codeContextFromEvidence,
  deriveExperts,
  deriveModuleHeat,
  deriveSidebarSignals,
  evidenceChipsFromRecord,
  parseBriefSignals,
} from "@/components/capture/brief-sidebar-data";
import { ExpertSidebar } from "@/components/capture/expert-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ArchaeologyBrief, Interview } from "@/lib/api";
import { cn } from "@/lib/utils";

function evidenceFromRecord(evidence: Record<string, unknown> | null) {
  const chips = evidenceChipsFromRecord(evidence);
  const note =
    typeof evidence?.context === "string"
      ? evidence.context
      : evidence?.signal_type
        ? `Signal type: ${String(evidence.signal_type)} — expert context may not exist in tickets or commits.`
        : undefined;
  return { chips, note };
}

type ArchaeologyBriefPanelProps = {
  brief: ArchaeologyBrief | null;
  interviews: Interview[];
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
  interviews,
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
  const signals = useMemo(() => parseBriefSignals(brief), [brief]);
  const experts = useMemo(
    () => deriveExperts(brief, signals, interviews),
    [brief, signals, interviews],
  );
  const sidebarSignals = useMemo(() => deriveSidebarSignals(signals), [signals]);
  const moduleHeat = useMemo(
    () => deriveModuleHeat(signals, brief?.module_path ?? modulePath),
    [signals, brief?.module_path, modulePath],
  );

  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  const [expandedRank, setExpandedRank] = useState<number | null>(1);

  useEffect(() => {
    if (experts.length === 0) {
      setSelectedExpertId(null);
      return;
    }
    if (!selectedExpertId || !experts.some((e) => e.id === selectedExpertId)) {
      setSelectedExpertId(experts[0].id);
    }
  }, [experts, selectedExpertId]);

  const selectedExpert = experts.find((e) => e.id === selectedExpertId) ?? experts[0];
  const displayExpert = brief?.expert_name || expertName || selectedExpert?.name || "Expert";
  const displayModule =
    brief?.module_path || modulePath || moduleHeat[0]?.path || "All indexed modules";

  return (
    <div className="grid gap-8 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <ExpertSidebar
        experts={experts}
        selectedExpertId={selectedExpertId}
        onSelectExpert={setSelectedExpertId}
        moduleHeat={moduleHeat}
        signals={sidebarSignals}
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

// Re-export for interview studio code context panel
export { codeContextFromEvidence };
