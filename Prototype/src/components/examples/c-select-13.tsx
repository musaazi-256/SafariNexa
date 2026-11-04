import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statuses = [{ label: "All", value: "all" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }];

/** ReUI c-select-13 · Select inline with an input (search + filter). */
export function SearchWithSelect() {
  return (
    <div className="flex w-full max-w-sm items-center gap-2">
      <Input placeholder="Search listings…" aria-label="Search listings" className="flex-1" />
      <Select defaultValue="all">
        <SelectTrigger aria-label="Status" className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectGroup>{statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
