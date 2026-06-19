import { WorkspaceHeader } from "@/components/workspace-header";
import { AdminPageClient } from "@/components/admin-page-client";

export default function AdminPage() {
  return (
    <div>
      <WorkspaceHeader
        eyebrow="Organization"
        title="Settings"
        description="Engagement source health and organization settings."
      />
      <AdminPageClient />
    </div>
  );
}
