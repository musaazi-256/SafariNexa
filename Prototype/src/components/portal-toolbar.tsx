import { ResetRecordFilters } from "@/components/reset-record-filters";
import { TableToolsSlot } from "@/components/ui/table-tools-slot";
import type { ReactNode } from "react";

/** List controls always follow the page heading and summary cards. */
export function PortalToolbar({ search, filters, actions, tableId }: {
  tableId?: string;
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="portal-toolbar">
      {search && <div className="portal-toolbar-search">{search}</div>}
      {filters && <div className="portal-toolbar-filters">{filters}<ResetRecordFilters /></div>}
      {(actions || tableId) && <div className="portal-toolbar-actions">{actions}{tableId && <TableToolsSlot tableId={tableId} />}</div>}
    </div>
  );
}
