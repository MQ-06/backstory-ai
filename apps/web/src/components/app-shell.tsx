import { AtlasShell } from "@/components/atlas/shell";

export function AppShell({
  children,
  activePath,
  workspace = "default",
}: {
  children: React.ReactNode;
  activePath: string;
  workspace?: "default" | "full";
}) {
  return (
    <AtlasShell activePath={activePath} workspace={workspace}>
      {children}
    </AtlasShell>
  );
}
