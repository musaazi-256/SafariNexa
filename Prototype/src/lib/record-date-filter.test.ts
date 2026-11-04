import { recordDateFilter } from "./record-date-filter";
import { updateFilterParams } from "./filter-navigation";

test.each([["7d",7],["30d",30],["90d",90]] as const)("%s uses a rolling creation-date window before pagination",(value,days)=>{
  const now=new Date("2026-11-04T12:00:00Z");
  expect(recordDateFilter(value,now)).toEqual({createdAt:{gte:new Date(now.getTime()-days*86400000),lte:now}});
});
test.each([undefined,"ALL","invalid"])("%s leaves dates unrestricted",value=>expect(recordDateFilter(value)).toEqual({}));
test("changing a facet preserves independent repeated facets and does not mutate its input",()=>{
  const current=new URLSearchParams("q=Nile&amenities=wifi&amenities=pool&page=4&type=TOUR");
  expect(updateFilterParams(current,"status","PUBLISHED").toString()).toBe("q=Nile&amenities=wifi&amenities=pool&type=TOUR&status=PUBLISHED");
  expect(current.get("page")).toBe("4");
});
