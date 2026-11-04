import { PortalToolbar } from "@/components/portal-toolbar";
import Link from "next/link";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { bookingPaymentSummary } from "@/lib/booking-payment-summary";
import { formatUGX } from "@/lib/booking";
import { PageHero } from "@/components/page-hero";
import { PortalSearch } from "@/components/portal-search";
import { Table,TableHeader,TableHead,TableRow,TableBody,TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/page-pagination";
import { PAGE_SIZE,parsePage,totalPagesFor } from "@/lib/pagination";
export default async function BusinessCustomersPage({searchParams}:{searchParams:{q?:string;page?:string}}) {
 const {businessId}=await requireBusinessSession();if(!businessId)return <EmptyState title="No business linked"/>;
 const q=searchParams.q?.trim();const page=parsePage(searchParams.page);
 const where={bookings:{some:{businessId}},...(q?{OR:[{name:{contains:q,mode:"insensitive" as const}},{email:{contains:q,mode:"insensitive" as const}}]}:{})};
 const [customers,count]=await Promise.all([db.user.findMany({where,select:{id:true,name:true,email:true,phone:true,bookings:{where:{businessId},include:{listing:{select:{title:true}},payments:{include:{refunds:true}},order:{include:{payments:{include:{refunds:true}}}}},orderBy:{createdAt:"desc"}}},orderBy:{name:"asc"},skip:(page-1)*PAGE_SIZE,take:PAGE_SIZE}),db.user.count({where})]);
 return <div className="mx-auto max-w-[1400px] space-y-6"><PageHero variant="portal" title="Customers" description="Review your customers’ bookings, payment balances, and conversations."/><PortalToolbar tableId="business-customers" search={<PortalSearch label="Search customers" placeholder="Customer name or email…"/>} />
{!customers.length?<EmptyState title="No matching customers"/>:<Table externalTools tableId="business-customers" aria-label="Customers" density="compact"><TableHeader><TableRow>
          <TableHead>Customer</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
          <TableHead className="text-right">Bookings</TableHead><TableHead className="text-right">Net paid</TableHead><TableHead className="text-right">Outstanding</TableHead>
          <TableHead>Latest booking</TableHead><TableHead>Latest listing</TableHead><TableHead>Actions</TableHead>
        </TableRow></TableHeader><TableBody>{customers.map(customer=>{const summaries=customer.bookings.map(bookingPaymentSummary);const latest=customer.bookings[0];return <TableRow key={customer.id}>
            <TableCell>{customer.name ?? "Guest"}</TableCell><TableCell>{customer.email}</TableCell><TableCell>{customer.phone ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{customer.bookings.length}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUGX(summaries.reduce((sum, row) => sum + row.paidMinor - row.refundedMinor, 0))}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUGX(summaries.reduce((sum, row) => sum + row.outstandingMinor, 0))}</TableCell>
            <TableCell><Link href={`/business/bookings/${latest.id}`}>{latest.bookingRef}</Link></TableCell><TableCell>{latest.listing.title}</TableCell>
            <TableCell><div className="flex items-center gap-4">
              <Link href={`/business/bookings?q=${encodeURIComponent(customer.email)}`}>All bookings</Link>
              <Link href={`/business/payments?q=${encodeURIComponent(customer.email)}`}>Payments</Link>
              <Link href={`/business/messages?bookingId=${latest.id}`}>Message customer</Link>
            </div></TableCell>
          </TableRow>})}</TableBody></Table>}
 <Pagination currentPage={page} totalPages={totalPagesFor(count)} buildHref={p=>`/business/customers?${new URLSearchParams({...(q?{q}:{}),page:String(p)})}`}/></div>;
}
