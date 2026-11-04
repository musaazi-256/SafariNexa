import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewSummary({
  average,
  count,
  breakdown
}: {
  average?: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}) {
  if (count === 0) {
    return (
      <div>
        <h2 className="mb-4 text-2xl font-semibold text-brand-green-dark">Reviews</h2>
        <p className="text-muted-foreground">No reviews yet — be the first to share your experience.</p>
      </div>
    );
  }

  const avgScore = average ?? 0;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-brand-green-dark">Reviews</h2>
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-16 lg:gap-32">
        {/* Left Side: Score and Stars */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-3">
            <span className="text-[5rem] leading-none font-semibold text-[#1a202c]">
              {avgScore.toFixed(1)}
            </span>
            <span className="text-xl font-light text-muted-foreground">
              {count} {count === 1 ? "review" : "reviews"}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-12 w-12",
                  star <= Math.round(avgScore)
                    ? "fill-[#FCA81B] text-[#FCA81B]" // Yellow from the screenshot
                    : "fill-[#cbd5e1] text-[#cbd5e1]" // Light grey from the screenshot
                )}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Metrics Breakdown */}
        <div className="flex flex-1 flex-col justify-center gap-4 pt-2">
          {([5, 4, 3, 2, 1] as const).map((rating) => {
            const total = breakdown[rating] ?? 0;
            const pct = count > 0 ? (total / count) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-4 text-sm">
                <span className="w-14 shrink-0 font-semibold text-gray-700">
                  {rating} {rating === 1 ? "star" : "stars"}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
                  <div
                    className="h-full rounded-full bg-[#FCA81B]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-semibold text-gray-600">
                  {total}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
