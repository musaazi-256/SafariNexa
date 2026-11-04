import { PortalToolbar } from "@/components/portal-toolbar";
import { TableColumnLabel } from "@/components/ui/table-column-label";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PageHero } from "@/components/page-hero";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function AuditPage() {
  await requireAdminSession();
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return <div className="space-y-6"><PageHero variant="portal" title="Audit trail" description="Latest 100 recorded platform events. This is not an uptime monitor."/><PortalToolbar tableId="admin-audit" />
    <Table externalTools tableId="admin-audit" aria-label="Audit trail"><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Surface</TableHead><TableHead><TableColumnLabel help="The recorded result of the action, such as success or a rejected request.">Outcome</TableColumnLabel></TableHead></TableRow></TableHeader>
    <TableBody>{logs.map(log => <TableRow key={log.id}><TableCell>{log.createdAt.toLocaleString("en-UG")}</TableCell><TableCell>{log.actorEmail ?? "System"}</TableCell><TableCell>{log.action}</TableCell><TableCell>{log.surface}</TableCell><TableCell>{log.outcome}</TableCell></TableRow>)}</TableBody></Table>
    {!logs.length && <p>No recorded events.</p>}
  </div>;
}
