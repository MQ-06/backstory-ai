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
import { cn } from "@/lib/utils";

export function EngagementSwitcher() {
  const { engagements, activeEngagement, setActiveEngagementId, createNew, isLoading } =
    useEngagement();
  const [name, setName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-52" />
      </div>
    );
  }

  if (showCreate) {
    return (
      <form
        className="flex min-w-0 max-w-xl flex-1 items-center gap-2"
        onSubmit={async (ev) => {
          ev.preventDefault();
          if (!name.trim()) return;
          setCreating(true);
          try {
            await createNew(name.trim());
            setName("");
            setShowCreate(false);
          } finally {
            setCreating(false);
          }
        }}
      >
        <span className="hidden shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:inline">
          New engagement
        </span>
        <Input
          className="h-9 min-w-0 flex-1"
          placeholder="Client or system name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Button type="submit" size="sm" disabled={creating || !name.trim()}>
          <Check className="size-3.5" />
          {creating ? "Creating…" : "Create"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => {
            setShowCreate(false);
            setName("");
          }}
          disabled={creating}
          aria-label="Cancel"
        >
          <X className="size-4" />
        </Button>
      </form>
    );
  }

  return (
    <div className="flex min-w-0 max-w-md flex-1 items-center gap-2">
      <span className="hidden shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:inline">
        Engagement
      </span>

      {engagements.length > 0 ? (
        <Select
          value={activeEngagement?.id ?? ""}
          onValueChange={(value) => {
            if (value) setActiveEngagementId(value);
          }}
        >
          <SelectTrigger
            className={cn(
              "h-9 min-w-0 flex-1 gap-2 bg-background sm:max-w-xs",
              "data-[size=default]:h-9",
            )}
          >
            <span className="truncate text-left text-sm">
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
        <span className="text-sm text-muted-foreground">No engagements yet</span>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => setShowCreate(true)}
      >
        <Plus className="size-3.5" />
        <span className="hidden sm:inline">New</span>
      </Button>
    </div>
  );
}
