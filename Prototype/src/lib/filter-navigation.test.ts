import { updateFilterParams } from "./filter-navigation";

test("switching one facet preserves search, sorting, and independent facets",()=>{
  expect(updateFilterParams(new URLSearchParams("q=Nile&type=TOUR&status=DRAFT&sort=newest&page=4"),"status","PUBLISHED").toString()).toBe("q=Nile&type=TOUR&status=PUBLISHED&sort=newest");
});
test("clearing one facet keeps independent choices and resets pagination",()=>{
  expect(updateFilterParams(new URLSearchParams("q=Nile&type=TOUR&status=DRAFT&page=4"),"status").toString()).toBe("q=Nile&type=TOUR");
});
