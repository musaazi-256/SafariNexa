"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

/** A tip points at one control on a page and says what to do with it. */
type Tip = {
  id: string;
  /** Where to find the control: a CSS selector, optionally narrowed by its text. */
  selector: string;
  text?: string;
  title: string;
  body: string;
};
type PageTips = { match: (path: string) => boolean; tips: Tip[] };

const PAGES: PageTips[] = [
  {
    match: (p) => p === "/business/dashboard",
    tips: [
      { id: "dashboard-status", selector: "main a[href='/business/verification']", title: "Start here: get verified", body: "Your verification status. Open it to upload your documents; listings can't go live until an admin approves your business." },
      { id: "dashboard-add-listing", selector: "main a[href='/business/listings/new']", title: "Add your first listing", body: "Create a stay, tour, restaurant or transport listing. It's saved as a draft until you submit it." }
    ]
  },
  {
    match: (p) => p === "/business/listings",
    tips: [
      { id: "listings-create", selector: "main a[href='/business/listings/new']", title: "Create a listing", body: "Start a new listing here. Nobody sees it until an admin approves it." },
      { id: "listings-row-menu", selector: "main button[aria-label='Listing actions']", title: "Preview and submit", body: "Open this menu to edit a listing, preview it as travellers will see it, or check its approval and feedback." }
    ]
  },
  {
    match: (p) => p === "/business/listings/new",
    tips: [
      { id: "listing-type", selector: "main a[href^='/business/listings/new?type=']", title: "Choose what you offer", body: "Pick the kind of listing. The form shows the fields that type needs, like rooms for stays or itineraries for tours." },
      { id: "listing-create-draft", selector: "main button[type=submit]", text: "Create draft listing", title: "Save it as a draft", body: "Fill in the details, then save. You can come back to it, preview it and submit it for approval when it's ready." }
    ]
  },
  {
    match: (p) => /^\/business\/listings\/[^/]+\/preview$/.test(p),
    tips: [
      { id: "preview-submit", selector: "main button", text: "Submit for approval", title: "Send it for approval", body: "When it looks right, submit it. An admin checks every photo and detail, then approves it or tells you what to change." }
    ]
  },
  {
    match: (p) => /^\/business\/listings\/[^/]+\/review$/.test(p),
    tips: [
      { id: "review-submit", selector: "main button", text: "Submit listing and photos", title: "Submit or resubmit", body: "Send this listing for approval. If the admin asked for changes, make them first; their notes are on this page." },
      { id: "review-withdraw", selector: "main button", text: "Withdraw to make changes", title: "Need to change something?", body: "Withdraw the submission, edit the listing, and submit it again." }
    ]
  },
  {
    match: (p) => p === "/business/settings/verification",
    tips: [
      { id: "verification-type", selector: "#verification-type", title: "1. Pick the document type", body: "Choose what you're uploading: registration, licences and permits, tax documents or an ID." },
      { id: "verification-file", selector: "#verification-file", title: "2. Attach the file", body: "A PDF, JPEG or PNG up to 5 MB. Make sure it's readable and shows your business name." },
      { id: "verification-submit", selector: "main button[type=submit]", text: "Submit for review", title: "3. Send it for review", body: "An admin checks it and records a decision. You'll see it, with any notes, under Verification." }
    ]
  },
  {
    match: (p) => p === "/business/verification",
    tips: [
      { id: "outcomes-next", selector: "main a[href='/business/settings/verification']", title: "Your next step", body: "Upload or update your documents here. The decision on your business appears on this page." },
      { id: "outcomes-resubmit", selector: "main a", text: "Edit and resubmit", title: "Changes requested", body: "Read the reviewer's notes, edit the listing, and submit it again." }
    ]
  },
  {
    match: (p) => /^\/business\/bookings\/[^/]+$/.test(p) && p !== "/business/bookings/calendar",
    tips: [
      { id: "booking-accept", selector: "main button[type=submit]", text: "Accept request", title: "Accept to get paid", body: "Accepting asks the traveller to pay. Respond before the deadline shown on this booking." },
      { id: "booking-decline", selector: "main button[type=submit]", text: "Decline booking", title: "Can't host them?", body: "Decline the booking so the traveller can book elsewhere." }
    ]
  },
  {
    match: (p) => p === "/business/reviews",
    tips: [
      { id: "reviews-reply", selector: "main textarea[name=businessReplyBody]", title: "Reply to reviews", body: "Thank guests and answer concerns. Your reply shows under their review on your listing." }
    ]
  },
  {
    match: (p) => p === "/business/guides",
    tips: [
      { id: "guides-add", selector: "main a[href='/business/guides/new']", title: "Add your guides", body: "Add the guides who lead your tours, so you can assign them to tour listings." }
    ]
  }
];

const OFF = "safarinexa:tips:off";
const seenKey = (userId: string, id: string) => `safarinexa:tip:${userId}:${id}`;
export const REPLAY_TIPS = "safarinexa:replay-tips";
export const pageHasTips = (path: string) => PAGES.some((p) => p.match(path));

