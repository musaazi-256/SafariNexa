import { matchesSearchFacets,RATING_FILTER_MIN } from "./search-facets";
it("uses stored property fields and amenities rather than descriptions",()=>{
 const record={location:"Entebbe",facets:{propertyType:"Boutique hotel",amenities:["Free Wi-Fi","Secure parking"]}};
 expect(matchesSearchFacets(record,{propertyType:"hotel",amenities:["wifi","parking"]})).toBe(true);
 expect(matchesSearchFacets(record,{amenities:["pool"]})).toBe(false);
 expect(matchesSearchFacets({location:"Entebbe"},{propertyType:"hotel"})).toBe(false);
});
it("filters tour duration using its stored number of days",()=>{
 expect(matchesSearchFacets({location:"Jinja",facets:{durationDays:5}},{tourDuration:"4-7"})).toBe(true);
 expect(matchesSearchFacets({location:"Jinja",facets:{durationDays:5}},{tourDuration:"8+"})).toBe(false);
});
it("matches actual guide specializations and location",()=>{
 expect(matchesSearchFacets({location:"Jinja",facets:{specialization:"DESTINATION_SPECIALIST"}},{specialty:"destination-specialist",location:"jinja"})).toBe(true);
 expect(matchesSearchFacets({location:"Kampala",facets:{specialization:"GENERAL"}},{specialty:"destination-specialist"})).toBe(false);
});
it("uses the rating minimum printed on each filter",()=>{
 expect(RATING_FILTER_MIN).toEqual({exceptional:4.5,excellent:4,"very-good":3.5});
});
