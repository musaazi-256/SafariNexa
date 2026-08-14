import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewReplyForm({ reviewId, action }: { reviewId: string; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <Textarea name="businessReplyBody" rows={3} required placeholder="Write a reply visible to this customer and other guests…" />
      <Button type="submit" size="sm" className="self-end">
        Post reply
      </Button>
    </form>
  );
}
