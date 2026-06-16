import {
  ClerkLoaded,
  OrganizationSwitcher,
  UserButton,
} from "@clerk/nextjs";
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Mic,
  Settings,
} from "lucide-react";
import Link from "next/link";

import { EngagementSwitcher } from "@/components/engagement-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/ask", label: "Ask", icon: MessageSquare },
  { href: "/sources", label: "Sources", icon: LayoutDashboard },
  { href: "/interviews", label: "Interviews", icon: Mic },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function AppShell({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath: string;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="border-b border-sidebar-border px-5 py-5">
          <Link href="/ask" className="group block">
            <p className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground">
              Backstory
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground transition-colors group-hover:text-sidebar-foreground/80">
              Remembers why
            </p>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className={cn("size-4", active ? "opacity-100" : "opacity-70")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-muted-foreground">MVP · Features 1–10</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <ClerkLoaded>
            <div className="min-w-0 flex-1">
              <EngagementSwitcher />
            </div>
          </ClerkLoaded>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Separator orientation="vertical" className="mx-1 h-6" />
            <OrganizationSwitcher
              hidePersonal
              appearance={{
                elements: {
                  rootBox: "flex items-center",
                  organizationSwitcherTrigger:
                    "rounded-lg border border-border px-2.5 py-1.5 text-sm",
                },
              }}
            />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8",
                },
              }}
            />
          </div>
        </header>
        <main className="bg-grid flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
