"use client";

import { useAuth } from "@clerk/nextjs";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { createEngagement, deleteEngagement, fetchEngagements, type Engagement } from "@/lib/api";

const ENGAGEMENT_STORAGE_KEY = "backstory:active-engagement-id";

const EngagementContext = createContext<{
  activeEngagement: Engagement | null;
  setActiveEngagementId: (id: string) => void;
  engagements: Engagement[];
  isLoading: boolean;
  isError: boolean;
  loadError: string | null;
  retryLoad: () => void;
  createNew: (name: string) => Promise<void>;
  deleteActive: () => Promise<void>;
} | null>(null);

function EngagementProviderInner({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setActiveId(localStorage.getItem(ENGAGEMENT_STORAGE_KEY));
  }, []);

  const { data: engagements = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["engagements"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return [];
      return fetchEngagements(token);
    },
    retry: 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!activeId && engagements.length > 0) {
      const first = engagements[0].id;
      setActiveId(first);
      localStorage.setItem(ENGAGEMENT_STORAGE_KEY, first);
    }
  }, [engagements, activeId]);

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createEngagement(token, name);
    },
    onSuccess: (engagement) => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
      setActiveId(engagement.id);
      localStorage.setItem(ENGAGEMENT_STORAGE_KEY, engagement.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (engagementId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await deleteEngagement(token, engagementId);
      return engagementId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Engagement[]>(["engagements"], (old) =>
        old?.filter((e) => e.id !== deletedId) ?? [],
      );
      const remaining = queryClient.getQueryData<Engagement[]>(["engagements"]) ?? [];
      queryClient.removeQueries({ queryKey: ["sources", deletedId] });
      queryClient.removeQueries({ queryKey: ["engagement-stats", deletedId] });
      if (activeId === deletedId) {
        const nextId = remaining[0]?.id ?? null;
        setActiveId(nextId);
        if (nextId) {
          localStorage.setItem(ENGAGEMENT_STORAGE_KEY, nextId);
        } else {
          localStorage.removeItem(ENGAGEMENT_STORAGE_KEY);
        }
      }
    },
  });

  const activeEngagement = engagements.find((e) => e.id === activeId) ?? null;

  return (
    <EngagementContext.Provider
      value={{
        activeEngagement,
        setActiveEngagementId: (id) => {
          setActiveId(id);
          localStorage.setItem(ENGAGEMENT_STORAGE_KEY, id);
        },
        engagements,
        isLoading,
        isError,
        loadError: isError && error instanceof Error ? error.message : isError ? "Could not load engagements" : null,
        retryLoad: () => {
          void refetch();
        },
        createNew: async (name) => {
          await createMutation.mutateAsync(name);
        },
        deleteActive: async () => {
          if (!activeId) throw new Error("No engagement selected");
          await deleteMutation.mutateAsync(activeId);
        },
      }}
    >
      {children}
    </EngagementContext.Provider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <EngagementProviderInner>{children}</EngagementProviderInner>
    </QueryClientProvider>
  );
}

export function useEngagement() {
  const ctx = useContext(EngagementContext);
  if (!ctx) throw new Error("useEngagement must be used within AppProviders");
  return ctx;
}
