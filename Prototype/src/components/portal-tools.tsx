"use client";
import { Download, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PORTAL_FILTER_FIELDS } from "@/lib/portal-filter-options";
import Link from "next/link";

export function ExportVisibleRows() {
  const [message, setMessage] = useState("");
  return <div className="inline-flex flex-col"><Button type="button" variant="outline" size="sm" className="h-9 rounded-full border-border bg-white px-3.5 text-sm font-medium text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900" onClick={() => {
    const rows = [...document.querySelectorAll("main table tr")].map(row => [...row.querySelectorAll("th,td")].map(cell => {
      const text = (cell.textContent ?? "").replace(/\s+/g, " ").trim();
      return '"' + (/^[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') + '"';
    }).join(","));
    if (!rows.length) { setMessage("No table rows available to export."); return; }
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.join("\r\n")], {type: "text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = "safarinexa-visible-rows.csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("CSV download requested. Only visible rows are included.");
  }}><Download className="mr-1.5 h-3.5 w-3.5 text-slate-500"/>Export</Button><span role="status" className="text-xs text-muted-foreground">{message}</span></div>;
}
export function PortalFilter() {
  const [open, setOpen] = useState(false);
  const params = useSearchParams();
  const path = usePathname();
  const queryString=params.toString();
  const fields = PORTAL_FILTER_FIELDS[path] ?? [];
  const fieldNames = new Set(fields.map(field=>field.name));
  const activeCount = fields.filter(field=>params.has(field.name)&&params.get(field.name)!=="all"&&params.get(field.name)!=="newest").length;
  useEffect(()=>setOpen(false),[path,queryString]);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 rounded-full border-border bg-white px-3.5 text-sm font-medium text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"><Filter className="h-3.5 w-3.5 text-slate-500" aria-hidden="true"/>Filters{activeCount>0&&<span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-xs font-medium tabular-nums leading-none text-white">{activeCount}</span>}</Button></DialogTrigger>
    <DialogContent className="max-w-md rounded-2xl border-border"><DialogHeader><DialogTitle>Filter records</DialogTitle><DialogDescription>Search and narrow this list. Applying filters starts from the first page.</DialogDescription></DialogHeader>
      <form action={path} method="get" className="space-y-4">
        {[...params.entries()].filter(([key])=>key!=="q"&&key!=="page"&&!fieldNames.has(key)).map(([key,value],index)=><input type="hidden" name={key} value={value} key={`${key}-${index}`}/>)}
        <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Search records</span><Input name="q" type="search" defaultValue={params.get("q")??""} placeholder="Enter a name or keyword…" className="h-11 md:h-9 rounded-xl text-base md:text-sm shadow-none"/></label>
        {fields.map(field=><label key={field.name} className="block space-y-2 text-sm font-medium text-slate-700"><span>{field.label}</span><select name={field.name} defaultValue={params.get(field.name)?.toLowerCase()??(field.name==="sort"?"newest":"")} className="filter-select">{field.name!=="sort"&&<option value="">All</option>}{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4"><Link href={path} className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900" onClick={()=>setOpen(false)}>Reset all</Link><Button type="submit" size="sm" className="h-9 rounded-full px-4 text-sm">Apply filters</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

/** URL-backed sorting preserves the current search/filter and resets pagination. */
export function ReviewSort() {
  const router = useRouter();
  const params = useSearchParams();
  const path = usePathname();
  return <select aria-label="Sort reviews" value={params.get("sort") ?? "newest"} className="filter-select w-auto min-w-36 rounded-full px-3.5" onChange={event => {
    const next = new URLSearchParams(params.toString());
    next.set("sort", event.target.value);
    next.delete("page");
    router.push(`${path}?${next}`);
  }}><option value="newest">Newest</option><option value="highest">Highest rating</option><option value="lowest">Lowest rating</option></select>;
}
