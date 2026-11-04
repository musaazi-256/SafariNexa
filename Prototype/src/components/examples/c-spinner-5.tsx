import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

/** ReUI c-spinner-5 · Spinner in an empty state (loading a list). */
export function LoadingEmptyState() {
  return (
    <Empty className="min-h-[300px] w-full max-w-md">
      <EmptyHeader>
        <EmptyMedia variant="icon"><Spinner aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Loading bookings</EmptyTitle>
        <EmptyDescription>Please wait while we fetch your bookings. This should only take a moment.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><Button variant="outline" disabled>Cancel</Button></EmptyContent>
    </Empty>
  );
}
