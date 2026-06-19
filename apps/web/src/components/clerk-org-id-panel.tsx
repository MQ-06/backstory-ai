"use client";

import { useAuth, useOrganization } from "@clerk/nextjs";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ClerkOrgIdPanel({ className }: { className?: string }) {
  const { orgId, isLoaded: authLoaded } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const resolvedOrgId = organization?.id ?? orgId ?? null;
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!authLoaded || !orgLoaded) {
    return <p className="text-sm text-muted-foreground">Loading Clerk session…</p>;
  }

  if (!resolvedOrgId) {
    return (
      <div className={cn("rounded-lg border border-amber/30 bg-amber/8 px-4 py-3 text-sm", className)}>
        <p className="font-medium text-ink">No organization active</p>
        <p className="mt-1 text-muted-foreground">
          Use the org switcher in the top bar to create or select an organization, then return here.
          Demo seed only works when an org is active in your session.
        </p>
      </div>
    );
  }

  const seedCommand = `export DEMO_CLERK_ORG_ID=${resolvedOrgId}\nmake demo-seed`;

  return (
    <div className={cn("space-y-4 text-sm", className)}>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Organization name</dt>
          <dd className="font-medium">{organization?.name ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Organization ID (for demo seed)</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2">
            <code className="rounded border border-border bg-parchment px-2 py-1 font-mono text-xs">
              {resolvedOrgId}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => void copy(resolvedOrgId)}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy ID"}
            </Button>
          </dd>
        </div>
      </dl>

      <div>
        <p className="mb-2 text-muted-foreground">Terminal command</p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-parchment p-3 font-mono text-xs leading-relaxed">
          {seedCommand}
        </pre>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => void copy(seedCommand)}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          Copy command
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        This ID comes from your signed-in Clerk session (<code className="font-mono">useOrganization</code> /
        <code className="font-mono"> useAuth</code>) — same value the API uses for tenancy.
      </p>
    </div>
  );
}
