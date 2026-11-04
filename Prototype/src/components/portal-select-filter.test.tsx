import { PortalSelectFilter } from "./portal-select-filter";
import { RecordFilter } from "./record-filter";

it("keeps old imports on the shared shadcn filter implementation", () => {
  expect(PortalSelectFilter).toBe(RecordFilter);
});
