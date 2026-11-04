import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const members: Array<{ name: string; email: string; role: string; roleVariant: React.ComponentProps<typeof Badge>["variant"]; status: string; statusVariant: React.ComponentProps<typeof Badge>["variant"] }> = [
  { name: "Farida Nansubuga", email: "owner.stays@safarinexa.test", role: "Owner", roleVariant: "default", status: "Active", statusVariant: "success" },
  { name: "Grace Akello", email: "grace@nilecrater.test", role: "Manager", roleVariant: "secondary", status: "Active", statusVariant: "success" },
  { name: "James Okello", email: "james@nilecrater.test", role: "Staff", roleVariant: "outline", status: "Invited", statusVariant: "warning" },
  { name: "Peter Ochola", email: "peter@nilecrater.test", role: "Staff", roleVariant: "outline", status: "Removed", statusVariant: "outline" }
];

/** ReUI c-table-6 · Team members table with avatars, roles and status, inside a Frame. */
export function TeamTable() {
  return (
    <Frame spacing="xs" className="w-full max-w-2xl">
      <FramePanel flush>
        <Table>
          <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.email}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{m.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                    <div className="flex flex-col"><span className="text-sm font-medium text-foreground">{m.name}</span><span className="text-xs text-muted-foreground">{m.email}</span></div>
                  </div>
                </TableCell>
                <TableCell><Badge variant={m.roleVariant}>{m.role}</Badge></TableCell>
                <TableCell><Badge variant={m.statusVariant}>{m.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FramePanel>
    </Frame>
  );
}
