"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mic, ScrollText, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { WorkspaceHeader } from "@/components/workspace-header";
import { useEngagement } from "@/components/providers";
import { VideoClipPlayer } from "@/components/video-clip-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createInterview,
  fetchBriefs,
  fetchInterviews,
  generateBrief,
  recordInterviewConsent,
  transcribeInterview,
  uploadInterviewMedia,
  type ArchaeologyBrief,
  type Interview,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type Tab = "brief" | "studio";

function QuestionCard({ rank, text, evidence }: { rank: number; text: string; evidence: Record<string, unknown> | null }) {
  const label = evidence?.label as string | undefined;
  const path = evidence?.path as string | undefined;
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Q{rank}</Badge>
          <CardTitle className="text-base leading-snug">{text}</CardTitle>
        </div>
        {label || path ? (
          <CardDescription>
            Evidence: {label ?? path}
            {evidence?.signal_type ? ` · ${String(evidence.signal_type)}` : ""}
          </CardDescription>
        ) : null}
      </CardHeader>
    </Card>
  );
}

export function InterviewsPageClient() {
  const { getToken } = useAuth();
  const { activeEngagement } = useEngagement();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("brief");
  const [expertName, setExpertName] = useState("");
  const [modulePath, setModulePath] = useState("");
  const [briefError, setBriefError] = useState<string | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<ArchaeologyBrief | null>(null);
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [consented, setConsented] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const engagementId = activeEngagement?.id;

  const { data: briefs = [], isLoading: briefsLoading } = useQuery({
    queryKey: ["briefs", engagementId],
    enabled: Boolean(engagementId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !engagementId) return [];
      return fetchBriefs(token, engagementId);
    },
  });

  const { data: interviews = [], isLoading: interviewsLoading } = useQuery({
    queryKey: ["interviews", engagementId],
    enabled: Boolean(engagementId),
    refetchInterval: (query) => {
      const rows = query.state.data as Interview[] | undefined;
      if (rows?.some((i) => ["queued", "transcribing", "processing"].includes(i.status))) {
        return 3000;
      }
      return false;
    },
    queryFn: async () => {
      const token = await getToken();
      if (!token || !engagementId) return [];
      return fetchInterviews(token, engagementId);
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !engagementId) throw new Error("Not signed in");
      return generateBrief(token, engagementId, {
        expert_name: expertName.trim() || undefined,
        module_path: modulePath.trim() || undefined,
      });
    },
    onSuccess: (brief) => {
      setBriefError(null);
      setSelectedBrief(brief);
      void queryClient.invalidateQueries({ queryKey: ["briefs", engagementId] });
    },
    onError: (err: Error) => setBriefError(err.message),
  });

  const startInterviewMutation = useMutation({
    mutationFn: async (brief: ArchaeologyBrief) => {
      const token = await getToken();
      if (!token || !engagementId) throw new Error("Not signed in");
      const title = `Interview — ${brief.expert_name || expertName || "Expert"}`;
      return createInterview(token, engagementId, {
        title,
        expert_name: brief.expert_name || expertName || undefined,
        brief_id: brief.id,
      });
    },
    onSuccess: (interview) => {
      setActiveInterview(interview);
      setConsented(false);
      setTab("studio");
      void queryClient.invalidateQueries({ queryKey: ["interviews", engagementId] });
    },
    onError: (err: Error) => setStudioError(err.message),
  });

  const consentMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !engagementId || !activeInterview) throw new Error("No interview");
      return recordInterviewConsent(token, engagementId, activeInterview.id);
    },
    onSuccess: (interview) => {
      setActiveInterview(interview);
      setConsented(true);
    },
    onError: (err: Error) => setStudioError(err.message),
  });

  const uploadBlob = useCallback(
    async (blob: Blob, filename: string) => {
      const token = await getToken();
      if (!token || !engagementId || !activeInterview) return;
      setStudioError(null);
      const file = new File([blob], filename, { type: blob.type || "video/webm" });
      const updated = await uploadInterviewMedia(token, engagementId, activeInterview.id, file);
      setActiveInterview(updated);
      const transcribed = await transcribeInterview(token, engagementId, activeInterview.id);
      setActiveInterview(transcribed);
      void queryClient.invalidateQueries({ queryKey: ["interviews", engagementId] });
    },
    [activeInterview, engagementId, getToken, queryClient],
  );

  const startRecording = async () => {
    setStudioError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        void uploadBlob(blob, "recording.webm");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      setStudioError(err instanceof Error ? err.message : "Could not access camera/microphone");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const latestBrief = selectedBrief ?? briefs[0] ?? null;
  const previewInterview = activeInterview ?? interviews.find((i) => i.status === "indexed") ?? null;

  return (
    <div>
      <WorkspaceHeader
        eyebrow="Expert capture"
        title="Capture"
        description="Generate an Archaeology Brief from indexed signals, then record time-coded interviews before knowledge walks out the door."
      />

      {!engagementId ? (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Select or create an engagement in the sidebar to run briefs and interviews.
        </div>
      ) : (
        <>
          <div className="mb-8 inline-flex rounded-xl border border-border/80 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setTab("brief")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                tab === "brief"
                  ? "bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ScrollText className="size-4" />
              Archaeology Brief
            </button>
            <button
              type="button"
              onClick={() => setTab("studio")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                tab === "studio"
                  ? "bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Mic className="size-4" />
              Interview Studio
            </button>
          </div>

          {tab === "brief" ? (
            <div className="space-y-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-base">Generate brief</CardTitle>
                  <CardDescription>
                    Study indexed Git and tickets to produce expert-only questions with evidence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Expert name (optional)"
                    value={expertName}
                    onChange={(e) => setExpertName(e.target.value)}
                  />
                  <Input
                    placeholder="Module path filter (optional, e.g. src/click)"
                    value={modulePath}
                    onChange={(e) => setModulePath(e.target.value)}
                  />
                  {briefError ? <p className="text-sm text-destructive">{briefError}</p> : null}
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Generate Archaeology Brief
                  </Button>
                </CardContent>
              </Card>

              {briefsLoading ? (
                <p className="text-sm text-muted-foreground">Loading briefs…</p>
              ) : null}

              {latestBrief ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">Latest brief</h2>
                    <Badge variant="secondary">{latestBrief.status}</Badge>
                    {latestBrief.expert_name ? (
                      <Badge variant="outline">{latestBrief.expert_name}</Badge>
                    ) : null}
                  </div>
                  {latestBrief.error_message ? (
                    <p className="text-sm text-amber-600">{latestBrief.error_message}</p>
                  ) : null}
                  {latestBrief.questions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      rank={q.rank}
                      text={q.question_text}
                      evidence={q.evidence}
                    />
                  ))}
                  {latestBrief.status === "ready" && latestBrief.questions.length > 0 ? (
                    <Button onClick={() => startInterviewMutation.mutate(latestBrief)}>
                      Start interview with this brief
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Record or upload</CardTitle>
                  <CardDescription>
                    Consent required. Recording is transcribed and indexed for Ask Receipts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeInterview ? (
                    <p className="text-sm text-muted-foreground">
                      Session: <span className="font-medium text-foreground">{activeInterview.title}</span>
                      {" · "}
                      <Badge variant="secondary">{activeInterview.status}</Badge>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Generate a brief first, or pick an interview below.
                    </p>
                  )}

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={consented}
                      disabled={!activeInterview || consentMutation.isPending}
                      onChange={(e) => {
                        if (e.target.checked && activeInterview && !consented) {
                          consentMutation.mutate();
                        } else {
                          setConsented(false);
                        }
                      }}
                    />
                    <span>I have consent to record this expert interview for this engagement.</span>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={recording ? "destructive" : "default"}
                      disabled={!activeInterview || !consented}
                      onClick={() => (recording ? stopRecording() : void startRecording())}
                    >
                      <Mic className="mr-2 size-4" />
                      {recording ? "Stop recording" : "Record"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!activeInterview || !consented}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 size-4" />
                      Upload recording
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,video/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !activeInterview) return;
                        const token = await getToken();
                        if (!token || !engagementId) return;
                        setStudioError(null);
                        try {
                          let updated = await uploadInterviewMedia(
                            token,
                            engagementId,
                            activeInterview.id,
                            file,
                          );
                          setActiveInterview(updated);
                          updated = await transcribeInterview(token, engagementId, activeInterview.id);
                          setActiveInterview(updated);
                          void queryClient.invalidateQueries({ queryKey: ["interviews", engagementId] });
                        } catch (err) {
                          setStudioError(err instanceof Error ? err.message : String(err));
                        }
                      }}
                    />
                  </div>

                  {studioError ? <p className="text-sm text-destructive">{studioError}</p> : null}
                  {activeInterview?.status_detail ? (
                    <p className="text-xs text-muted-foreground">{activeInterview.status_detail}</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Transcript</CardTitle>
                  <CardDescription>Timestamped segments become Ask Receipts when indexed.</CardDescription>
                </CardHeader>
                <CardContent className="max-h-96 space-y-2 overflow-y-auto">
                  {interviewsLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
                  {(activeInterview?.segments.length
                    ? activeInterview.segments
                    : previewInterview?.segments ?? []
                  ).map((seg) => (
                    <div key={seg.id} className="rounded-lg border border-border p-2 text-sm">
                      <span className="font-mono text-xs text-primary">
                        {Math.floor(seg.start_seconds / 60)}:
                        {String(Math.floor(seg.start_seconds % 60)).padStart(2, "0")}
                      </span>
                      <p className="mt-1">{seg.text}</p>
                    </div>
                  ))}
                  {!activeInterview?.segments.length && !previewInterview?.segments.length ? (
                    <p className="text-sm text-muted-foreground">No transcript yet.</p>
                  ) : null}
                </CardContent>
              </Card>

              {previewInterview?.status === "indexed" && engagementId ? (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Preview clip</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VideoClipPlayer
                      engagementId={engagementId}
                      interviewId={previewInterview.id}
                      startSeconds={previewInterview.segments[0]?.start_seconds ?? 0}
                      snippet={previewInterview.segments[0]?.text}
                      label={previewInterview.title}
                    />
                  </CardContent>
                </Card>
              ) : null}

              {interviews.length > 0 ? (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {interviews.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setActiveInterview(i)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm",
                          activeInterview?.id === i.id && "border-primary bg-accent",
                        )}
                      >
                        <span>{i.title}</span>
                        <Badge variant="secondary">{i.status}</Badge>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
