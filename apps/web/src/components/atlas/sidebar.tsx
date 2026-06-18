"use client";

import Link from "next/link";

import { EngagementSwitcher } from "@/components/engagement-switcher";
import { ATLAS_NAV, ATLAS_SETTINGS, isNavActive } from "@/components/atlas/nav-config";
import { cn } from "@/lib/utils";

function SidebarLink({
  href,
  active,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
        active
          ? "bg-primary/25 text-white shadow-sm ring-1 ring-primary/40"
          : "text-white/80 hover:bg-white/8 hover:text-white",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-primary text-white"
            : "bg-white/10 text-white/70 group-hover:bg-primary/20 group-hover:text-white",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight">{label}</span>
        <span
          className={cn(
            "mt-0.5 block text-[11px] leading-snug",
            active ? "text-white/70" : "text-white/45 group-hover:text-white/60",
          )}
        >
          {description}
        </span>
      </span>
    </Link>
  );
}

export function AtlasSidebar({ activePath }: { activePath: string }) {
  return (
    <aside className="app-sidebar hidden w-[17rem] shrink-0 flex-col border-r border-white/10 lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <Link href="/ask" className="flex items-center gap-3">
          <span className="marketing-logo-mark flex size-10 items-center justify-center rounded-xl text-base font-bold text-white">
            B
          </span>
          <div>
            <span className="block text-sm font-bold tracking-tight text-white">Backstory</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">
              Memory workspace
            </span>
          </div>
        </Link>
      </div>

      <div className="border-b border-white/10 px-4 py-4">
        <EngagementSwitcher variant="sidebar" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Main">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
          Workspace
        </p>
        {ATLAS_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            active={isNavActive(activePath, item.href)}
            icon={item.icon}
            label={item.label}
            description={item.description}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href={ATLAS_SETTINGS.href}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            isNavActive(activePath, ATLAS_SETTINGS.href)
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/8 hover:text-white",
          )}
        >
          <ATLAS_SETTINGS.icon className="size-4" />
          {ATLAS_SETTINGS.label}
        </Link>
      </div>
    </aside>
  );
}
