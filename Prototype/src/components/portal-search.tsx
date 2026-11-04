"use client";

import { Search, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PortalSearch({label="Search records",placeholder="Search records…",className}:{label?:string;placeholder?:string;className?:string}) {
  const path=usePathname(),params=useSearchParams();
  const clear=new URLSearchParams(params.toString());clear.delete("q");clear.delete("page");
  return <form role="search" aria-label={label} action={path} method="get" className={cn("relative flex w-full min-w-0 items-center sm:w-72",className)}>
    {[...params.entries()].filter(([key])=>key!=="q"&&key!=="page").map(([key,value],index)=><input key={`${key}-${index}`} type="hidden" name={key} value={value}/>)}
    <Search className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-slate-400" aria-hidden="true"/>
    <Input key={params.get("q")??""} type="search" name="q" defaultValue={params.get("q")??""} aria-label={label} placeholder={placeholder} className="h-11 md:h-9 rounded-xl bg-white pl-9 pr-14 text-base md:text-sm shadow-none transition-colors hover:border-slate-300 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:ring-offset-0"/>
    <div className="absolute right-2 flex items-center gap-0.5">{params.get("q")&&<Link href={`${path}${clear.size?`?${clear}`:""}`} aria-label="Clear search" className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"><X className="h-3.5 w-3.5"/></Link>}<button type="submit" aria-label={`Submit ${label.toLowerCase()}`} title="Search" className="rounded-full px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700">↵</button></div>
  </form>;
}
