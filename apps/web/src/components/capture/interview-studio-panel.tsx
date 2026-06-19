"use client";

import {
  ArrowLeft,
  ArrowRight,
  Link2,
  Loader2,
  Mic,
  Square,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CitationChip } from "@/components/ask/citation-chip";
import { codeContextFromEvidence, evidenceChipsFromRecord } from "@/components/capture/brief-sidebar-data";
import { Button } from "@/components/ui/button";
import type { ArchaeologyBrief, Interview, TranscriptSegment } from "@/lib/api";
import { cn } from "@/lib/utils";

type InterviewStudioPanelProps = {
  brief: ArchaeologyBrief | null;
  activeInterview: Interview | null;
  interviews: Interview[];
  consented: boolean;
  recording: boolean;
  recordingSeconds: number;
  previewStream: MediaStream | null;
  error: string | null;
  onSelectInterview: (interview: Interview) => void;
  onConsent: () => void;
  onRevokeConsent: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onUpload: (file: File) => Promise<void>;
  consentPending: boolean;
};

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function InterviewStudioPanel({
  brief,
  activeInterview,
  interviews,
  consented,
  recording,
  recordingSeconds,
  previewStream,
  error,
  onSelectInterview,
  onConsent,
  onRevokeConsent,
  onStartRecording,
  onStopRecording,
  onUpload,
  consentPending,
}: InterviewStudioPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [linkedSegments, setLinkedSegments] = useState<Set<string>>(new Set());

  const questions = brief?.questions ?? [];
  const currentQuestion = questions[questionIndex];
  const expertName = brief?.expert_name ?? activeInterview?.expert_name ?? "Expert";
  const segments: TranscriptSegment[] = activeInterview?.segments ?? [];
  const answeredCount = Math.min(questionIndex + 1, questions.length);
  const questionChips = evidenceChipsFromRecord(currentQuestion?.evidence ?? null);
  const codeContext = codeContextFromEvidence(currentQuestion?.evidence ?? null);

  const displaySeconds =
    recording || recordingSeconds > 0
      ? recordingSeconds
      : activeInterview?.duration_seconds ?? 0;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (previewStream) {
      el.srcObject = previewStream;
      void el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [previewStream]);

  const toggleLink = (segmentId: string) => {
    setLinkedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segmentId)) next.delete(segmentId);
      else next.add(segmentId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/70 pb-4">
        <p className="section-label text-amber">Expert capture</p>
        <h2 className="font-display text-2xl tracking-tight sm:text-3xl">Interview Studio</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Recording {expertName}
          {brief ? " · Archaeology Brief loaded" : ""}
          {questions.length > 0
            ? ` · ${answeredCount} of ${questions.length} questions answered`
            : ""}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-receipt shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
              <p className="section-label text-muted-foreground">Recording</p>
              <p className="font-mono text-xs text-muted-foreground">
                {expertName} · {brief?.module_path ?? "indexed modules"}
              </p>
            </div>
            <div className="relative aspect-video bg-archive-deep">
              {previewStream ? (
                <video
                  ref={videoRef}
                  className="size-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-archive-deep-foreground/80">
                  <span className="flex size-16 items-center justify-center rounded-full bg-archive-deep-foreground/10 text-2xl font-bold">
                    {expertName.charAt(0)}
                  </span>
                  <p className="mt-3 text-sm font-medium">{expertName}</p>
                  <p className="text-xs text-archive-deep-foreground/60">
                    {activeInterview ? "Ready to record" : "Start an interview from the brief tab"}
                  </p>
                </div>
              )}
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-2.5 py-1 font-mono text-xs text-white">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    recording ? "animate-pulse bg-red-500" : "bg-white/50",
                  )}
                />
                {recording ? "REC" : "●"} {formatDuration(displaySeconds)}
              </div>
            </div>
            {consented ? (
              <div className="border-t border-proof/25 bg-proof/8 px-4 py-2.5 text-xs text-proof">
                Recording with consent — stored privately in this engagement only.
              </div>
            ) : (
              <div className="border-t border-border/60 bg-parchment/50 px-4 py-2.5 text-xs text-muted-foreground">
                Consent required before recording.
              </div>
            )}
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{recording ? "Live capture" : previewStream ? "Preview active" : "Idle"}</span>
                <span className="font-mono">{activeInterview?.status ?? "idle"}</span>
              </div>
              <div className="flex h-8 items-end gap-0.5">
                {Array.from({ length: 32 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex-1 rounded-sm bg-proof/40",
                      recording && "animate-pulse bg-proof/70",
                    )}
                    style={{ height: `${20 + ((i * 7) % 60)}%` }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={consented}
                    disabled={!activeInterview || consentPending}
                    onChange={(e) => (e.target.checked ? onConsent() : onRevokeConsent())}
                  />
                  <span>Expert consent recorded</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={recording ? "destructive" : "default"}
                  className={!recording ? "bg-ink text-receipt hover:bg-ink/90" : undefined}
                  disabled={!activeInterview || !consented}
                  onClick={() => (recording ? onStopRecording() : onStartRecording())}
                >
                  {recording ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
                  {recording ? "Stop" : "Record"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!activeInterview || !consented}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-3.5" />
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUpload(file).catch(() => {});
                    e.target.value = "";
                  }}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/80 bg-receipt shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
              <p className="section-label text-muted-foreground">Code context</p>
              <span className="text-[10px] text-muted-foreground">Current question</span>
            </div>
            <div className="bg-archive-deep p-4">
              {codeContext ? (
                <>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-archive-deep-foreground/50">
                    Referenced in this question
                  </p>
                  <p className="mb-3 font-mono text-xs text-amber">
                    {codeContext.path}
                    {codeContext.lineStart ? ` · line ${codeContext.lineStart}` : ""}
                  </p>
                  <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-archive-deep-foreground/90">
                    {codeContext.snippet}
                  </pre>
                </>
              ) : (
                <p className="text-xs text-archive-deep-foreground/70">
                  {currentQuestion
                    ? "No code path attached to this question — evidence may be ticket or commit based."
                    : "Select a brief question to see linked code context."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-receipt p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <p className="section-label text-muted-foreground">Current question</p>
              {questions.length > 0 ? (
                <span className="font-mono text-xs text-muted-foreground">
                  {questionIndex + 1} / {questions.length}
                </span>
              ) : null}
            </div>
            {questions.length > 0 ? (
              <>
                <div className="mb-4 flex gap-1">
                  {questions.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full",
                        i < questionIndex
                          ? "bg-proof"
                          : i === questionIndex
                            ? "bg-amber"
                            : "bg-border",
                      )}
                    />
                  ))}
                </div>
                <div className="rounded-lg border border-amber/30 bg-amber/8 p-4">
                  <p className="section-label mb-2 text-amber">Ask this now</p>
                  <p className="font-display text-base leading-snug text-ink">
                    {currentQuestion?.question_text}
                  </p>
                  {questionChips.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {questionChips.map((chip) => (
                        <CitationChip
                          key={chip.label}
                          label={chip.label}
                          variant={chip.variant}
                          as="span"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={questionIndex === 0}
                    onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                  >
                    <ArrowLeft className="size-3.5" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={questionIndex >= questions.length - 1}
                    onClick={() => setQuestionIndex((i) => Math.min(questions.length - 1, i + 1))}
                  >
                    Next
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Load a brief with questions to drive the interview.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border/80 bg-receipt shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
              <p className="section-label text-muted-foreground">Live transcript</p>
              <Button variant="ghost" size="sm" className="h-7 text-xs" disabled>
                <Link2 className="size-3" />
                Link all
              </Button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto p-3">
              {segments.length > 0 ? (
                segments.map((seg) => {
                  const linked = linkedSegments.has(seg.id);
                  return (
                    <div
                      key={seg.id}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        linked
                          ? "border-amber/30 bg-amber/8"
                          : "border-border/60 bg-parchment/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs text-amber">
                          {formatTimestamp(seg.start_seconds)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleLink(seg.id)}
                          className="text-[10px] font-semibold text-muted-foreground hover:text-ink"
                        >
                          {linked ? "Linked" : "+ Link"}
                        </button>
                      </div>
                      <p className="mt-1 leading-relaxed text-ink">{seg.text}</p>
                      {linked && questionChips[0] ? (
                        <div className="mt-2">
                          <CitationChip
                            label={questionChips[0].label}
                            variant={questionChips[0].variant}
                            as="span"
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {activeInterview
                    ? "Transcript will appear after recording or upload."
                    : "Start an interview from the Archaeology Brief tab."}
                </p>
              )}
              {recording ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Recording in progress…
                </div>
              ) : null}
              {activeInterview?.status === "transcribing" ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Transcribing…
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {interviews.length > 0 ? (
        <div className="rounded-xl border border-border/80 bg-receipt p-4 shadow-soft">
          <p className="section-label mb-3 text-muted-foreground">Sessions</p>
          <div className="flex flex-wrap gap-2">
            {interviews.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => onSelectInterview(i)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  activeInterview?.id === i.id
                    ? "border-amber/40 bg-amber/8"
                    : "border-border hover:border-amber/25",
                )}
              >
                <span className="font-medium">{i.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">{i.status}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
