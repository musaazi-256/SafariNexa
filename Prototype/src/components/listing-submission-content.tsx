import { db } from "@/lib/db";
import { formatUGX } from "@/lib/booking";
import { RemoteImage } from "@/components/remote-image";

async function GuideReference({id}: {id:string}) { const guide = await db.guide.findUnique({where:{id},select:{name:true}}); return <span>{guide?.name ?? "Guide no longer available"}</span>; }

function label(key: string) { if (key === "guideId") return "Guide"; return key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " "); }

/** Read-only snapshot, including every category field and every room/gallery photo. */
export function ListingSubmissionContent({ value, field = "Submission" }: { value: unknown; field?: string }) {
  if (value instanceof Date) return <span>{value.toLocaleString("en-GB", {dateStyle:"medium", timeStyle:"short", timeZone:"Africa/Kampala"})}</span>;
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">Not provided</span>;
  if (Array.isArray(value)) return value.length ? <div className="grid gap-3 sm:grid-cols-2">{value.map((item, i) => <div key={i} className="min-w-0 rounded-xl border bg-muted/10 p-4"><ListingSubmissionContent value={item} field={field} /></div>)}</div> : <span className="text-muted-foreground">None</span>;
  if (typeof value === "object") return <dl className="grid min-w-0 gap-x-6 gap-y-5 sm:grid-cols-2">{Object.entries(value).filter(([key]) => !["id", "createdAt", "updatedAt", "publishedAt", "submittedBy", "reviewedBy"].includes(key) && (!key.endsWith("Id") || key === "guideId")).map(([key, item]) => <div key={key} className={typeof item === "object" || /description|policy|images|itinerary/i.test(key) ? "min-w-0 sm:col-span-2" : "min-w-0"}><dt className="mb-1 text-xs font-semibold text-muted-foreground capitalize">{label(key)}</dt><dd className="min-w-0 whitespace-pre-wrap break-words text-sm"><ListingSubmissionContent value={item} field={key} /></dd></div>)}</dl>;
  if (typeof value === "number" && /(?:price|total|amount).*Minor$/i.test(field)) return <span>{formatUGX(value)}</span>;
  const text = String(value);
  if (field === "guideId") return <GuideReference id={text} />;
  if (/image/i.test(field) && (/^https:\/\//.test(text) || /^\/api\/images\//.test(text))) return <div><RemoteImage src={text} loading="eager" alt={`${label(field)} submitted by business`} width={640} height={400} className="max-h-80 w-full rounded object-contain" /><a href={text} target="_blank" rel="noreferrer" className="text-sm underline">Open original photo</a></div>;
  return <span>{typeof value === "boolean" ? value ? "Yes" : "No" : text}</span>;
}
