import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

/** ReUI c-spinner-3 · Spinners in badges (in-progress statuses). Uses SafariNexa badge variants. */
export function SpinnerBadges() {
  const rows: Array<[React.ComponentProps<typeof Badge>["variant"], string]> = [["default", "Updating"], ["secondary", "Syncing"], ["outline", "Loading"], ["destructive", "Retrying"], ["success", "Confirming"], ["warning", "Awaiting provider"]];
  return (
    <div className="grid grid-cols-3 gap-4">
      {rows.map(([variant, label]) => (
        <Badge key={label} variant={variant}>
          <Spinner aria-hidden="true" className="h-3 w-3" />
          {label}
        </Badge>
      ))}
    </div>
  );
}
