import { RemoteImage } from "@/components/remote-image";

function label(key: string) { return key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " "); }

/** Read-only snapshot, including every category field and every room/gallery photo. */
export function ListingSubmissionContent({ value, field = "Submission" }: { value: unknown; field?: string }) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">Not provided</span>;
  if (Array.isArray(value)) return value.length ? <div className="grid gap-3">{value.map((item, i) => <div key={i} className="min-w-0 rounded border p-3"><ListingSubmissionContent value={item} field={field} /></div>)}</div> : <span className="text-muted-foreground">None</span>;
  if (typeof value === "object") return <dl className="grid min-w-0 gap-4">{Object.entries(value).map(([key, item]) => <div key={key} className="min-w-0"><dt className="mb-1 font-semibold capitalize">{label(key)}</dt><dd className="min-w-0 whitespace-pre-wrap break-words"><ListingSubmissionContent value={item} field={key} /></dd></div>)}</dl>;
  const text = String(value);
  if (/image/i.test(field) && (/^https:\/\//.test(text) || /^\/api\/images\//.test(text))) return <div><RemoteImage src={text} loading="eager" alt={`${label(field)} submitted by business`} width={640} height={400} className="max-h-80 w-full rounded object-contain" /><a href={text} target="_blank" rel="noreferrer" className="text-sm underline">Open original photo</a></div>;
  return <span>{typeof value === "boolean" ? value ? "Yes" : "No" : text}</span>;
}
