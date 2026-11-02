"use client";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ExportVisibleRows() {
  const [message, setMessage] = useState("");
  return <div className="inline-flex flex-col"><Button type="button" variant="outline" size="sm" onClick={() => {
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
  }}>Export visible rows</Button><span role="status" className="text-xs text-muted-foreground">{message}</span></div>;
}
export function PortalFilter() {
  const [open, setOpen] = useState(false);
  const params = useSearchParams();
  const path = usePathname();
  return <div className="relative">
    <Button type="button" variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>Filters</Button>
    {open && <form action={path} method="get" className="absolute right-0 top-full z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] space-y-3 rounded-xl border bg-white p-4 shadow-lg">
      {[...params.entries()].filter(([key]) => key !== "q" && key !== "page").map(([key,value]) => <input type="hidden" name={key} value={value} key={key+value}/>)}
      <label className="block text-sm font-semibold">Search records<input name="q" type="search" defaultValue={params.get("q") ?? ""} className="mt-1 h-11 w-full rounded-lg border px-3" /></label>
      <Button type="submit" size="sm">Apply</Button> <a href={path} className="text-sm underline">Reset</a>
    </form>}
  </div>;
}
