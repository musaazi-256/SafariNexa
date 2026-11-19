"use client";

import * as React from "react";
import Image from "next/image";
import { CheckCircle2, Eye, ExternalLink, FileText, ImageIcon, Link2 } from "lucide-react";

import { PhotoLightbox } from "@/components/rooms/photo-lightbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type PhotoGroup = { label: string; images: string[] };
export type EvidenceDocument = { id: string; label: string; detail: string; href: string; inlineHref?: string; kind: "file" | "link" };

type Evidence = {
  photos: string[];
  documents: EvidenceDocument[];
  viewedPhotos: Set<number>;
  viewedDocs: Set<string>;
  markPhoto: (i: number) => void;
  markDoc: (id: string) => void;
  touch: () => void;
};
const EvidenceContext = React.createContext<Evidence | null>(null);
function useEvidence() {
  const ctx = React.useContext(EvidenceContext);
  if (!ctx) throw new Error("Wrap listing evidence parts in <ListingEvidenceProvider>.");
  return ctx;
}

// Progress is kept per submission for this browser tab, so a reload doesn't send the reviewer back to the start.
function readProgress(key: string): { photos: number[]; docs: string[] } {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
    return { photos: Array.isArray(saved?.photos) ? saved.photos.filter(Number.isInteger) : [], docs: Array.isArray(saved?.docs) ? saved.docs.filter((d: unknown) => typeof d === "string") : [] };
  } catch {
    return { photos: [], docs: [] };
  }
}

/** Tracks which photos and documents this reviewer has opened for this submission. */
export function ListingEvidenceProvider({ submissionId, groups, documents, children }: { submissionId: string; groups: PhotoGroup[]; documents: EvidenceDocument[]; children: React.ReactNode }) {
  const key = `listing-review:${submissionId}`;
  const photos = React.useMemo(() => groups.flatMap((g) => g.images), [groups]);
  const [viewedPhotos, setViewedPhotos] = React.useState<Set<number>>(new Set());
  const [viewedDocs, setViewedDocs] = React.useState<Set<string>>(new Set());
  const [touched, setTouched] = React.useState(false);
  const loaded = React.useRef(false);
  const docIds = documents.map((d) => d.id).join("|");
  React.useEffect(() => {
    const saved = readProgress(key);
    const ids = docIds.split("|");
    setViewedPhotos(new Set(saved.photos.filter((i) => i < photos.length)));
    setViewedDocs(new Set(saved.docs.filter((id) => ids.includes(id))));
    loaded.current = true;
  }, [key, photos.length, docIds]);
  React.useEffect(() => {
    // Nothing opened yet means nothing to save (and must not wipe what an earlier mount saved).
    if (!loaded.current || (!viewedPhotos.size && !viewedDocs.size)) return;
    try {
      sessionStorage.setItem(key, JSON.stringify({ photos: [...viewedPhotos], docs: [...viewedDocs] }));
    } catch {}
  }, [key, viewedPhotos, viewedDocs]);
  const markPhoto = React.useCallback((i: number) => { setTouched(true); setViewedPhotos((s) => (s.has(i) ? s : new Set(s).add(i))); }, []);
  const markDoc = React.useCallback((id: string) => { setTouched(true); setViewedDocs((s) => (s.has(id) ? s : new Set(s).add(id))); }, []);
  const touch = React.useCallback(() => setTouched(true), []);
  return (
    <EvidenceContext.Provider value={{ photos, documents, viewedPhotos, viewedDocs, markPhoto, markDoc, touch }}>
      {/* A review in progress pauses the portal's background refresh, which would clear the ticked checks. */}
      {touched && <span hidden data-live-refresh="pause" />}
      {children}
    </EvidenceContext.Provider>
  );
}

