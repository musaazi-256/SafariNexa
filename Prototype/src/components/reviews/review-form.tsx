"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";

const RATING_LABELS: Record<number, string> = { 1: "Terrible", 2: "Poor", 3: "Average", 4: "Very good", 5: "Excellent" };
const MIN_BODY = 20;
const MAX_BODY = 2000;

export function ReviewForm({
  bookingId,
  listingTitle,
  action
}: {
  bookingId: string;
  listingTitle: string;
  action: (formData: FormData) => void;
}) {
  const [rating, setRating] = React.useState(0);
  const [body, setBody] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const bodyLength = body.trim().length;
  const ratingMissing = rating === 0;
  const bodyShort = bodyLength < MIN_BODY;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review {listingTitle}</CardTitle>
        <CardDescription>Your review is published with your account name and helps other travellers choose.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          noValidate
          onSubmit={(event) => {
            if (ratingMissing || bodyShort) {
              event.preventDefault();
              setTried(true);
            }
          }}
          className="flex flex-col gap-6"
        >
          <input type="hidden" name="bookingId" value={bookingId} />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">How would you rate your experience?</legend>
            <div className="flex flex-wrap items-center gap-3">
              <StarRating editable size="lg" rating={rating} onRatingChange={setRating} name="rating" required label="Overall rating" />
              <span aria-live="polite" className="text-sm font-medium text-muted-foreground">{rating ? RATING_LABELS[rating] : "Tap a star to rate"}</span>
            </div>
            {tried && ratingMissing && <p role="alert" className="text-sm text-destructive">Choose a star rating.</p>}
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title (optional)</Label>
            <Input id="title" name="title" maxLength={120} placeholder="Sum up your experience" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body">Your review</Label>
            <Textarea
              id="body"
              name="body"
              rows={6}
              required
              maxLength={MAX_BODY}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              aria-describedby="body-help"
              aria-invalid={tried && bodyShort}
              placeholder="What stood out, good or bad? Think about the welcome, cleanliness, value and location."
            />
            <div id="body-help" className="flex justify-between gap-3 text-xs text-muted-foreground">
              <span className={tried && bodyShort ? "text-destructive" : undefined}>{bodyShort ? `At least ${MIN_BODY} characters (${MIN_BODY - bodyLength} to go)` : "Looks good"}</span>
              <span className="tabular-nums">{body.length}/{MAX_BODY}</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">Keep it honest and about your own visit. Don&apos;t include phone numbers or personal details. The business can reply publicly, and SafariNexa may hide reviews that break the guidelines.</p>

          <Button type="submit" size="lg">Submit review</Button>
        </form>
      </CardContent>
    </Card>
  );
}
