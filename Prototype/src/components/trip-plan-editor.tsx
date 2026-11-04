"use client";

import { PageHeader } from "@/components/page-header";
import { useAsyncTask } from "@/hooks/use-async-task";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GripVertical, Plus, MapPin } from "lucide-react";
import { saveTripPlan } from "@/lib/actions/trip-plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Item = { customLabel: string; date: string; notes: string };
export function TripPlanEditor({ initial }: { initial: { id?: string; title: string; items: Item[] } }) {
  const [title,setTitle] = useState(initial.title);
  const [items,setItems] = useState(initial.items);
  const [editing,setEditing] = useState<number|null>(null);
  const [message,setMessage] = useState("");
  const [pending,start] = useAsyncTask();
  const router = useRouter();
  const days = [...new Set(items.map(item=>item.date))];
  function update(index: number, field: keyof Item, value: string) { setItems(items.map((item,i) => i === index ? {...item,[field]:value} : item)); }
  function add(date = "", nextDay = false) {
    if (items.length >= 100) return;
    if (nextDay) { const d = items.at(-1)?.date ? new Date(items.at(-1)!.date) : new Date(); d.setUTCDate(d.getUTCDate()+1); date = d.toISOString().slice(0,10); }
    setEditing(items.length);
    setItems([...items,{customLabel:"",date,notes:""}]);
  }
  async function share() {
    try {await navigator.clipboard.writeText([title,...items.map(i=>`${i.date}: ${i.customLabel}\n${i.notes}`)].join("\n\n"));setMessage("Itinerary copied. Share the copied text with your travel companions.");}
    catch {setMessage("Clipboard unavailable. Select and copy your itinerary manually.");}
  }
  return <form onSubmit={e=>{e.preventDefault();setMessage("");start(async()=>{try{const id=await saveTripPlan({id:initial.id,title,items});setMessage("Itinerary saved to your account.");router.replace(`/trip-planner/${id}`);router.refresh();}catch{setMessage("Could not save. Enter a title and an activity for each item, then try again.");}});}}>
    <div className="border-b bg-background">
      <div className="container flex flex-col items-stretch justify-between gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:gap-4 sm:py-0">
        <div className="flex min-w-0 flex-1 items-center gap-4"><Button type="button" variant="ghost" size="icon" asChild><Link href="/trip-planner" aria-label="Back to itineraries"><ArrowLeft className="h-4 w-4"/></Link></Button><Input aria-label="Itinerary title" value={title} maxLength={120} required onChange={e=>setTitle(e.target.value)} className="text-lg font-semibold border-transparent px-0 hover:border-input focus:border-input focus-visible:ring-0 min-w-0 flex-1 sm:max-w-80 bg-transparent"/></div>
        <div className="flex shrink-0 items-center justify-end gap-2"><Button type="button" variant="outline" onClick={share}>Share</Button><Button loading={pending} type="submit">{pending?"Saving…":"Save Itinerary"}</Button></div>
      </div>
    </div>
    <main className="container py-8 max-w-4xl">
      <div className="space-y-8">
        <PageHeader title="Trip itinerary" description="Organize your itinerary, dates, and notes." />
        {days.map((date,day)=><div key={date} className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Day {day+1}</h2><Button type="button" variant="ghost" size="sm" disabled={items.length>=100} onClick={()=>add(date)}><Plus className="mr-2 h-4 w-4"/>Add Item</Button></div>
          <div className="space-y-3">{items.map((item,index)=>item.date!==date?null:<Card key={index} className="group"><CardContent className="p-4">
            <div className="flex items-center gap-4"><GripVertical className="h-5 w-5 text-muted-foreground opacity-50 group-hover:opacity-100" aria-hidden="true"/><div className="flex w-24 shrink-0 flex-col items-center justify-center rounded-md bg-muted px-2 py-1 text-sm font-medium">{item.date || "Date TBD"}</div><div className="flex-1 min-w-0"><p className="font-medium">{item.customLabel || "New activity"}</p><div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center"><MapPin className="mr-1 h-3 w-3"/>{item.notes || "Activity"}</span></div></div><Button type="button" variant="ghost" size="sm" onClick={()=>setEditing(editing===index?null:index)}>Edit</Button></div>
            {editing===index&&<div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2"><label className="text-sm font-medium">Activity<Input required maxLength={300} value={item.customLabel} onChange={e=>update(index,"customLabel",e.target.value)}/></label><label className="text-base md:text-sm font-medium">Date<Input type="date" value={item.date} onChange={e=>update(index,"date",e.target.value)}/></label><label className="text-base md:text-sm font-medium sm:col-span-2">Notes<Textarea maxLength={2000} value={item.notes} onChange={e=>update(index,"notes",e.target.value)}/></label><div className="flex gap-2 sm:col-span-2"><Button type="button" size="sm" variant="outline" onClick={()=>setEditing(null)}>Done</Button><Button type="button" size="sm" variant="ghost" onClick={()=>{setItems(items.filter((_,i)=>i!==index));setEditing(null);}}>Remove activity</Button></div></div>}
          </CardContent></Card>)}</div>
        </div>)}
        <Button type="button" variant="outline" className="w-full border-dashed py-8" disabled={items.length>=100} onClick={()=>add("",true)}><Plus className="mr-2 h-5 w-5"/>Add Another Day</Button>
        <p className="text-sm text-muted-foreground leading-relaxed">Planning does not reserve or pay for activities. Book services separately through the marketplace.</p><p role="status" className="text-sm leading-relaxed">{message}</p>
      </div>
    </main>
  </form>;
}