/** Every submitted photo (cover, gallery, rooms) in one grid; each opens full size. */
export function PhotoReview({ groups, title }: { groups: PhotoGroup[]; title: string }) {
  const { photos, viewedPhotos, markPhoto } = useEvidence();
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const show = (i: number) => { setIndex(i); markPhoto(i); setOpen(true); };
  let offset = 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" />Photos</CardTitle>
        <CardDescription>Open each photo at full size. Check it shows this listing, is clear, and is appropriate.</CardDescription>
        {photos.length > 0 && (
          <Progress value={viewedPhotos.size} max={photos.length} className="pt-2" aria-label={`${viewedPhotos.size} of ${photos.length} photos viewed`} />
        )}
        {photos.length > 0 && <p className="text-xs text-muted-foreground">{viewedPhotos.size} of {photos.length} photos viewed</p>}
      </CardHeader>
      <CardContent className="space-y-6">
        {photos.length === 0 && <p className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">No photos were submitted. A listing needs at least a cover photo before it can be approved.</p>}
        {groups.map((group) => {
          const start = offset;
          offset += group.images.length;
          if (!group.images.length) return null;
          return (
            <section key={group.label} aria-label={group.label}>
              <h3 className="mb-2 text-sm font-medium">{group.label} <span className="font-normal text-muted-foreground">· {group.images.length}</span></h3>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {group.images.map((src, j) => {
                  const i = start + j;
                  const seen = viewedPhotos.has(i);
                  return (
                    <li key={`${src}-${i}`}>
                      <button
                        type="button"
                        onClick={() => show(i)}
                        className={cn("group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", seen ? "border-success/50" : "border-border")}
                        aria-label={`Open ${group.label.toLowerCase().replace(/ photos?$/, "")} photo ${j + 1}${seen ? " (viewed)" : ""}`}
                      >
                        <Image src={src} alt="" fill sizes="(min-width: 1024px) 220px, 45vw" className="object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none" />
                        <span className={cn("absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", seen ? "bg-success text-success-foreground" : "bg-background/90 text-foreground")}>
                          {seen ? <><CheckCircle2 className="h-3.5 w-3.5" />Viewed</> : <><Eye className="h-3.5 w-3.5" />View</>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </CardContent>
      <PhotoLightbox images={photos} title={title} open={open} activeIndex={index} onOpenChange={setOpen} onIndexChange={(i) => { setIndex(i); markPhoto(i); }} />
    </Card>
  );
}

/** Business evidence and listing links, each viewable in-page. */
export function DocumentReview({ businessName }: { businessName: string }) {
  const { documents, viewedDocs, markDoc } = useEvidence();
  const [active, setActive] = React.useState<EvidenceDocument | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Documents</CardTitle>
        <CardDescription>Licences, registration and other evidence on file for {businessName}, plus documents linked from the listing.</CardDescription>
        {documents.length > 0 && <p className="text-xs text-muted-foreground">{viewedDocs.size} of {documents.length} documents opened</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 && <p className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">No documents on file for this business. Check business verification before approving.</p>}
        {documents.map((doc) => {
          const seen = viewedDocs.has(doc.id);
          return (
            <div key={doc.id} className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4", seen ? "border-success/40 bg-success/5" : "border-border bg-muted/20")}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{doc.kind === "link" ? <Link2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}</span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">{doc.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{doc.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {seen && <Badge variant="success"><CheckCircle2 className="h-3.5 w-3.5" />Opened</Badge>}
                {doc.kind === "file" ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => { markDoc(doc.id); setActive(doc); }}><Eye />View</Button>
                ) : (
                  <Button asChild size="sm" variant="outline"><a href={doc.href} target="_blank" rel="noreferrer" onClick={() => markDoc(doc.id)}>Open<ExternalLink /></a></Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
      <Dialog open={Boolean(active)} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl" onOpenAutoFocus={(event) => { event.preventDefault(); (event.currentTarget as HTMLElement).focus(); }}>
          <DialogHeader>
            <DialogTitle>{active?.label}</DialogTitle>
            <DialogDescription>{active?.detail}</DialogDescription>
          </DialogHeader>
          {active && <iframe title={active.label} src={active.inlineHref ?? active.href} className="h-[70vh] w-full rounded-xl border border-border bg-muted" />}
          {active && <Button asChild variant="outline" size="sm" className="self-start"><a href={active.href} target="_blank" rel="noreferrer">Open in new tab<ExternalLink /></a></Button>}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const CHECKS: Array<{ key: string; text: string; needs?: "photos" | "documents" }> = [
  { key: "photos", text: "I inspected every cover, gallery and room photo for relevance and appropriateness.", needs: "photos" },
  { key: "accuracy", text: "Description, location and category details are complete and consistent." },
  { key: "pricing", text: "Prices, units, room/capacity and booking information are clear." },
  { key: "policies", text: "Cancellation terms and applicable business evidence have been reviewed.", needs: "documents" }
];

/** Approval checklist. The photo and evidence checks unlock once everything has been opened here. */
export function ApprovalChecklist() {
  const { photos, documents, viewedPhotos, viewedDocs, touch } = useEvidence();
  const remaining = { photos: photos.length - viewedPhotos.size, documents: documents.length - viewedDocs.size };
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-xs font-semibold text-muted-foreground">Approval checklist</legend>
      {CHECKS.map(({ key, text, needs }) => {
        const left = needs ? remaining[needs] : 0;
        const locked = left > 0;
        return (
          <div key={key} className={cn("flex items-start gap-3 rounded-xl border border-border p-3 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/5", locked && "bg-muted/30")}>
            <Checkbox id={`check-${key}`} name={key} disabled={locked} onCheckedChange={touch} className="mt-0.5" aria-describedby={locked ? `check-${key}-hint` : undefined} />
            <div className="min-w-0">
              <label htmlFor={`check-${key}`} className={cn("cursor-pointer text-sm leading-relaxed", locked && "cursor-not-allowed text-muted-foreground")}>{text}</label>
              {locked && <p id={`check-${key}-hint`} className="mt-1 text-xs text-muted-foreground">Open the {left} remaining {needs === "photos" ? (left === 1 ? "photo" : "photos") : (left === 1 ? "document" : "documents")} first.</p>}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
