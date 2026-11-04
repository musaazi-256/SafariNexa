"use client";

import { ArrowRight, Search, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PortalSearch({label="Search records",placeholder="Search records…",className}:{label?:string;placeholder?:string;className?:string}) {
  const path=usePathname(),params=useSearchParams(),query=params.get("q")??"";
  const clear=new URLSearchParams(params.toString());clear.delete("q");clear.delete("page");
  return <form role="search" aria-label={label} action={path} method="get" className={cn("relative flex w-full min-w-0 items-center",className)}>
    {[...params.entries()].filter(([key])=>key!=="q"&&key!=="page").map(([key,value],index)=><input key={`${key}-${index}`} type="hidden" name={key} value={value}/>)}
    <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden="true"/>
    <Input key={query} type="search" name="q" defaultValue={query} aria-label={label} placeholder={placeholder} className={cn("h-9 rounded-[6px] border-border bg-background pl-9 text-base shadow-none transition-colors placeholder:text-muted-foreground hover:border-slate-300 focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-0 md:text-sm [&::-webkit-search-cancel-button]:appearance-none",query?"pr-16":"pr-10")}/>
    <div className="absolute right-1 flex items-center gap-0.5">
      {query&&<Link href={`${path}${clear.size?`?${clear}`:""}`} aria-label="Clear search" title="Clear search" className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground"><X aria-hidden="true" className="h-3.5 w-3.5"/></Link>}
      <button type="submit" aria-label={`Submit ${label.toLowerCase()}`} title="Search" className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground"><ArrowRight aria-hidden="true" className="h-3.5 w-3.5"/></button>
    </div>
  </form>;
}
