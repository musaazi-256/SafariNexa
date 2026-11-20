"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Camera,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Hand,
  ListChecks,
  MessageCircle,
  Send,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Step = { icon: LucideIcon; title: string; body: string; points?: string[]; action?: { label: string; href: string } };
type Guide = { id: string; name: string; match: (path: string) => boolean; steps: Step[] };

/** First-time guides for the business portal: a welcome tour on the dashboard and a short
 * guide on each key screen. Each opens by itself the first time a person visits that screen,
 * can be skipped or closed at any step, and can be replayed from the ? button in the header. */
function guides(verified: boolean): Guide[] {
  return [
    {
      id: "welcome",
      name: "Welcome tour",
      match: (p) => p === "/business/dashboard",
      steps: [
        { icon: Hand, title: "Welcome to SafariNexa Business", body: "This short tour shows you where everything is. Skip it at any time, and replay it later from the ? button at the top of the page." },
        { icon: ShieldCheck, title: "Get your business verified first", body: "Travellers only see businesses an admin has verified. Under Verification, upload your registration certificate, licences and an ID. The decision and the reviewer's notes appear there too." },
        { icon: ClipboardList, title: "Create listings and send them for approval", body: "Under Listings, add your stays, tours, restaurants or transport. Preview each one as travellers will see it, then submit it. An admin checks every photo and detail before it goes live." },
        { icon: CalendarClock, title: "Respond to booking requests", body: "New requests appear under Bookings as Awaiting confirmation. Accept or decline before the response deadline shown on the booking. When you accept, the traveller is asked to pay." },
        { icon: MessageCircle, title: "Talk to travellers and get paid", body: "Messages holds your conversations with travellers, Reviews lets you reply to their feedback, and Earnings and Payments & refunds show what you've been paid." },
        verified
          ? { icon: ClipboardCheck, title: "You're ready", body: "Your business is verified. Create your first listing and submit it for approval.", action: { label: "Create a listing", href: "/business/listings/new" } }
          : { icon: ClipboardCheck, title: "You're ready", body: "Start by getting verified. It's the one step that unlocks everything else.", action: { label: "Upload documents", href: "/business/settings/verification" } }
      ]
    },
    {
      id: "listings",
      name: "Listings guide",
      match: (p) => p === "/business/listings",
      steps: [
        { icon: ClipboardList, title: "Your listings", body: "Each listing shows whether it's a draft or published, and where its approval stands: Submitted, Needs changes or Approved. The row menu has Edit, Preview as traveller and Submission & feedback." },
        { icon: FileText, title: "Create a listing", body: "Use Create listing to add a stay, tour, restaurant or transport. It's saved as a draft, and travellers can't see it until it's approved." },
        { icon: Send, title: "Get it approved", body: "Preview the listing as travellers will see it, then submit it. If the admin asks for changes, their notes appear under Submission & feedback. Make the changes and submit again." }
      ]
    },
    {
      id: "listing-form",
      name: "Listing form guide",
      match: (p) => p === "/business/listings/new" || /^\/business\/listings\/[^/]+\/edit$/.test(p),
      steps: [
        { icon: FileText, title: "Start with the basics", body: "Give the listing a clear title, a description of at least 30 characters, the city and the address, and a price above zero." },
        { icon: Camera, title: "Add real photos and prices", body: "Add a cover photo and a gallery. For stays, add each room type with its price and photos. An admin opens every photo before approving, so use clear photos of this place only." },
        { icon: Send, title: "Save, preview, submit", body: "Saving keeps the listing as a draft. From your listings, preview it as travellers will see it and submit it for approval." }
      ]
    },
    {
      id: "verification",
      name: "Verification guide",
      match: (p) => p === "/business/verification" || p === "/business/settings/verification",
      steps: [
        { icon: FileText, title: "What to upload", body: "Upload documents that prove your business is real and allowed to operate.", points: ["Certificate of incorporation or business registration", "Tourism or trading licences and permits", "Tax documents", "An ID for a director or owner"] },
        { icon: ListChecks, title: "What happens next", body: "An admin checks your documents and business details. If they need more, the status changes to Needs changes, with notes saying what to add. Upload it and your business goes back into review." },
        { icon: ShieldCheck, title: "Track every decision", body: "The Verification page shows the decision on your business and on each listing, with the reviewer's notes and what to do next." }
      ]
    },
    {
      id: "bookings",
      name: "Bookings guide",
      match: (p) => p === "/business/bookings",
      steps: [
        { icon: CalendarClock, title: "Booking requests", body: "New requests are Awaiting confirmation. Open one to see the dates, guests, traveller details and the response deadline." },
        { icon: ClipboardCheck, title: "Accept or decline", body: "Accept to ask the traveller to pay, or decline the booking. Respond before the deadline shown on the booking." },
        { icon: MessageCircle, title: "After payment", body: "Paid bookings show as Confirmed. Message the traveller from the booking, and handle refunds under Payments & refunds." }
      ]
    }
  ];
}

