import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

interface DashboardPlaceholderPageProps {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function DashboardPlaceholderPage({
  title,
  description,
  emptyTitle,
  emptyDescription,
}: DashboardPlaceholderPageProps) {
  return (
    <div>
      <DashboardPageHeader title={title} description={description} />
      <EmptyState title={emptyTitle} description={emptyDescription} />
    </div>
  );
}
