import {
  BookOpen,
  FolderInput,
  MessageSquare,
  Mic,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type AtlasNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
};

export const ATLAS_NAV: AtlasNavItem[] = [
  {
    href: "/ask",
    label: "Ask",
    shortLabel: "Ask",
    icon: MessageSquare,
    description: "Query memory with receipts",
  },
  {
    href: "/sources",
    label: "Sources",
    shortLabel: "Sources",
    icon: FolderInput,
    description: "Connect git, tickets, docs",
  },
  {
    href: "/interviews",
    label: "Capture",
    shortLabel: "Capture",
    icon: Mic,
    description: "Briefs and interviews",
  },
  {
    href: "/library",
    label: "Library",
    shortLabel: "Library",
    icon: BookOpen,
    description: "Saved receipts & history",
  },
];

export const ATLAS_SETTINGS = {
  href: "/admin",
  label: "Settings",
  icon: Settings,
} as const;

export function isNavActive(activePath: string, href: string): boolean {
  return activePath === href || activePath.startsWith(`${href}/`);
}
