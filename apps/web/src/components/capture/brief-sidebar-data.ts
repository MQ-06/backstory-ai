import type { ArchaeologyBrief, Interview } from "@/lib/api";

import type { ExpertProfile, ModuleHeat } from "@/components/capture/expert-sidebar";

export type BriefSignal = {
  signal_type: string;
  label: string;
  path: string | null;
  score: number;
  evidence: Record<string, unknown>;
};

function scoreToRisk(score: number): ExpertProfile["risk"] {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "med";
  return "low";
}

function scoreToModuleRisk(score: number): ModuleHeat["risk"] {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "med";
  if (score >= 0.15) return "low";
  return "none";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "expert";
}

export function parseBriefSignals(brief: ArchaeologyBrief | null): BriefSignal[] {
  if (!brief?.signals?.length) return [];
  return brief.signals
    .map((raw) => {
      const s = raw as Record<string, unknown>;
      return {
        signal_type: String(s.signal_type ?? ""),
        label: String(s.label ?? ""),
        path: typeof s.path === "string" ? s.path : null,
        score: typeof s.score === "number" ? s.score : 0,
        evidence: (s.evidence as Record<string, unknown>) ?? {},
      };
    })
    .filter((s) => s.label);
}

export function deriveSidebarSignals(signals: BriefSignal[]) {
  return signals.slice(0, 4).map((s) => ({
    label: s.label,
    tone: scoreToRisk(s.score),
  }));
}

export function deriveModuleHeat(signals: BriefSignal[], modulePath?: string | null): ModuleHeat[] {
  const pathScores = new Map<string, number>();

  for (const signal of signals) {
    const path =
      signal.path ??
      (typeof signal.evidence.path === "string" ? signal.evidence.path : null);
    if (path) {
      pathScores.set(path, Math.max(pathScores.get(path) ?? 0, signal.score));
    }
  }

  let modules = [...pathScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, score]) => ({ path, risk: scoreToModuleRisk(score) }));

  if (modules.length === 0 && modulePath?.trim()) {
    modules = [{ path: modulePath.trim(), risk: "med" as const }];
  }

  return modules;
}

export function deriveExperts(
  brief: ArchaeologyBrief | null,
  signals: BriefSignal[],
  interviews: Interview[],
): ExpertProfile[] {
  const experts = new Map<string, ExpertProfile>();

  const addExpert = (
    name: string,
    role: string,
    risk: ExpertProfile["risk"],
    daysRemaining?: number,
  ) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = slugify(trimmed);
    const existing = experts.get(id);
    if (!existing || riskRank(risk) > riskRank(existing.risk)) {
      experts.set(id, {
        id,
        name: trimmed,
        initials: initials(trimmed),
        role,
        risk,
        daysRemaining,
      });
    }
  };

  if (brief?.expert_name) {
    addExpert(brief.expert_name, "Target expert for this brief", "high");
  }

  for (const signal of signals) {
    if (signal.signal_type === "single_owner" || signal.signal_type === "expert_activity") {
      const author =
        typeof signal.evidence.author === "string"
          ? signal.evidence.author
          : typeof signal.evidence.expert_name === "string"
            ? signal.evidence.expert_name
            : null;
      if (author) {
        const role =
          signal.signal_type === "single_owner"
            ? `Primary commit author — bus-factor risk`
            : `Indexed commit activity`;
        addExpert(author, role, scoreToRisk(signal.score));
      }
    }
  }

  for (const interview of interviews) {
    if (interview.expert_name) {
      const status =
        interview.status === "indexed"
          ? "Interview indexed"
          : `Interview · ${interview.status}`;
      addExpert(interview.expert_name, status, "med");
    }
  }

  return [...experts.values()].sort((a, b) => riskRank(b.risk) - riskRank(a.risk));
}

function riskRank(risk: ExpertProfile["risk"]): number {
  if (risk === "high") return 3;
  if (risk === "med") return 2;
  return 1;
}

export function evidenceChipsFromRecord(evidence: Record<string, unknown> | null) {
  if (!evidence) return [];
  const chips: { label: string; variant: "code" | "ticket" | "interview" }[] = [];
  const label = evidence.label as string | undefined;
  const path = evidence.path as string | undefined;
  const signalType = evidence.signal_type as string | undefined;

  if (label) {
    chips.push({
      label,
      variant:
        signalType === "ticket" ? "ticket" : signalType === "interview" ? "interview" : "code",
    });
  } else if (path) {
    const lineStart = evidence.line_start;
    const suffix = typeof lineStart === "number" ? `:${lineStart}` : "";
    chips.push({ label: `${path}${suffix}`, variant: "code" });
  }

  return chips;
}

export function codeContextFromEvidence(evidence: Record<string, unknown> | null) {
  if (!evidence) return null;
  const path = typeof evidence.path === "string" ? evidence.path : null;
  const lineStart = typeof evidence.line_start === "number" ? evidence.line_start : null;
  const snippet =
    typeof evidence.snippet === "string"
      ? evidence.snippet
      : typeof evidence.context === "string"
        ? evidence.context
        : typeof evidence.subject === "string"
          ? evidence.subject
          : null;

  if (!path && !snippet) return null;
  return {
    path: path ?? "indexed source",
    lineStart,
    snippet: snippet ?? "No code snippet stored for this signal — open the linked source in Library.",
  };
}
