import Link from "next/link";
import {db} from "@/lib/db";
export async function ListingTrustSummary({listingId}: {listingId:string}) {
 const review=await db.listingSubmission.findFirst({where:{listingId,status:"APPROVED"},orderBy:{reviewedAt:"desc"},select:{reviewedAt:true}});
 return <section className="my-4 space-y-1 rounded border p-4 text-sm"><h2 className="font-bold">What has been checked?</h2><p>Business: approved through SafariNexa’s business verification process.</p><p>Listing details and photos: {review?.reviewedAt ? `reviewed ${review.reviewedAt.toLocaleDateString("en-GB",{timeZone:"Africa/Kampala"})}` : "legacy demo listing; no listing-level approval history is recorded"}.</p><p>Availability is validated when you submit a booking. Verification is not a guarantee of service quality or a physical inspection.</p><Link className="underline" href="/support">Ask for help with a booking</Link></section>;
}
