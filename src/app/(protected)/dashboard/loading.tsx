export default function Loading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-muted h-12 w-12 rounded-xl p-3" />
        <div className="space-y-2">
          <div className="bg-muted h-6 w-48 rounded" />
          <div className="bg-muted h-4 w-72 rounded" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-20 rounded-xl" />
        ))}
      </div>
      <div className="bg-muted h-32 rounded-xl" />
    </div>
  );
}
