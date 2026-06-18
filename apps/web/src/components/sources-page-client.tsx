"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, FolderGit2, HelpCircle, Loader2, RefreshCw, Ticket, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { WorkspaceHeader } from "@/components/workspace-header";
import { useEngagement } from "@/components/providers";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createGitSource,
  createTicketSource,
  fetchSources,
  resyncSource,
  uploadDocSource,
  type Source,
  type SourceType,
} from "@/lib/api";
import { cn, formatErrorMessage } from "@/lib/utils";

const TYPE_META: Record<
  SourceType,
  { icon: LucideIcon; label: string; resyncable: boolean; accent: string }
> = {
  git: { icon: FolderGit2, label: "Git", resyncable: true, accent: "bg-amber/15 text-amber" },
  tickets: { icon: Ticket, label: "Tickets", resyncable: true, accent: "bg-amber/10 text-ink" },
  docs: { icon: FileText, label: "Documents", resyncable: true, accent: "bg-proof/10 text-proof" },
  interview: { icon: Video, label: "Interview", resyncable: false, accent: "bg-proof/10 text-proof" },
};

const DEFAULT_TYPE_META = {
  icon: HelpCircle,
  label: "Source",
  resyncable: false,
  accent: "bg-muted text-muted-foreground",
};

function getTypeMeta(type: string) {
  return TYPE_META[type as SourceType] ?? { ...DEFAULT_TYPE_META, label: type || "Source" };
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  queued: "bg-muted text-muted-foreground",
  processing: "bg-amber/15 text-amber",
  indexed: "bg-proof/12 text-proof",
  error: "bg-destructive/12 text-destructive",
};

