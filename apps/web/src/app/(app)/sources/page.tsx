import { FileText, FolderGit2, Ticket } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CTAS = [
  {
    icon: FolderGit2,
    title: "Connect Git",
    description: "Ingest code, commits, and history — the structural backbone of memory.",
  },
  {
    icon: Ticket,
    title: "Connect tickets",
    description: "Import Jira, Linear, or GitHub Issues — the why behind past fixes.",
  },
  {
    icon: FileText,
    title: "Upload documents",
    description: "Add runbooks and PDFs — recover lost institutional knowledge.",
  },
];

export default function SourcesPage() {
  return (
    <div>
      <PageHeader
        title="Sources"
        description="Connect data for this engagement. Ingestion and live status ship in Sprint 1."
      />

      <div className="grid gap-4">
        {CTAS.map((cta) => (
          <Card
            key={cta.title}
            className={cn(
              "group transition-all duration-200",
              "hover:border-primary/30 hover:shadow-card",
            )}
          >
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <cta.icon className="size-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{cta.title}</CardTitle>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                    Sprint 1
                  </Badge>
                </div>
                <CardDescription>{cta.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Available after ingestion ships.</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        No sources indexed yet — connect one above to start building memory.
      </p>
    </div>
  );
}
