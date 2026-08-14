import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function SupportReplyForm({ caseId, action }: { caseId: string; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="caseId" value={caseId} />
      <Textarea name="body" rows={3} required placeholder="Add more detail or reply to support…" />
      <Button type="submit" size="sm" className="self-end">
        Send reply
      </Button>
    </form>
  );
}
