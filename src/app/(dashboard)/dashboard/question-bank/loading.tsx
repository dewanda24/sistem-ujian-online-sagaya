export default function QuestionBankLoading() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-36 animate-pulse rounded-lg bg-muted" />
        <div className="h-36 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
