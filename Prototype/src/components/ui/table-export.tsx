"use client";

import {useState,type RefObject} from "react";
import {Download} from "lucide-react";
import {Button} from "@/components/ui/button";

/** CSV contains only this table's visible columns and rendered data rows. */
export function tableToCsv(table: HTMLTableElement) {
  return [...table.rows].filter(row=>!row.hidden).map(row=>[...row.cells].filter(cell=>!cell.hidden).map(cell=>{
    const value=(cell.textContent??"").replace(/\s+/g," ").trim();
    return '"'+(/^[=+@-]/.test(value)?"'"+value:value).replaceAll('"','""')+'"';
  }).join(",")).filter(Boolean).join("\r\n");
}
export function TableExportButton({tableRef,label="table"}:{tableRef?:RefObject<HTMLTableElement>;label?:string}) {
  const [message,setMessage]=useState("");
  return <>
    <Button type="button" variant="outline" size="icon" className="table-tool-button h-9 w-9 rounded-[6px] border-border p-0 shadow-none" aria-label={`Export ${label} to CSV`} title={`Export ${label} to CSV`} onClick={()=>{
      const table=tableRef?.current ?? (!tableRef?document.querySelector<HTMLTableElement>("main table"):null);
      if(!table || !table.querySelector("tbody td")){setMessage("No table rows available to export.");return;}
      const csv=tableToCsv(table);
      const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
      const link=document.createElement("a");link.href=url;link.download="safarinexa-visible-rows.csv";
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setMessage(`CSV download requested for ${label}. Only visible columns are included.`);
    }}><Download aria-hidden="true" /></Button>
    <span role="status" className="sr-only">{message}</span>
  </>;
}
