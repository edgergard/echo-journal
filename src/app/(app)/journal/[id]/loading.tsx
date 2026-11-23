import { Skeleton } from "@/components/ui/skeleton";

export default function EntryLoading() {
  return (
    <div
      className="mx-auto flex max-w-5xl flex-col gap-6"
      role="status"
      aria-label="Loading entry"
    >
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="h-40 w-full max-w-[68ch]" />
    </div>
  );
}