function find(tip: Tip): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(tip.selector)) {
    if (tip.text && !(el.textContent || "").includes(tip.text)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || (el as HTMLButtonElement).disabled) continue;
    return el;
  }
  return null;
}
const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return "1"; // No storage: treat as seen, so tips don't repeat on every visit.
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
};

/** Feature tips: one at a time, beside the control the new user is expected to use next.
 * They wait until the page's step-by-step guide is closed, show once each ("Got it"),
 * and can all be turned off; the header's help menu shows a page's tips again. */
export function FeatureTips({ userId }: { userId: string }) {
  const pathname = usePathname();
  const tips = React.useMemo(() => PAGES.find((p) => p.match(pathname))?.tips ?? [], [pathname]);
  const [active, setActive] = React.useState<{ tip: Tip; el: HTMLElement } | null>(null);
  const [box, setBox] = React.useState<{ top: number; left: number; place: "below" | "above"; arrow: number } | null>(null);
  const [tick, setTick] = React.useState(0);
  const card = React.useRef<HTMLDivElement>(null);

  // Pick the first unseen tip whose control is on screen, once no guide or dialog is open.
  React.useEffect(() => {
    setActive(null);
    if (!tips.length) return;
    const pick = () => {
      if (read(OFF) === "1") return setActive(null);
      if (document.querySelector("[role=dialog]:not([data-feature-tip]),[role=alertdialog],[role=menu]")) return setActive(null);
      for (const tip of tips) {
        if (read(seenKey(userId, tip.id)) === "done") continue;
        const el = find(tip);
        if (el) {
          setActive((a) => (a && a.tip.id === tip.id && a.el === el ? a : { tip, el }));
          return;
        }
      }
      setActive(null);
    };
    pick();
    const timer = setInterval(pick, 700);
    return () => clearInterval(timer);
  }, [tips, userId, tick]);

  // Keep the card beside its control.
  React.useLayoutEffect(() => {
    if (!active) return setBox(null);
    // Bring the control well into view (not just to the edge), leaving room for the card.
    const r0 = active.el.getBoundingClientRect();
    if (r0.top < 80 || r0.bottom > window.innerHeight - 220) active.el.scrollIntoView({ block: "center", inline: "nearest" });
    let frame = 0;
    const place = () => {
      const r = active.el.getBoundingClientRect();
      const w = card.current?.offsetWidth ?? 320;
      const h = card.current?.offsetHeight ?? 160;
      const below = r.bottom + 12 + h < window.innerHeight || r.top - 12 - h < 0;
      const left = Math.max(16, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 16));
      const next = { top: Math.round(below ? r.bottom + 12 : r.top - 12 - h), left: Math.round(left), place: (below ? "below" : "above") as "below" | "above", arrow: Math.round(Math.max(16, Math.min(r.left + r.width / 2 - left, w - 16))) };
      setBox((b) => (b && b.top === next.top && b.left === next.left && b.place === next.place && b.arrow === next.arrow ? b : next));
      frame = requestAnimationFrame(place);
    };
    place();
    active.el.setAttribute("data-feature-tip-target", "");
    return () => {
      cancelAnimationFrame(frame);
      active.el.removeAttribute("data-feature-tip-target");
    };
  }, [active]);

  // "Show tips on this page" from the help menu.
  React.useEffect(() => {
    const replay = () => {
      write(OFF, null);
      for (const tip of tips) write(seenKey(userId, tip.id), null);
      setTick((t) => t + 1);
    };
    window.addEventListener(REPLAY_TIPS, replay);
    return () => window.removeEventListener(REPLAY_TIPS, replay);
  }, [tips, userId]);

  if (!active || !box) return null;
  const index = tips.indexOf(active.tip);
  const gotIt = () => {
    write(seenKey(userId, active.tip.id), "done");
    setActive(null);
  };
  const off = () => {
    write(OFF, "1");
    setActive(null);
  };

  return (
    <div
      ref={card}
      role="dialog"
      aria-modal="false"
      aria-labelledby="feature-tip-title"
      data-feature-tip=""
      data-live-refresh="pause"
      style={{ top: box.top, left: box.left }}
      className="fixed z-40 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-primary/30 bg-card p-4 shadow-floating animate-fade-in"
    >
      <span aria-hidden="true" style={{ left: box.arrow - 6 }} className={box.place === "below" ? "absolute -top-1.5 h-3 w-3 rotate-45 border-l border-t border-primary/30 bg-card" : "absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-primary/30 bg-card"} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">Tip {index + 1} of {tips.length}</p>
          <h2 id="feature-tip-title" className="mt-1 text-sm font-semibold">{active.tip.title}</h2>
        </div>
        <button type="button" onClick={gotIt} aria-label="Dismiss tip" className="-mr-1 -mt-1 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{active.tip.body}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={off}>Turn off tips</Button>
        <Button type="button" size="sm" className="h-8" onClick={gotIt}>Got it</Button>
      </div>
    </div>
  );
}
