"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { TableColumnVisibility, TableVisibilityContext, TableColumnPosition } from "./table-column-visibility";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  density?: "default" | "compact";
  /** Stable semantic key; column choices are saved per signed-in user and table. */
  tableId?: string;
  externalTools?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, density = "default", tableId, externalTools, ...props }, ref) => {
    const localRef = React.useRef<HTMLTableElement>(null);
    React.useImperativeHandle(ref, () => localRef.current!);
    return (
    <TableColumnVisibility key={tableId} tableId={tableId} externalTools={externalTools} tableRef={localRef} label={props["aria-label"] ?? tableId ?? "table"}>
    <div className="relative min-w-0 w-full max-w-full overflow-auto overscroll-x-contain rounded-2xl border border-border bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" tabIndex={0} role="region" aria-label="Scrollable data table">
      <table ref={localRef} data-table-id={tableId} data-density={density} className={cn("data-table w-full caption-bottom text-sm", density === "compact" && "w-max min-w-full", className)} {...props} />
    </div>
    </TableColumnVisibility>
    );
  }
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("bg-slate-50/70 [&_tr]:border-b [&_tr]:hover:bg-transparent", className)} {...props} />
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, children, ...props }, ref) => {
    let index = 0;
    function positionCells(nodes: React.ReactNode): React.ReactNode {
      return React.Children.map(nodes, child => {
        if (!React.isValidElement<{ children?: React.ReactNode; colSpan?: number }>(child)) return child;
        if (child.type === React.Fragment) return <React.Fragment key={child.key}>{positionCells(child.props.children)}</React.Fragment>;
        const start = index, span = child.props.colSpan ?? 1;
        index += span;
        return <TableColumnPosition.Provider key={child.key ?? start} value={{ start, span }}>{child}</TableColumnPosition.Provider>;
      });
    }
    return <tr ref={ref} className={cn("border-b border-slate-100 transition-colors hover:bg-slate-50/70 data-[state=selected]:bg-slate-100", className)} {...props}>{positionCells(children)}</tr>;
  }
);
TableRow.displayName = "TableRow";

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  columnId?: string;
  columnLabel?: string;
}
const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, columnId, columnLabel, hidden, style, ...props }, ref) => {
    const visibility = React.useContext(TableVisibilityContext);
    const position = React.useContext(TableColumnPosition);
    const localRef = React.useRef<HTMLTableCellElement>(null);
    React.useImperativeHandle(ref, () => localRef.current!);
    const register = visibility?.register;
    const index = position?.start ?? 0;
    React.useEffect(() => {
      if (!register) return;
      const label = columnLabel ?? localRef.current?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      return register({ index, id: columnId ?? (label || `column-${index}`).toLowerCase().replace(/\s+/g, "-"), label: label || `Column ${index + 1}` });
    }, [register, index, columnId, columnLabel, props.children]);
    const visible = position && visibility ? visibility.visibleSpan(position.start, position.span) : 1;
    return <th ref={localRef} scope="col" className={cn("h-12 whitespace-nowrap px-4 text-left align-middle text-xs font-medium text-slate-500 [&:has([role=checkbox])]:pr-0", className)}
      {...props} hidden={hidden || visible === 0} style={hidden || visible === 0 ? {...style, display:"none"} : style} />;
  }
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, hidden, style, colSpan, ...props }, ref) => {
    const visibility = React.useContext(TableVisibilityContext);
    const position = React.useContext(TableColumnPosition);
    const span = position && visibility ? visibility.visibleSpan(position.start, position.span) : colSpan ?? 1;
    return <td ref={ref} className={cn("px-4 py-4 align-middle text-sm font-normal text-slate-600 [&:has([role=checkbox])]:pr-0", className)}
      {...props} colSpan={colSpan ? Math.max(1, span) : undefined} hidden={hidden || span === 0} style={hidden || span === 0 ? {...style, display:"none"} : style} />;
  }
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
