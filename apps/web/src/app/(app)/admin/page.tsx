import { Building2, Shield, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS = [
  {
    icon: Users,
    title: "Members & roles",
    description: "Manage team access via Clerk. Role-based app permissions expand in later sprints.",
  },
  {
    icon: Building2,
    title: "Engagement settings",
    description: "Per-client configuration, retention, and data export — coming after MVP hardening.",
  },
  {
    icon: Shield,
    title: "Audit log",
    description: "Who ingested, asked, or exported — tenant-scoped audit events from Sprint 0 API.",
  },
];

export default function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Admin"
        description="Organization settings, engagement data, and audit — expanded across upcoming sprints."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted">
                <section.icon className="size-4 text-primary" />
              </div>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Placeholder · Sprint 0</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
