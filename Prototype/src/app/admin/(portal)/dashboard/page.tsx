import Link from "next/link";
import { OperationsTasks } from "@/components/operations-tasks";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin";
import { formatUGX } from "@/lib/booking";
import { summarizePayments } from "@/lib/revenue";
import { PageHero } from "@/components/page-hero";

export default async function AdminDashboardPage() {
  await requireAdminSession();
  const month = new Date(); month.setUTCDate(1); month.setUTCHours(0,0,0,0);
  const [businesses,bookings,openCases,closedCases,pending,all,monthly,queue,cases,audits] = await Promise.all([
    db.businessProfile.count({where:{verificationStatus:"APPROVED"}}),
    db.booking.count(), db.supportCase.count({where:{status:{in:["OPEN","IN_PROGRESS","WAITING_ON_CUSTOMER"]}}}),
    db.supportCase.count({where:{status:{in:["RESOLVED","CLOSED"]}}}),
    db.businessVerification.count({where:{status:{in:["SUBMITTED","UNDER_REVIEW","NEEDS_CHANGES"]}}}),
    db.payment.findMany({include:{refunds:{where:{status:"COMPLETED"}}}}),
    db.payment.findMany({where:{completedAt:{gte:month}},include:{refunds:{where:{status:"COMPLETED"}}}}),
    db.businessVerification.findMany({where:{status:{in:["SUBMITTED","UNDER_REVIEW","NEEDS_CHANGES"]}},include:{business:true},orderBy:{submittedAt:"asc"},take:5}),
    db.supportCase.findMany({where:{status:{in:["OPEN","IN_PROGRESS","WAITING_ON_CUSTOMER"]}},orderBy:{updatedAt:"desc"},take:5}),
    db.auditLog.findMany({orderBy:{createdAt:"desc"},take:6})
  ]);
  const finance=summarizePayments(all), monthFinance=summarizePayments(monthly);
  const stats=[
    {label:"Total collected",value:formatUGX(finance.grossMinor),href:"/admin/payments"},
    {label:"Collected this month",value:formatUGX(monthFinance.grossMinor),href:"/admin/payments"},
    {label:"Refunded",value:formatUGX(finance.refundedMinor),href:"/admin/payments?status=refunded"},
    {label:"Bookings",value:bookings,href:"/admin/bookings"},
    {label:"Approved businesses",value:businesses,href:"/admin/businesses"},
    {label:"Pending verification",value:pending,href:"/admin/verification?status=all"},
    {label:"Open support cases",value:openCases,href:"/admin/support"},
    {label:"Closed support cases",value:closedCases,href:"/admin/support"}
  ];
  return <div className="mx-auto max-w-7xl space-y-6 pb-10">
    <OperationsTasks/>
    <PageHero variant="portal" title="Dashboard" description="Live database records. Historical seeded/demo payment records are not proof of real settlement."/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(stat=><Link key={stat.label} href={stat.href} className="min-w-0 rounded-2xl border bg-white p-5 hover:border-primary"><p className="text-sm text-muted-foreground">{stat.label}</p><p className="mt-3 break-words text-2xl font-extrabold">{stat.value}</p></Link>)}</div>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="min-w-0 space-y-4 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Verification queue</h2>{queue.map(v=><Link key={v.id} href={`/admin/verification/${v.id}`} className="block rounded-xl border p-3 hover:bg-muted"><p className="font-semibold break-words">{v.business.name}</p><p className="text-sm">{v.status.replaceAll("_"," ")} · {v.submittedAt?.toLocaleDateString("en-UG")}</p></Link>)}{!queue.length&&<p>No pending submissions.</p>}</section>
      <section className="min-w-0 space-y-4 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Open support cases</h2>{cases.map(c=><Link key={c.id} href={`/admin/support/${c.id}`} className="block rounded-xl border p-3 hover:bg-muted"><p className="font-semibold break-words">{c.subject}</p><p className="text-sm">{c.caseRef} · {c.status.replaceAll("_"," ")}</p></Link>)}{!cases.length&&<p>No open cases.</p>}</section>
    </div>
    <section className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Recent recorded activity</h2>{audits.map(a=><p key={a.id} className="break-words border-b pb-3 text-sm">{a.createdAt.toLocaleString("en-UG")} · {a.action} · {a.outcome}</p>)}{!audits.length&&<p>No recorded events.</p>}<Link href="/admin/audit" className="inline-block underline">View audit trail</Link></section>
    <p className="text-sm text-muted-foreground">Infrastructure health and provider settlement require connected monitoring and reconciliation. No uptime or transfer is implied by this dashboard.</p>
  </div>;
}
