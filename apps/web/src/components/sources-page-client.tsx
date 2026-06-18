"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, FolderGit2, HelpCircle, Loader2, RefreshCw, Ticket, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { WorkspaceHeader } from "@/components/workspace-header";
import { useEngagement } from "@/components/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createGitSource, createTicketSource, fetchSources, resyncSource, uploadDocSource, type Source, type SourceType } from "@/lib/api";
import { cn } from "@/lib/utils";

const TYPE_META: Record<SourceType, { icon: LucideIcon; label: string; resyncable: boolean }> = {
  git: { icon: FolderGit2, label: "Git", resyncable: true },
  tickets: { icon: Ticket, label: "Tickets", resyncable: true },
  docs: { icon: FileText, label: "Documents", resyncable: true },
  interview: { icon: Video, label: "Interview", resyncable: false },
};

const DEFAULT_TYPE_META = { icon: HelpCircle, label: "Source", resyncable: false };

function getTypeMeta(type: string) {
  return TYPE_META[type as SourceType] ?? { ...DEFAULT_TYPE_META, label: type || "Source" };
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  queued: "bg-muted text-muted-foreground",
  processing: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  indexed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  error: "bg-destructive/15 text-destructive",
};

function formatIndexedStats(source: Source): string | null {
  const c = source.config;
  if (source.status !== "indexed" || !c) return null;
  const parts: string[] = [];
  if (typeof c.file_count === "number") parts.push(`${c.file_count} files`);
  if (typeof c.commit_count === "number") parts.push(`${c.commit_count} commits`);
  if (typeof c.issue_count === "number") parts.push(`${c.issue_count} issues`);
  if (typeof c.char_count === "number") parts.push(`${c.char_count.toLocaleString()} chars`);
  if (typeof c.chunk_count === "number") parts.push(`${c.chunk_count} chunks`);
  if (typeof c.embedded_count === "number") parts.push(`${c.embedded_count} vectors`);
  if (c.embeddings_ready === false) parts.push("vectors pending");
  if (typeof c.embedding_error === "string") parts.push("vector error");
  return parts.length > 0 ? parts.join(" · ") : null;
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

  return (
    <Card className="shadow-soft transition-shadow hover:shadow-card">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{source.name}</CardTitle>
            <Badge variant="secondary" className="text-[10px] uppercase">
              {meta.label}
            </Badge>
            <Badge className={cn("text-[10px] uppercase", STATUS_STYLE[source.status] ?? STATUS_STYLE.queued)}>
              {source.status}
            </Badge>
          </div>
          <CardDescription className="mt-1 truncate">
            {formatIndexedStats(source) ??
              source.status_detail ??
              source.error_message ??
              (source.config?.repo_url as string | undefined) ??
              (source.config?.project_key as string | undefined) ??
              (source.config?.filename as string | undefined) ??
              (source.type === "interview" ? "Managed in Capture → Interviews" : null) ??
              "—"}
          </CardDescription>
        </div>
        {canResync ? (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
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
      </CardHeader>
      {source.error_message ? (
        <CardContent className="pt-0">
          <p className="text-sm text-destructive">{source.error_message}</p>
        </CardContent>
      ) : null}
    </Card>
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
    onError: (err: Error) => setConnectError(err.message),
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
    onError: (err: Error) => setTicketError(err.message),
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
    onError: (err: Error) => setUploadError(err.message),
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

  return (
    <div>
      <WorkspaceHeader
        eyebrow="Connect memory"
        title="Sources"
        description="Index Git repos, GitHub Issues, and documents for this engagement. Status updates live while workers ingest."
      />

      <div className="mb-10 grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/15 shadow-soft transition-shadow hover:shadow-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderGit2 className="size-4 text-primary" />
              Connect Git
            </CardTitle>
            <CardDescription>
              Public repos — files and commits become searchable chunks.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              />
              <Button type="submit" disabled={connectMutation.isPending || !repoUrl.trim()}>
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
          </CardContent>
        </Card>

        <Card className="shadow-soft transition-shadow hover:shadow-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ticket className="size-4 text-primary" />
              Import tickets
            </CardTitle>
            <CardDescription>GitHub Issues for a public repo (owner/repo).</CardDescription>
          </CardHeader>
          <CardContent>
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
              />
              <Button type="submit" disabled={ticketMutation.isPending || !ticketKey.trim()}>
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
          </CardContent>
        </Card>

        <Card className="shadow-soft transition-shadow hover:shadow-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" />
              Upload document
            </CardTitle>
            <CardDescription>PDF, DOCX, Markdown, or TXT (max 10 MB).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Input
                type="file"
                accept=".pdf,.docx,.md,.markdown,.txt,.html,.htm"
                disabled={uploadMutation.isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                  e.target.value = "";
                }}
              />
              {uploadMutation.isPending ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Uploading…
                </p>
              ) : null}
            </div>
            {uploadError ? <p className="mt-2 text-sm text-destructive">{uploadError}</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Data sources</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : dataSources.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
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
            <h2 className="text-sm font-bold text-foreground">Interview recordings</h2>
            <p className="text-xs text-muted-foreground">
              Created in Capture — listed here for visibility, managed on the Capture page.
            </p>
            <div className="grid gap-3">
              {interviewSources.map((source) => (
                <SourceRow key={source.id} source={source} resyncing={false} onResync={() => {}} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
