import { Mic, ScrollText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InterviewsPage() {
  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Archaeology Brief and Interview Studio — capture expert knowledge with timestamped video."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <ScrollText className="size-4 text-primary" />
              <CardTitle className="text-base">Archaeology Brief</CardTitle>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                Sprint 3
              </Badge>
            </div>
            <CardDescription>
              System studies the codebase and generates questions only the expert can answer.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Mic className="size-4 text-primary" />
              <CardTitle className="text-base">Interview Studio</CardTitle>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                Sprint 3
              </Badge>
            </div>
            <CardDescription>
              Record code-aware sessions; every explanation time-coded and linkable.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <EmptyState
        icon={Mic}
        title="Generate an Archaeology Brief to begin"
        description="Once sources are connected, Backstory will study risk signals and prepare targeted questions for your departing experts."
      />
    </div>
  );
}
