"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FulfilmentDetails } from "@/lib/booking-operations";
export function ServiceDetailsFields({prefix,type,initial}: {prefix:string;type:string;initial?:FulfilmentDetails}) {
 const transport=type.toUpperCase()==="TRANSPORT";
 return <fieldset className="my-4 grid min-w-0 gap-3 rounded border p-4 sm:grid-cols-2"><legend className="px-2 font-bold">{transport ? "Transfer details" : "Service requests"}</legend>{(transport ? ["pickup","dropoff","flightNumber","luggage","childSeats","notes"] : ["notes"]).map(key=><div key={key} className="min-w-0"><Label htmlFor={`${prefix}_${key}`}>{({pickup:"Pickup address",dropoff:"Drop-off address",flightNumber:"Flight number (optional)",luggage:"Luggage (optional)",childSeats:"Child seats needed (optional)",notes:"Special requests (not guaranteed until agreed)"} as Record<string,string>)[key]}</Label><Input id={`${prefix}_${key}`} name={`${prefix}_${key}`} maxLength={key==="notes"?2000:250} required={transport && ["pickup","dropoff"].includes(key)} defaultValue={initial?.[key as keyof FulfilmentDetails] || ""}/></div>)}</fieldset>;
}
