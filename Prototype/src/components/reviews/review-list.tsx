import { Star } from "lucide-react";

export type ReviewListItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: Date;
  authorName: string | null;
  businessReplyBody: string | null;
};

export function ReviewList({ reviews }: { reviews: ReviewListItem[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col gap-6">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-3xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <h4 className="text-lg font-bold text-gray-800">
              {review.authorName ?? "Verified guest"}
            </h4>
            <div className="flex items-center gap-1.5 font-bold">
              <Star className="h-4 w-4 fill-[#FCA81B] text-[#FCA81B]" />
              <span className="text-sm">{review.rating}</span>
            </div>
          </div>
          
          {review.title ? <p className="mt-1 font-semibold">{review.title}</p> : null}
          
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
            {review.body}
          </p>
          
          <p className="mt-1.5 text-sm text-gray-400">
            {review.createdAt.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
          </p>
          
          {review.businessReplyBody ? (
            <div className="mt-5 rounded-2xl bg-[#F8F9FA] p-5">
              <p className="font-bold text-gray-700">Business response</p>
              <p className="mt-2 text-[15px] text-gray-600 leading-relaxed">
                {review.businessReplyBody}
              </p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
