export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-64 max-w-full animate-pulse rounded-xl bg-[#E2E8F0]" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-xl bg-[#E2E8F0]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-xl border border-[#E2E8F0] bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-xl border border-[#E2E8F0] bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-xl border border-[#E2E8F0] bg-white shadow-sm" />
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-[#E2E8F0] bg-white shadow-sm" />
    </div>
  );
}
