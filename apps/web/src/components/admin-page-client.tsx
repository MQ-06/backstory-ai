"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { ClerkOrgIdPanel } from "@/components/clerk-org-id-panel";
import { useEngagement } from "@/components/providers";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchEngagementStats } from "@/lib/api";
import { cn, formatErrorMessage } from "@/lib/utils";

export function AdminPageClient() {
  const { getToken } = useAuth();
  const { activeEngagement, deleteActive } = useEngagement();
  const engagementId = activeEngagement?.id;
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["engagement-stats", engagementId],
    enabled: Boolean(engagementId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !engagementId) return null;
      return fetchEngagementStats(token, engagementId);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active engagement</CardTitle>
          <CardDescription>MVP admin — source health for the selected engagement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!engagementId ? (
            <p className="text-muted-foreground">Select an engagement in the sidebar.</p>
          ) : isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{activeEngagement?.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sources connected</dt>
                <dd className="font-medium">{stats?.source_count ?? 0}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Indexed sources</dt>
                <dd className="font-medium">{stats?.indexed_source_count ?? 0}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last indexed</dt>
                <dd className="font-medium">
                  {stats?.last_indexed_at
                    ? new Date(stats.last_indexed_at).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </dl>
          )}
          <Link
            href="/sources"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2")}
          >
            Manage sources →
          </Link>
          {engagementId ? (
            <div className="mt-4 space-y-2 border-t border-border/80 pt-4">
              <p className="text-xs text-muted-foreground">
                Delete this engagement and all connected sources, interviews, and memory.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={async () => {
                  const name = activeEngagement?.name ?? "this engagement";
                  if (
                    !window.confirm(
                      `Delete "${name}"? This removes all sources and indexed memory. This cannot be undone.`,
                    )
                  ) {
                    return;
                  }
                  setDeleting(true);
                  setDeleteError(null);
                  try {
                    await deleteActive();
                  } catch (err) {
                    setDeleteError(formatErrorMessage(err, "Could not delete engagement"));
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Deleting…" : "Delete engagement"}
              </Button>
              {deleteError ? <p className="text-xs text-destructive">{deleteError}</p> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo seed — Clerk org ID</CardTitle>
          <CardDescription>
            Copy your active organization ID for <code className="font-mono text-xs">make demo-seed</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClerkOrgIdPanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
          <CardDescription>
            Members, SSO, and audit export ship after MVP. Clerk manages sign-in today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Enterprise SSO and role-based permissions are planned for post-MVP waves.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
