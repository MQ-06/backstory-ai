import {
  Code2,
  ExternalLink,
  FileText,
  Mic,
  Ticket,
} from "lucide-react";

import type { AskCitation } from "@/lib/api";

export const CITATION_ICON = {
  code: Code2,
  ticket: Ticket,
  doc: FileText,
  commit: Code2,
  interview: Mic,
  text: FileText,
} as const;

export function citationHref(citation: AskCitation): string | null {
  const locator = citation.locator ?? {};
  if (citation.citation_type === "ticket" && typeof locator.url === "string") {
    return locator.url;
  }
  if (citation.citation_type === "code" && typeof locator.path === "string") {
    const line = locator.line_start ? `#L${locator.line_start}` : "";
    const repo = typeof locator.repo_url === "string" ? locator.repo_url : null;
    if (repo) {
      const branch = typeof locator.branch === "string" ? locator.branch : "main";
      return `${repo.replace(/\.git$/, "")}/blob/${branch}/${locator.path}${line}`;
    }
  }
  return null;
}

export function citationHorizon(
  type: AskCitation["citation_type"],
): "past" | "leaving" | "deliver" | null {
  if (type === "interview") return "leaving";
  if (type === "code" || type === "ticket" || type === "doc" || type === "commit") return "past";
  return null;
}
