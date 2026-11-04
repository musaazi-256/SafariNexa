export type SearchFacets = {propertyType?:string|null;tourType?:string|null;durationDays?:number;vehicleType?:string|null;cuisineType?:string|null;specialization?:string;amenities?:string[]};
export type FacetSelection = {propertyType?:string|string[];tourType?:string|string[];tourDuration?:string|string[];vehicleType?:string|string[];cuisine?:string|string[];specialty?:string|string[];location?:string|string[];amenities?:string|string[]};
const list=(value:string|string[]|undefined)=>value?Array.isArray(value)?value:[value]:[];
const normalized=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]/g,"");
const matches=(stored:string|null|undefined,selected:string[])=>!selected.length||Boolean(stored&&selected.some(value=>normalized(stored).includes(normalized(value))));
/** Match actual category fields, never infer amenities or category from marketing copy. */
export function matchesSearchFacets(record:{location:string;facets?:SearchFacets},selection:FacetSelection) {
 const facets=record.facets??{};
 if(!matches(facets.propertyType,list(selection.propertyType))||!matches(facets.tourType,list(selection.tourType))||!matches(facets.vehicleType,list(selection.vehicleType))||!matches(facets.cuisineType,list(selection.cuisine))||!matches(facets.specialization,list(selection.specialty))||!matches(record.location,list(selection.location)))return false;
 const durations=list(selection.tourDuration);
 if(durations.length&&!durations.some(value=>facets.durationDays!==undefined&&(value==="1-3"?facets.durationDays>=1&&facets.durationDays<=3:value==="4-7"?facets.durationDays>=4&&facets.durationDays<=7:value==="8+"?facets.durationDays>=8:false)))return false;
 return list(selection.amenities).every(value=>(facets.amenities??[]).some(amenity=>normalized(amenity).includes(normalized(value))));
}
export const RATING_FILTER_MIN = {exceptional:4.5,excellent:4,"very-good":3.5} as const;
