"use client";

import * as React from "react";

type Slots = { targets: Map<string, HTMLDivElement>; register: (id:string,node:HTMLDivElement|null)=>void };
const TableToolsContext = React.createContext<Slots | null>(null);
export function TableToolsProvider({children}:{children:React.ReactNode}) {
  const [targets,setTargets] = React.useState(new Map<string,HTMLDivElement>());
  const register = React.useCallback((id:string,node:HTMLDivElement|null)=>{
    setTargets(current=>{
      if(current.get(id)===node || !node&&!current.has(id))return current;
      const next=new Map(current);if(node)next.set(id,node);else next.delete(id);return next;
    });
  },[]);
  const value=React.useMemo(()=>({targets,register}),[targets,register]);
  return <TableToolsContext.Provider value={value}>{children}</TableToolsContext.Provider>;
}
export function TableToolsSlot({tableId}:{tableId:string}) {
  const slots=React.useContext(TableToolsContext);
  const register=slots?.register;
  const ref=React.useCallback((node:HTMLDivElement|null)=>register?.(tableId,node),[register,tableId]);
  return <div ref={ref} data-table-tools={tableId} className="inline-flex shrink-0 items-center gap-2" />;
}
export function useTableToolsTarget(tableId?:string) {
  const slots=React.useContext(TableToolsContext);
  return tableId ? slots?.targets.get(tableId) : undefined;
}
