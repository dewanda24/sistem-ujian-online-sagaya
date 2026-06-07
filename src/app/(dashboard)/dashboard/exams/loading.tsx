export default function ExamsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-[#E2E8F0]" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-32 animate-pulse rounded-xl border border-[#E2E8F0] bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-xl border border-[#E2E8F0] bg-white shadow-sm" />
      </div>
    </div>
  );
}
