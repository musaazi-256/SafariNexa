export type FilterOption = {value:string;label:string};
export type PortalFilterField = {name:string;label:string;options:FilterOption[]};
const options=(values:string[]):FilterOption[]=>values.map(value=>({value:value.toLowerCase(),label:value.charAt(0)+value.slice(1).toLowerCase().replaceAll("_"," ")}));
export const PORTAL_FILTER_FIELDS: Record<string,PortalFilterField[]> = {
  "/admin/bookings":[{name:"status",label:"Booking status",options:options(["AWAITING_CONFIRMATION","CONFIRMED","COMPLETED","CANCELLED"])}],
  "/admin/businesses":[{name:"status",label:"Verification status",options:options(["NOT_STARTED","DRAFT","SUBMITTED","UNDER_REVIEW","NEEDS_CHANGES","APPROVED","REJECTED","SUSPENDED"])}],
  "/admin/users":[{name:"role",label:"Account role",options:options(["CUSTOMER","BUSINESS_OWNER","BUSINESS_STAFF","ADMIN","SUPER_ADMIN"])}],
  "/admin/payments":[{name:"status",label:"Payment status",options:options(["SUCCESSFUL","PROCESSING","FAILED","REFUNDED"])}],
  "/business/bookings":[{name:"status",label:"Booking status",options:options(["AWAITING_BUSINESS_CONFIRMATION","PENDING_PAYMENT","CONFIRMED","COMPLETED","CANCELLED"])}],
  "/business/listings":[{name:"type",label:"Listing type",options:options(["ACCOMMODATION","TOUR","RESTAURANT","TRANSPORT"])}],
  "/business/reviews":[{name:"status",label:"Review status",options:options(["PENDING","PUBLISHED","HIDDEN","FLAGGED"])},{name:"sort",label:"Sort reviews",options:[{value:"newest",label:"Newest first"},{value:"highest",label:"Highest rating"},{value:"lowest",label:"Lowest rating"}]}]
};
