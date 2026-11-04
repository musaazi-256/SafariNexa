import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/ui/star-rating";

const distribution = [
  { stars: 5, count: 124, percentage: 62 },
  { stars: 4, count: 45, percentage: 22 },
  { stars: 3, count: 18, percentage: 9 },
  { stars: 2, count: 8, percentage: 4 },
  { stars: 1, count: 5, percentage: 3 }
];

/** ReUI c-rating-6 · Rating with review summary (listing detail page). */
export function RatingSummary() {
  return (
    <div className="w-full max-w-xs space-y-4">
      <div className="flex flex-col items-center gap-2">
        <span className="text-3xl font-semibold">4.6</span>
        <StarRating rating={4.6} size="sm" />
        <span className="text-xs text-muted-foreground">Based on 200 verified reviews</span>
      </div>
      <Separator />
      <div className="space-y-2">
        {distribution.map((row) => (
          <div key={row.stars} className="flex items-center gap-3 text-sm">
            <span className="w-3 text-right text-xs text-muted-foreground">{row.stars}</span>
            <Progress value={row.percentage} aria-label={`${row.stars} star reviews`} className="h-1.5 flex-1 bg-slate-100" indicatorClassName="bg-amber-400" />
            <span className="w-7 text-right text-xs tabular-nums text-muted-foreground">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
