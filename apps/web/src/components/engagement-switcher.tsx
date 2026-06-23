"use client";

import { Check, Plus, RefreshCw, X } from "lucide-react";
import { useState } from "react";

import { useEngagement } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatErrorMessage } from "@/lib/utils";

export function EngagementSwitcher({
  variant = "sidebar",
  hideLabel = false,
}: {
  variant?: "sidebar" | "inline";
  /** Sidebar shell already shows the section label. */
  hideLabel?: boolean;
}) {
  const {
    engagements,
    activeEngagement,
    setActiveEngagementId,
    createNew,
    isLoading,
    isError,
    loadError,
    retryLoad,
  } = useEngagement();
  const [name, setName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isSidebar = variant === "sidebar";

  if (isLoading) {
    return (
      <div className="space-y-2">
        {!hideLabel ? <Skeleton className="h-3 w-16" /> : null}
        <Skeleton className={cn("h-9 w-full", isSidebar && "bg-white/10")} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2 rounded-lg border border-red-400/30 bg-red-950/20 p-3">
        <p className="text-xs leading-relaxed text-red-200">
          {loadError ?? "Could not load engagements."}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "h-8 w-full gap-1.5",
            isSidebar && "border-white/20 bg-transparent text-white hover:bg-white/10",
          )}
          onClick={retryLoad}
        >
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (showCreate) {
    return (
      <form
        className="space-y-2"
        onSubmit={async (ev) => {
          ev.preventDefault();
          if (!name.trim()) return;
          setCreating(true);
          setCreateError(null);
          try {
            await createNew(name.trim());
            setName("");
            setShowCreate(false);
          } catch (err) {
            setCreateError(formatErrorMessage(err, "Could not create engagement"));
          } finally {
            setCreating(false);
          }
        }}
      >
        {!hideLabel ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
            New engagement
          </p>
        ) : null}
        <Input
          className={cn(
            "h-9 text-sm",
            isSidebar
              ? "border-white/25 bg-white/12 text-white placeholder:text-white/45"
              : "bg-background",
          )}
          placeholder="Client or system name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            className="h-8 flex-1 bg-amber text-ink hover:bg-amber/90"
            disabled={creating || !name.trim()}
          >
            <Check className="size-3.5" />
            {creating ? "Creating…" : "Create"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-8 shrink-0", isSidebar && "text-white hover:bg-white/10")}
            onClick={() => {
              setShowCreate(false);
              setName("");
            }}
            disabled={creating}
            aria-label="Cancel"
          >
            <X className="size-4" />
          </Button>
        </div>
        {createError ? (
          <p className={cn("text-xs", isSidebar ? "text-red-300" : "text-destructive")}>
            {createError}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className={cn(isSidebar ? "space-y-2" : "flex min-w-0 flex-1 flex-col gap-2")}>
      {!hideLabel ? (
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.14em]",
            isSidebar ? "text-white/45" : "text-muted-foreground",
          )}
        >
          Engagement
        </p>
      ) : null}

      <div className={cn(isSidebar ? "space-y-2" : "flex min-w-0 flex-1 flex-col gap-2")}>
        {engagements.length > 0 ? (
          <Select
            value={activeEngagement?.id ?? ""}
            onValueChange={(value) => {
              if (value) setActiveEngagementId(value);
            }}
          >
            <SelectTrigger
              className={cn(
                "h-9 w-full min-w-0 text-sm shadow-soft",
                isSidebar
                  ? "border-white/25 bg-white/12 text-white ring-1 ring-white/10 hover:bg-white/16"
                  : "bg-background",
                !isSidebar && "sm:max-w-xs",
              )}
            >
              <span className="truncate text-left">
                {activeEngagement?.name ?? "Select engagement"}
              </span>
            </SelectTrigger>
            <SelectContent align="start">
              {engagements.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className={cn("text-sm", isSidebar ? "text-white/70" : "text-muted-foreground")}>
            No engagements yet
          </p>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-full justify-start gap-2 px-2 text-xs font-medium",
            isSidebar
              ? "text-white/80 hover:bg-white/10 hover:text-white"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setShowCreate(true)}
        >
          <Plus className="size-3.5" />
          Create engagement
        </Button>
      </div>
    </div>
  );
}
