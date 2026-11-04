"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { TableToolsProvider, useTableToolsTarget } from "./table-tools-slot";
import { TableExportButton } from "./table-export";
import { PortalToolbar } from "@/components/portal-toolbar";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const AccountContext = React.createContext<string | null>(null);
export function TablePreferencesProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  return <AccountContext.Provider value={userId}><TableToolsProvider>{children}</TableToolsProvider></AccountContext.Provider>;
}

type Column = { index: number; id: string; label: string };
type Visibility = {
  columns: Column[];
  hidden: string[];
  register: (column: Column) => () => void;
  visibleSpan: (start: number, span: number) => number;
};
export const TableVisibilityContext = React.createContext<Visibility | null>(null);
export const TableColumnPosition = React.createContext<{ start: number; span: number } | null>(null);

export function tableColumnsStorageKey(userId: string, tableId: string) {
  return `safarinexa:table-columns:v1:${encodeURIComponent(userId)}:${encodeURIComponent(tableId)}`;
}
function readHidden(value: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === "string"))] : [];
  } catch { return []; }
}

export function TableColumnVisibility({ tableId, label, children, externalTools, tableRef }: {
  externalTools?: boolean;
  tableRef?: React.RefObject<HTMLTableElement>;
  tableId?: string;
  label: string;
  children: React.ReactNode;
}) {
  const userId = React.useContext(AccountContext);
  const toolsTarget = useTableToolsTarget(tableId);
  const storageKey = tableId && userId ? tableColumnsStorageKey(userId, tableId) : null;
  const identity = storageKey ?? tableId ?? "";
  const [columns, setColumns] = React.useState<Column[]>([]);
  const [preference, setPreference] = React.useState<{ identity: string; hidden: string[] }>({ identity, hidden: [] });
  const [storageMessage, setStorageMessage] = React.useState("");

  React.useEffect(() => {
    let hidden: string[] = [];
    setStorageMessage("");
    if (storageKey) {
      try { hidden = readHidden(localStorage.getItem(storageKey)); }
      catch { setStorageMessage("Saved column choices could not be loaded in this browser."); }
    }
    setPreference({ identity, hidden });
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) setPreference({ identity, hidden: readHidden(event.newValue) });
    };
    if (storageKey) window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [identity, storageKey]);

  const storedHidden = React.useMemo(() => preference.identity === identity ? preference.hidden : [], [preference, identity]);
  // Old or manually altered storage must never leave a completely blank table.
  const hidden = React.useMemo(() => columns.length && columns.every(column => storedHidden.includes(column.id)) ? [] : storedHidden, [columns, storedHidden]);
  const visibleCount = columns.filter(column => !hidden.includes(column.id)).length;
  const register = React.useCallback((column: Column) => {
    setColumns(current => [...current.filter(item => item.index !== column.index), column].sort((a, b) => a.index - b.index));
    return () => setColumns(current => current.filter(item => item.index !== column.index));
  }, []);
  const visibleSpan = React.useCallback((start: number, span: number) => {
    if (!columns.length) return span;
    return Array.from({length:span}, (_, offset) => columns.find(column => column.index === start + offset))
      .filter(column => !column || !hidden.includes(column.id)).length;
  }, [columns, hidden]);
  function save(next: string[]) {
    setPreference({ identity, hidden: next });
    setStorageMessage("");
    if (!storageKey) return;
    try {
      if (next.length) localStorage.setItem(storageKey, JSON.stringify(next));
      else localStorage.removeItem(storageKey);
    } catch { setStorageMessage("Column choices apply for this visit, but could not be saved in this browser."); }
  }
  const value = React.useMemo(() => ({ columns, hidden, register, visibleSpan }), [columns, hidden, register, visibleSpan]);
  const tools = <>
      <TableExportButton tableRef={tableRef} label={label} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon" disabled={!columns.length} className="table-tool-button h-9 w-9 rounded-[6px] border-border p-0 shadow-none" aria-label={`Columns for ${label}`} title={`Choose columns: ${visibleCount} of ${columns.length} visible`}><Columns3 aria-hidden="true" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-[min(28rem,var(--radix-dropdown-menu-content-available-height))] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-[6px] p-1">
          <DropdownMenuLabel className="px-2 text-xs normal-case tracking-normal">Visible columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {columns.map(column => {
            const checked = !hidden.includes(column.id);
            return <DropdownMenuCheckboxItem key={column.index} checked={checked} disabled={checked && visibleCount === 1}
              onSelect={event => event.preventDefault()}
              onCheckedChange={next => {
                if (!next && visibleCount <= 1) return;
                save(next ? hidden.filter(id => id !== column.id) : [...hidden, column.id]);
              }}>{column.label}</DropdownMenuCheckboxItem>;
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!hidden.length} onSelect={() => save([])} className="justify-center rounded-[4px] text-xs font-normal">Show all columns</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  </>;
  return <TableVisibilityContext.Provider value={tableId ? value : null}><div className="min-w-0">
    {tableId && (externalTools ? (toolsTarget && createPortal(tools,toolsTarget)) : <div className="mb-3"><PortalToolbar actions={tools} /></div>)}
    {storageMessage && <p role="status" className="mb-2 text-xs text-muted-foreground">{storageMessage}</p>}
    {children}
  </div></TableVisibilityContext.Provider>;
}
