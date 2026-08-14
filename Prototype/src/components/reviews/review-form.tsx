import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const RATING_OPTIONS = [
  { value: 5, label: "5 — Excellent" },
  { value: 4, label: "4 — Very good" },
  { value: 3, label: "3 — Average" },
  { value: 2, label: "2 — Poor" },
  { value: 1, label: "1 — Terrible" }
];

export function ReviewForm({
  bookingId,
  listingTitle,
  action
}: {
  bookingId: string;
  listingTitle: string;
  action: (formData: FormData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review {listingTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="bookingId" value={bookingId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rating">Rating</Label>
            <select
              id="rating"
              name="rating"
              defaultValue={5}
              required
              className="flex h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {RATING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title (optional)</Label>
            <Input id="title" name="title" placeholder="Sum up your experience" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body">Your review</Label>
            <Textarea id="body" name="body" rows={5} required placeholder="What stood out, good or bad?" />
          </div>

          <Button type="submit" size="lg">
            Submit review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
