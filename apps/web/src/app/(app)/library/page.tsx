import { Library } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function LibraryPage() {
  return (
    <div>
      <PageHeader
        title="Library"
        description="Browse code, tickets, documents, and transcripts — populated after Sprint 1 ingestion."
      />
      <EmptyState
        icon={Library}
        title="Your knowledge base is empty"
        description="Connect sources on the Sources page. Indexed content will appear here for exploration and linking."
      />
    </div>
  );
}