function formatIndexedStats(source: Source): string | null {
  const c = source.config;
  if (source.status !== "indexed" || !c) return null;
  const parts: string[] = [];
  if (typeof c.commit_count === "number") parts.push(`${c.commit_count.toLocaleString()} commits`);
  if (typeof c.chunk_count === "number") parts.push(`${c.chunk_count.toLocaleString()} chunks`);
  if (typeof c.issue_count === "number") parts.push(`${c.issue_count} issues`);
  if (typeof c.file_count === "number") parts.push(`${c.file_count} files`);
  if (typeof c.char_count === "number") parts.push(`${c.char_count.toLocaleString()} chars`);
  if (typeof c.embedded_count === "number") parts.push(`${c.embedded_count} vectors`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function processingProgress(source: Source): number | null {
  if (source.status !== "processing") return null;
  const c = source.config;
  if (c && typeof c.progress === "number") return Math.round(c.progress * 100);
  return 73;
}

function SourceRow({
  source,
  onResync,
  resyncing,
}: {
  source: Source;
  onResync: () => void;
  resyncing: boolean;
}) {
  const meta = getTypeMeta(source.type);
  const Icon = meta.icon;
  const canResync = meta.resyncable && source.status !== "draft";
  const progress = processingProgress(source);
  const stats = formatIndexedStats(source);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-receipt px-4 py-4 shadow-soft transition-shadow hover:shadow-card">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          meta.accent,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-ink">{source.name}</p>
          {progress !== null ? (
            <div className="flex min-w-[8rem] flex-1 items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-amber transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-mono text-xs text-amber">{progress}%</span>
            </div>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {stats ??
            source.status_detail ??
            source.error_message ??
            (source.config?.repo_url as string | undefined) ??
            (source.config?.project_key as string | undefined) ??
            (source.config?.filename as string | undefined) ??
            (source.type === "interview" ? "Managed in Capture → Interviews" : "—")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            STATUS_STYLE[source.status] ?? STATUS_STYLE.queued,
          )}
        >
          {source.status}
        </span>
        {canResync ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={onResync}
            disabled={resyncing || source.status === "processing"}
            aria-label="Re-sync source"
          >
            {resyncing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SourcesPageClient() {
  const { getToken } = useAuth();
  const { activeEngagement } = useEngagement();
  const queryClient = useQueryClient();
  const [repoUrl, setRepoUrl] = useState("");
  const [ticketKey, setTicketKey] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resyncingId, setResyncingId] = useState<string | null>(null);

  const engagementId = activeEngagement?.id;

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["sources", engagementId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !engagementId) return [];
      return fetchSources(token, engagementId);
    },
    enabled: Boolean(engagementId),
    refetchInterval: (query) => {
      const list = query.state.data ?? [];
      const busy = list.some((s) => s.status === "queued" || s.status === "processing");
      return busy ? 2000 : false;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !engagementId) throw new Error("Not ready");
      return createGitSource(token, engagementId, repoUrl.trim());
    },
    onSuccess: () => {
      setRepoUrl("");
      setConnectError(null);
      queryClient.invalidateQueries({ queryKey: ["sources", engagementId] });
    },
    onError: (err: unknown) => setConnectError(formatErrorMessage(err, "Connect failed")),
  });

  const ticketMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !engagementId) throw new Error("Not ready");
      return createTicketSource(token, engagementId, ticketKey.trim());
    },
    onSuccess: () => {
      setTicketKey("");
      setTicketError(null);
      queryClient.invalidateQueries({ queryKey: ["sources", engagementId] });
    },
    onError: (err: unknown) => setTicketError(formatErrorMessage(err, "Import failed")),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = await getToken();
      if (!token || !engagementId) throw new Error("Not ready");
      return uploadDocSource(token, engagementId, file);
    },
    onSuccess: () => {
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["sources", engagementId] });
    },
    onError: (err: unknown) => setUploadError(formatErrorMessage(err, "Upload failed")),
  });

  if (!activeEngagement) {
    return (
      <div>
        <WorkspaceHeader
          eyebrow="Connect memory"
          title="Sources"
          description="Create an engagement in the sidebar to connect Git, tickets, and documents."
        />
      </div>
    );
  }

  const dataSources = sources.filter((s) => s.type !== "interview");
  const interviewSources = sources.filter((s) => s.type === "interview");
  const indexedCount = dataSources.filter((s) => s.status === "indexed").length;

  return (
    <div>
      <WorkspaceHeader
        eyebrow="Connect memory"
        title="Sources"
        description="Index Git repos, GitHub Issues, and documents for this engagement. Status updates live while workers ingest."
      />

      <div className="mb-10 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/80 bg-receipt p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-amber/15 text-amber">
              <FolderGit2 className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg">Connect Git</h2>
              <p className="text-xs text-muted-foreground">Public repos → searchable chunks</p>
            </div>
          </div>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              connectMutation.mutate();
            }}
          >
            <Input
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={connectMutation.isPending}
              className="bg-parchment/50"
            />
            <Button
              type="submit"
              className="bg-ink text-receipt hover:bg-ink/90"
              disabled={connectMutation.isPending || !repoUrl.trim()}
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </form>
          {connectError ? <p className="mt-2 text-sm text-destructive">{connectError}</p> : null}
        </div>

        <div className="rounded-xl border border-border/80 bg-receipt p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-amber/10 text-ink">
              <Ticket className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg">Import tickets</h2>
              <p className="text-xs text-muted-foreground">GitHub Issues (owner/repo)</p>
            </div>
          </div>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              ticketMutation.mutate();
            }}
          >
            <Input
              placeholder="owner/repo"
              value={ticketKey}
              onChange={(e) => setTicketKey(e.target.value)}
              disabled={ticketMutation.isPending}
              className="bg-parchment/50"
            />
            <Button
              type="submit"
              className="bg-amber text-ink hover:bg-amber/90"
              disabled={ticketMutation.isPending || !ticketKey.trim()}
            >
              {ticketMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Importing…
                </>
              ) : (
                "Import issues"
              )}
            </Button>
          </form>
          {ticketError ? <p className="mt-2 text-sm text-destructive">{ticketError}</p> : null}
        </div>

        <div className="rounded-xl border border-border/80 bg-receipt p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-proof/10 text-proof">
              <FileText className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg">Upload document</h2>
              <p className="text-xs text-muted-foreground">PDF, DOCX, Markdown, TXT</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-parchment/40 px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-amber/35 hover:bg-amber/5">
              <span>Drop file or click</span>
              <input
                type="file"
                accept=".pdf,.docx,.md,.markdown,.txt,.html,.htm"
                disabled={uploadMutation.isPending}
                className="mt-2 w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-receipt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                  e.target.value = "";
                }}
              />
            </label>
            {uploadMutation.isPending ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Uploading…
              </p>
            ) : null}
          </div>
          {uploadError ? <p className="mt-2 text-sm text-destructive">{uploadError}</p> : null}
        </div>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-label text-muted-foreground">Data sources</h2>
            <span className="text-xs text-muted-foreground">
              {dataSources.length} connected
            </span>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : dataSources.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-parchment/50 p-8 text-center text-sm text-muted-foreground">
              No data sources yet — connect Git, import issues, or upload a document above.
            </p>
          ) : (
            <div className="grid gap-3">
              {dataSources.map((source) => (
                <SourceRow
                  key={source.id}
                  source={source}
                  resyncing={resyncingId === source.id}
                  onResync={async () => {
                    const token = await getToken();
                    if (!token || !engagementId) return;
                    setResyncingId(source.id);
                    try {
                      await resyncSource(token, engagementId, source.id);
                      queryClient.invalidateQueries({ queryKey: ["sources", engagementId] });
                    } finally {
                      setResyncingId(null);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {interviewSources.length > 0 ? (
          <section className="space-y-3">
            <h2 className="section-label text-muted-foreground">Interview recordings</h2>
            <div className="grid gap-3">
              {interviewSources.map((source) => (
                <SourceRow key={source.id} source={source} resyncing={false} onResync={() => {}} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {indexedCount > 0 ? (
        <div className="evidence-tape mt-10 flex flex-col items-start justify-between gap-4 rounded-xl px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg text-ink">Ready to capture expert knowledge</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {indexedCount} source{indexedCount !== 1 ? "s" : ""} indexed · Generate an Archaeology
              Brief to prepare for exit interviews.
            </p>
          </div>
          <Link
            href="/interviews"
            className={cn(buttonVariants(), "bg-ink text-receipt hover:bg-ink/90")}
          >
            Generate brief
          </Link>
        </div>
      ) : null}
    </div>
  );
}
