"use client";

import Link from "next/link";

import { ATLAS_NAV, ATLAS_SETTINGS, isNavActive } from "@/components/atlas/nav-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function NavIconLink({
  href,
  active,
  label,
  description,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            aria-current={active ? "page" : undefined}
            aria-label={label}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="right" className={description ? "max-w-[10rem]" : undefined}>
        {description ? (
          <>
            <p className="font-medium">{label}</p>
            <p className="opacity-80">{description}</p>
          </>
        ) : (
          label
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function AtlasIconRail({ activePath }: { activePath: string }) {
  return (
    <aside className="hidden w-[4.25rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 shadow-rail backdrop-blur-xl lg:flex">
      <div className="flex h-14 items-center justify-center border-b border-sidebar-border">
        <Link
          href="/ask"
          className="marketing-logo-mark flex size-10 items-center justify-center rounded-xl text-base font-extrabold text-white"
          aria-label="Backstory home"
        >
          B
        </Link>
      </div>
      <nav className="flex flex-1 flex-col items-center gap-1 p-2" aria-label="Main">
        {ATLAS_NAV.map((item) => {
          const active = isNavActive(activePath, item.href);
          return (
            <NavIconLink
              key={item.href}
              href={item.href}
              active={active}
              label={item.label}
              description={item.description}
            >
              <item.icon className="size-5" />
            </NavIconLink>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-2">
        <NavIconLink
          href={ATLAS_SETTINGS.href}
          active={isNavActive(activePath, ATLAS_SETTINGS.href)}
          label={ATLAS_SETTINGS.label}
        >
          <ATLAS_SETTINGS.icon className="size-5" />
        </NavIconLink>
      </div>
    </aside>
  );
}
