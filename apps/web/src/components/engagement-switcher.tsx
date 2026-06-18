"use client";

import { Check, Plus, X } from "lucide-react";
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

export function EngagementSwitcher({ variant = "sidebar" }: { variant?: "sidebar" | "inline" }) {
  const { engagements, activeEngagement, setActiveEngagementId, createNew, isLoading } =
    useEngagement();
  const [name, setName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-full" />
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
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          New engagement
        </p>
        <Input
          className="h-9 border-white/15 bg-white/10 text-sm text-white placeholder:text-white/40"
          placeholder="Client or system name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="h-8 flex-1 bg-amber text-ink hover:bg-amber/90" disabled={creating || !name.trim()}>
            <Check className="size-3.5" />
            {creating ? "Creating…" : "Create"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
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
        {createError ? <p className="text-xs text-red-300">{createError}</p> : null}
      </form>
    );
  }

  const isSidebar = variant === "sidebar";

  return (
    <div className={cn(isSidebar ? "space-y-2" : "flex min-w-0 flex-1 items-center gap-2")}>
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.14em]",
          isSidebar ? "text-white/45" : "text-muted-foreground",
        )}
      >
        Engagement
      </p>

      <div className={cn("flex gap-2", isSidebar ? "flex-col sm:flex-row" : "min-w-0 flex-1")}>
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
                  ? "border-white/15 bg-white/10 text-white"
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
          <p className={cn("text-sm", isSidebar ? "text-white/60" : "text-muted-foreground")}>
            No engagements yet
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-9 shrink-0",
            isSidebar && "w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto",
          )}
          onClick={() => setShowCreate(true)}
        >
          <Plus className="size-3.5" />
          New
        </Button>
      </div>
    </div>
  );
}
