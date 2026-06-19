"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, ScrollText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArchaeologyBriefPanel } from "@/components/capture/archaeology-brief-panel";
import { InterviewStudioPanel } from "@/components/capture/interview-studio-panel";
import { WorkspaceHeader } from "@/components/workspace-header";
import { useEngagement } from "@/components/providers";
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
import { cn, formatErrorMessage } from "@/lib/utils";

type Tab = "brief" | "studio";

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
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const { data: interviews = [] } = useQuery({
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
    onError: (err: unknown) => setBriefError(formatErrorMessage(err, "Could not generate brief")),
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
    onError: (err: unknown) =>
      setStudioError(formatErrorMessage(err, "Could not start interview")),
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
    onError: (err: unknown) =>
      setStudioError(formatErrorMessage(err, "Could not record consent")),
  });

  const stopPreviewStream = useCallback(() => {
    previewStreamRef.current?.getTracks().forEach((t) => t.stop());
    previewStreamRef.current = null;
    setPreviewStream(null);
  }, []);

  useEffect(() => {
    return () => {
      stopPreviewStream();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [stopPreviewStream]);

  useEffect(() => {
    if (!activeInterview) return;
    const fresh = interviews.find((row) => row.id === activeInterview.id);
    if (!fresh) return;
    const segmentCount = fresh.segments?.length ?? 0;
    const activeSegmentCount = activeInterview.segments?.length ?? 0;
    if (fresh.status !== activeInterview.status || segmentCount !== activeSegmentCount) {
      setActiveInterview(fresh);
    }
  }, [interviews, activeInterview]);

  const uploadBlob = useCallback(
    async (blob: Blob, filename: string) => {
      const token = await getToken();
      if (!token || !engagementId || !activeInterview) return;
      setStudioError(null);
      try {
        const file = new File([blob], filename, { type: blob.type || "video/webm" });
        let updated = await uploadInterviewMedia(token, engagementId, activeInterview.id, file);
        setActiveInterview(updated);
        updated = await transcribeInterview(token, engagementId, activeInterview.id);
        setActiveInterview(updated);
        void queryClient.invalidateQueries({ queryKey: ["interviews", engagementId] });
      } catch (err) {
        setStudioError(formatErrorMessage(err, "Upload or transcription failed"));
      }
    },
    [activeInterview, engagementId, getToken, queryClient],
  );

  const startRecording = async () => {
    setStudioError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      previewStreamRef.current = stream;
      setPreviewStream(stream);
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopPreviewStream();
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        void uploadBlob(blob, "recording.webm");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      setStudioError(formatErrorMessage(err, "Could not access camera/microphone"));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleUpload = async (file: File) => {
    const token = await getToken();
    if (!token || !engagementId || !activeInterview) return;
    setStudioError(null);
    try {
      let updated = await uploadInterviewMedia(token, engagementId, activeInterview.id, file);
      setActiveInterview(updated);
      updated = await transcribeInterview(token, engagementId, activeInterview.id);
      setActiveInterview(updated);
      void queryClient.invalidateQueries({ queryKey: ["interviews", engagementId] });
    } catch (err) {
      setStudioError(formatErrorMessage(err, "Upload or transcription failed"));
      throw err;
    }
  };

  const latestBrief = selectedBrief ?? briefs[0] ?? null;

  return (
    <div>
      <WorkspaceHeader
        eyebrow="Expert capture"
        title="Capture"
        description="Generate an Archaeology Brief from indexed signals, then record time-coded interviews before knowledge walks out the door."
      />

      {!engagementId ? (
        <div className="rounded-xl border border-dashed border-amber/35 bg-amber/5 px-4 py-3 text-sm text-muted-foreground">
          Select or create an engagement in the sidebar to run briefs and interviews.
        </div>
      ) : (
        <>
          <div className="mb-8 inline-flex rounded-xl border border-border/80 bg-parchment/60 p-1">
            <button
              type="button"
              onClick={() => setTab("brief")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                tab === "brief"
                  ? "bg-receipt text-ink shadow-soft"
                  : "text-muted-foreground hover:text-ink",
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
                  ? "bg-receipt text-ink shadow-soft"
                  : "text-muted-foreground hover:text-ink",
              )}
            >
              <Mic className="size-4" />
              Interview Studio
            </button>
          </div>

          {briefsLoading && tab === "brief" ? (
            <p className="text-sm text-muted-foreground">Loading briefs…</p>
          ) : null}

          {tab === "brief" ? (
            <ArchaeologyBriefPanel
              brief={latestBrief}
              interviews={interviews}
              expertName={expertName}
              modulePath={modulePath}
              onExpertNameChange={setExpertName}
              onModulePathChange={setModulePath}
              onGenerate={() => generateMutation.mutate()}
              onStartInterview={() => latestBrief && startInterviewMutation.mutate(latestBrief)}
              isGenerating={generateMutation.isPending}
              isStartingInterview={startInterviewMutation.isPending}
              error={briefError}
            />
          ) : (
            <InterviewStudioPanel
              brief={latestBrief}
              activeInterview={activeInterview}
              interviews={interviews}
              consented={consented}
              recording={recording}
              recordingSeconds={recordingSeconds}
              previewStream={previewStream}
              error={studioError}
              onSelectInterview={setActiveInterview}
              onConsent={() => consentMutation.mutate()}
              onRevokeConsent={() => setConsented(false)}
              onStartRecording={() => void startRecording()}
              onStopRecording={stopRecording}
              onUpload={handleUpload}
              consentPending={consentMutation.isPending}
            />
          )}
        </>
      )}
    </div>
  );
}
