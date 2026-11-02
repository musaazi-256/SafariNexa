"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveTripPlan } from "@/lib/actions/trip-plans";
import { Button } from "@/components/ui/button";
type Item = { customLabel: string; date: string; notes: string };
export function TripPlanEditor({ initial }: { initial: { id?: string; title: string; items: Item[] } }) {
  const [title,setTitle] = useState(initial.title);
  const [items,setItems] = useState(initial.items);
  const [message,setMessage] = useState("");
  const [pending,start] = useTransition();
  const router = useRouter();
  function update(index: number, field: keyof Item, value: string) { setItems(items.map((item,i) => i === index ? {...item,[field]:value} : item)); }
  function add(nextDay = false) {
    let date = items.at(-1)?.date ?? "";
    if (nextDay) { const d = date ? new Date(date) : new Date(); d.setUTCDate(d.getUTCDate()+1); date = d.toISOString().slice(0,10); }
    setItems([...items,{customLabel:"",date,notes:""}]);
  }
  return <main className="container max-w-4xl space-y-6 py-8">
    <Link className="underline" href="/trip-planner">Back to itineraries</Link>
    <form className="space-y-5" onSubmit={e => {e.preventDefault();setMessage("");start(async () => {try {
      const id = await saveTripPlan({id:initial.id,title,items});setMessage("Itinerary saved to your account.");router.replace(`/trip-planner/${id}`);router.refresh();
    } catch {setMessage("Could not save. Enter a title and an activity for each item, then try again.");}});}}>
      <label className="block font-bold">Itinerary title<input className="mt-2 w-full rounded-xl border p-3 text-xl" maxLength={120} required value={title} onChange={e=>setTitle(e.target.value)}/></label>
      <p className="text-sm text-muted-foreground">Planning does not reserve or pay for any activity. Book services separately through the marketplace.</p>
      {items.map((item,index)=><fieldset key={index} className="grid min-w-0 gap-3 rounded-2xl border p-4 sm:grid-cols-2">
        <legend className="px-2 font-semibold">Activity {index+1}</legend>
        <label>Activity<input required maxLength={300} className="mt-1 w-full rounded-lg border p-3" value={item.customLabel} onChange={e=>update(index,"customLabel",e.target.value)}/></label>
        <label>Date<input type="date" className="mt-1 w-full min-w-0 rounded-lg border p-3" value={item.date} onChange={e=>update(index,"date",e.target.value)}/></label>
        <label className="sm:col-span-2">Notes<textarea maxLength={2000} className="mt-1 w-full rounded-lg border p-3" value={item.notes} onChange={e=>update(index,"notes",e.target.value)}/></label>
        <Button type="button" variant="outline" onClick={()=>setItems(items.filter((_,i)=>i!==index))}>Remove activity {index+1}</Button>
      </fieldset>)}
      <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" disabled={items.length>=100} onClick={()=>add()}>Add item</Button><Button type="button" variant="outline" disabled={items.length>=100} onClick={()=>add(true)}>Add another day</Button><Button disabled={pending} type="submit">{pending?"Saving…":"Save itinerary"}</Button>
      <Button type="button" variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText([title,...items.map(i=>`${i.date}: ${i.customLabel}\n${i.notes}`)].join("\n\n"));setMessage("Itinerary copied. Share the copied text with your travel companions.");}catch{setMessage("Clipboard unavailable. Select and copy your itinerary manually.");}}}>Copy itinerary to share</Button></div>
      <p role="status" className="text-sm">{message}</p>
    </form>
  </main>;
}
