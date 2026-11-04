import { Skeleton } from "@/components/ui/skeleton";

/** shadcn skeleton demo: avatar + two lines while content loads. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}