const OFF = "safarinexa:guides:off";
const seenKey = (userId: string, id: string) => `safarinexa:guide:${userId}:${id}`;

export function BusinessGuides({ userId, verified }: { userId: string; verified: boolean }) {
  const pathname = usePathname();
  const guide = React.useMemo(() => guides(verified).find((g) => g.match(pathname)), [pathname, verified]);
  const [open, setOpen] = React.useState(false);
  // The step belongs to one guide: moving to a page with another guide starts it at step 1
  // (guides have different lengths, so carrying the number over could point past the end).
  const [position, setPosition] = React.useState({ guide: "", step: 0 });
  const step = guide && position.guide === guide.id ? Math.min(position.step, guide.steps.length - 1) : 0;
  const setStep = (n: number) => guide && setPosition({ guide: guide.id, step: n });

  // Open by itself the first time this person sees the screen.
  React.useEffect(() => {
    if (!guide) return setOpen(false);
    setPosition({ guide: guide.id, step: 0 });
    let seen = true; // If storage is unavailable, don't open on every visit.
    try {
      seen = localStorage.getItem(OFF) === "1" || localStorage.getItem(seenKey(userId, guide.id)) === "done";
    } catch {}
    setOpen(!seen);
  }, [guide, userId]);

  if (!guide) return null;
  const current = guide.steps[step];
  const last = step === guide.steps.length - 1;
  const Icon = current.icon;
  // Finishing, skipping or closing all count as seen.
  const done = () => {
    try {
      localStorage.setItem(seenKey(userId, guide.id), "done");
    } catch {}
    setOpen(false);
  };

  return (
    <>
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" title={`${guide.name}: how to use this page`} aria-label={`Show the ${guide.name.toLowerCase()}`} onClick={() => { setStep(0); setOpen(true); }}>
        <CircleHelp className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : done())}>
        <DialogContent className="max-w-md" data-live-refresh={open ? "pause" : undefined}>
          <div className="flex items-center justify-between pr-8">
            <p className="text-xs font-medium text-muted-foreground">{guide.name} · Step {step + 1} of {guide.steps.length}</p>
          </div>
          <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <DialogTitle className="mt-4 type-card">{current.title}</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.body}</DialogDescription>
          {current.points && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {current.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}
          <div className="mt-6 flex justify-center gap-1.5" aria-hidden="true">
            {guide.steps.map((s, i) => <span key={s.title} className={cn("h-1.5 rounded-full transition-all motion-reduce:transition-none", i === step ? "w-5 bg-primary" : "w-1.5 bg-border")} />)}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {last ? <span /> : <Button type="button" variant="ghost" size="sm" onClick={done}>Skip guide</Button>}
            <div className="flex items-center gap-2">
              {step > 0 && <Button type="button" variant="outline" size="sm" onClick={() => setStep(step - 1)}><ArrowLeft />Back</Button>}
              {!last && <Button type="button" size="sm" onClick={() => setStep(step + 1)}>Next<ArrowRight /></Button>}
              {last && current.action && <Button asChild variant="outline" size="sm"><Link href={current.action.href} onClick={done}>{current.action.label}</Link></Button>}
              {last && <Button type="button" size="sm" onClick={done}>Done</Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
