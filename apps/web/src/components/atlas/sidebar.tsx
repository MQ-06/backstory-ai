"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { EngagementSwitcher } from "@/components/engagement-switcher";
import { ATLAS_NAV, ATLAS_SETTINGS, isNavActive } from "@/components/atlas/nav-config";
import { useEngagement } from "@/components/providers";
import { fetchSources } from "@/lib/api";
import { cn } from "@/lib/utils";

function SidebarLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-amber/20 text-sidebar-foreground shadow-sm ring-1 ring-amber/30"
          : "text-sidebar-foreground/75 hover:bg-white/8 hover:text-sidebar-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-amber" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80",
        )}
      />
      {label}
    </Link>
  );
}

function CoveragePanel() {
  const { getToken } = useAuth();
  const { activeEngagement } = useEngagement();
  const engagementId = activeEngagement?.id;

  const { data: sources = [] } = useQuery({
    queryKey: ["sources", engagementId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !engagementId) return [];
      return fetchSources(token, engagementId);
    },
    enabled: Boolean(engagementId),
  });

  const dataSources = sources.filter((s) => s.type !== "interview");
  const interviews = sources.filter((s) => s.type === "interview");
  const indexed = dataSources.filter((s) => s.status === "indexed").length;
  const total = dataSources.length;
  const pct = total > 0 ? Math.round((indexed / total) * 100) : 0;

  let chunks = 0;
  for (const s of sources) {
    const c = s.config?.chunk_count;
    if (typeof c === "number") chunks += c;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="section-label text-sidebar-foreground/40">Coverage</p>
        <span className="font-mono text-xs font-semibold text-amber">{pct}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-amber transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div>
          <dd className="font-mono text-sm font-semibold text-sidebar-foreground">{total}</dd>
          <dt className="text-[10px] text-sidebar-foreground/45">sources</dt>
        </div>
        <div>
          <dd className="font-mono text-sm font-semibold text-sidebar-foreground">
            {chunks > 0 ? chunks.toLocaleString() : "—"}
          </dd>
          <dt className="text-[10px] text-sidebar-foreground/45">chunks</dt>
        </div>
        <div>
          <dd className="font-mono text-sm font-semibold text-sidebar-foreground">{interviews.length}</dd>
          <dt className="text-[10px] text-sidebar-foreground/45">interviews</dt>
        </div>
      </dl>
    </div>
  );
}

export function AtlasSidebar({ activePath }: { activePath: string }) {
  return (
    <aside className="app-sidebar hidden w-[15.5rem] shrink-0 flex-col border-r border-white/8 lg:flex">
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-5">
        <Link href="/ask" className="flex items-center gap-3">
          <span className="brand-mark size-9 rounded-lg text-lg">B</span>
          <div>
            <span className="font-display text-base leading-tight text-sidebar-foreground">Backstory</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">
              Memory layer
            </span>
          </div>
        </Link>
      </div>

      <div className="border-b border-white/8 px-4 py-4">
        <p className="section-label mb-2 text-sidebar-foreground/40">Engagement</p>
        <EngagementSwitcher variant="sidebar" hideLabel />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4" aria-label="Main">
        <p className="section-label mb-2 px-3 text-sidebar-foreground/40">Workspace</p>
        {ATLAS_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            active={isNavActive(activePath, item.href)}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>

      <div className="border-t border-white/8 px-4 py-4">
        <CoveragePanel />
      </div>

      <div className="border-t border-white/8 p-3">
        <Link
          href={ATLAS_SETTINGS.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isNavActive(activePath, ATLAS_SETTINGS.href)
              ? "bg-white/10 text-sidebar-foreground"
              : "text-sidebar-foreground/55 hover:bg-white/8 hover:text-sidebar-foreground",
          )}
        >
          <ATLAS_SETTINGS.icon className="size-4" />
          {ATLAS_SETTINGS.label}
        </Link>
      </div>
    </aside>
  );
}
