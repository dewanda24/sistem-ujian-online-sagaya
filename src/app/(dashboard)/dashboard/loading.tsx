export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-36 animate-pulse rounded-lg bg-muted" />
        <div className="h-36 animate-pulse rounded-lg bg-muted" />
        <div className="h-36 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
