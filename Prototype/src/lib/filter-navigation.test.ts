import { filterHref } from "./filter-navigation";
it("preserves a search and sort when changing status, but resets the page",()=>{
 expect(filterHref("/business/reviews?status=published",new URLSearchParams("q=guide&sort=highest&page=4&status=pending"))).toBe("/business/reviews?status=published&q=guide&sort=highest");
});
it("allows All to clear the old status without clearing the search",()=>{
 expect(filterHref("/admin/bookings",new URLSearchParams("q=Nile&status=cancelled&page=2"))).toBe("/admin/bookings?q=Nile");
});
