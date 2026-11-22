import { Skeleton } from "@/components/ui/skeleton";

export default function JournalLoading() {
  return (
    <div
      className="mx-auto max-w-3xl"
      role="status"
      aria-label="Loading your entries"
    >
      <h1 className="mb-8 font-heading text-4xl font-medium">Journal</h1>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
