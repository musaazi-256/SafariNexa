import Link from "next/link";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";

export default async function ListingQueue({searchParams}: {searchParams: {status?: string}}) {
  await requireAdminSession("businesses.manage");
  const statuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "NEEDS_CHANGES", "REJECTED", "WITHDRAWN"];
  const status = statuses.includes(searchParams.status || "") ? searchParams.status! : "SUBMITTED";
  const submissions = await db.listingSubmission.findMany({where: {status}, include: {listing: {include: {business: true}}}, orderBy: {submittedAt: "desc"}, take: 100});
  return <div className="mx-auto max-w-5xl space-y-6"><h1 className="text-3xl font-bold">Listing review queue</h1><p>Business verification establishes the operator’s identity. This queue reviews each listing’s content, prices and photos before publication.</p><nav aria-label="Review status" className="flex flex-wrap gap-3">{statuses.map(item => <Link key={item} href={`/admin/listings?status=${item}`} aria-current={item === status ? "page" : undefined} className={`rounded border p-2 text-sm ${item === status ? "bg-primary text-white" : ""}`}>{item.replaceAll("_", " ")}</Link>)}</nav><p className="text-sm">Showing up to 100 most recent {status.toLowerCase().replaceAll("_", " ")} submissions.</p>{submissions.length ? submissions.map(item => <Link className="block rounded border p-4 hover:bg-muted" href={`/admin/listings/${item.id}`} key={item.id}><h2 className="font-bold">{item.listing.title}</h2><p>{item.listing.business.name} · {item.listing.type} · {item.submittedAt.toISOString()}</p><span className="underline">View submitted details and photos</span></Link>) : <p>No submissions in this status.</p>}</div>;
}
