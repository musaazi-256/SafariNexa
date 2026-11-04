import { Field, FieldLabel } from "@/components/ui/field";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const modes = [
  { value: "REQUEST", name: "Request to book", description: "You accept each request before the guest pays." },
  { value: "INSTANT", name: "Instant booking", description: "Payment confirms the booking straight away." }
];

function ModeItem({ mode }: { mode: (typeof modes)[number] }) {
  return (
    <Item size="xs" className="w-full p-0">
      <ItemContent className="gap-0">
        <ItemTitle>{mode.name}</ItemTitle>
        <ItemDescription className="text-xs">{mode.description}</ItemDescription>
      </ItemContent>
    </Item>
  );
}

/** ReUI c-select-6 · Select with a title + description per option (plan style). */
export function DescribedSelect() {
  return (
    <Field className="max-w-xs">
      <FieldLabel htmlFor="booking-mode">Booking mode</FieldLabel>
      <Select name="bookingMode" defaultValue="REQUEST">
        <SelectTrigger id="booking-mode" className="h-auto min-h-11 w-full py-2 text-left">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {modes.map((mode) => <SelectItem key={mode.value} value={mode.value}><ModeItem mode={mode} /></SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
