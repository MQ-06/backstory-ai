import { AtlasMobileNav } from "@/components/atlas/mobile-nav";
import { AtlasSidebar } from "@/components/atlas/sidebar";
import { AtlasTopBar } from "@/components/atlas/top-bar";
import { cn } from "@/lib/utils";

export function AtlasShell({
  children,
  activePath,
  workspace = "default",
}: {
  children: React.ReactNode;
  activePath: string;
  workspace?: "default" | "full";
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AtlasSidebar activePath={activePath} />
      <div className="flex min-w-0 flex-1 flex-col pb-[4.25rem] lg:pb-0">
        <AtlasTopBar />
        <main className="app-workspace flex-1 overflow-auto">
          <div
            className={cn(
              "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8",
              workspace === "full" ? "max-w-workspace" : "max-w-6xl",
            )}
          >
            {children}
          </div>
        </main>
      </div>
      <AtlasMobileNav activePath={activePath} />
    </div>
  );
}
