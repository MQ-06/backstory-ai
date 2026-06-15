"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { useEngagement } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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
        <Skeleton className="h-8 w-44" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Engagement
      </span>
      {engagements.length > 0 ? (
        <Select
          value={activeEngagement?.id ?? ""}
          onValueChange={(value) => {
            if (value) setActiveEngagementId(value);
          }}
        >
          <SelectTrigger className="h-8 w-[min(100%,220px)] bg-background">
            <SelectValue placeholder="Select engagement" />
          </SelectTrigger>
          <SelectContent>
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
      {showCreate ? (
        <form
          className="flex flex-wrap items-center gap-2"
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
          <Input
            className="h-8 w-48"
            placeholder="Client / system name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Button type="submit" size="sm" disabled={creating}>
            {creating ? "Creating…" : "Create"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCreate(false)}
            disabled={creating}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="size-3.5" />
          New
        </Button>
      )}
    </div>
  );
}
