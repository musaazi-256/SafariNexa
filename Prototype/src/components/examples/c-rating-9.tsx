"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";

/** ReUI c-rating-9 · Rating with review text. `name` props make it submit with a server-action form. */
export function WriteReviewCard() {
  const [rating, setRating] = useState(0);
  return (
    <Card className="w-full max-w-xs">
      <CardContent className="space-y-5 pt-6">
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-sm font-semibold">Write a review</h3>
          <StarRating rating={rating} onRatingChange={setRating} editable name="rating" label="Your rating" required />
          {rating > 0 ? <p className="text-xs text-muted-foreground" aria-live="polite">{rating <= 2 ? "We're sorry to hear that" : rating <= 3 ? "Thanks for your feedback" : "Glad you enjoyed it!"}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-text">Your review</Label>
          <Textarea id="review-text" name="body" placeholder="Tell other travellers about your stay…" rows={3} />
        </div>
        <Button disabled={rating === 0} size="sm" className="w-full">Submit review</Button>
      </CardContent>
    </Card>
  );
}
