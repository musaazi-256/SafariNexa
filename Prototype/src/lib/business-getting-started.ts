import { db } from "@/lib/db";

export type GettingStartedState = "done" | "in_progress" | "todo";

export type GettingStartedStep = {
  id: string;
  title: string;
  summary: string;
  /** Short how-to shown when the step is expanded. */
  guide: string[];
  state: GettingStartedState;
  /** One-line note about the business's actual progress on this step. */
  status: string;
  href: string;
  actionLabel: string;
};

/** Public customer URL for a listing, by type. */
export function publicListingHref(listing: { id: string; type: string }) {
  const base = { ACCOMMODATION: "accommodation", TOUR: "tours", RESTAURANT: "restaurants", TRANSPORT: "transport" }[listing.type] ?? "explore";
  return `/${base}/${listing.id}`;
}

/**
 * The setup path a new business follows, worked out from its real records so
 * each step shows done / in progress / to do.
 */
export async function gettingStartedSteps(businessId: string): Promise<GettingStartedStep[]> {
  const [business, listings, members, invitations] = await Promise.all([
    db.businessProfile.findUniqueOrThrow({ where: { id: businessId } }),
    db.listing.findMany({
      where: { businessId },
      select: { id: true, title: true, status: true, coverImageUrl: true, images: true, basePriceMinor: true, _count: { select: { availability: true } }, submissions: { orderBy: { submittedAt: "desc" }, take: 1, select: { status: true } } },
      orderBy: { createdAt: "asc" }
    }),
    db.businessUser.count({ where: { businessId } }),
    db.businessInvitation.count({ where: { businessId } })
  ]);

  const profileFields = [business.description, business.address, business.city, business.contactPhone, business.logoUrl || business.coverImageUrl];
  const profileFilled = profileFields.filter(Boolean).length;
  const verification = business.verificationStatus;
  const first = listings[0];
  const withPhotos = listings.filter((l) => l.coverImageUrl && l.basePriceMinor > 0);
  const submitted = listings.filter((l) => l.submissions.length > 0);
  const published = listings.filter((l) => l.status === "PUBLISHED");
  const pendingReview = submitted.filter((l) => ["SUBMITTED", "UNDER_REVIEW"].includes(l.submissions[0].status));
  const needsChanges = submitted.filter((l) => l.submissions[0].status === "NEEDS_CHANGES");
  const withAvailability = listings.filter((l) => l._count.availability > 0);

  const verificationState: GettingStartedState = verification === "APPROVED" ? "done" : ["SUBMITTED", "UNDER_REVIEW", "NEEDS_CHANGES"].includes(verification) ? "in_progress" : "todo";
  const verificationStatus: Record<string, string> = {
    NOT_STARTED: "No documents submitted yet.",
    DRAFT: "Saved as a draft. Submit it to start the review.",
    SUBMITTED: "Submitted and waiting for a SafariNexa reviewer.",
    UNDER_REVIEW: "An admin is reviewing your documents.",
    NEEDS_CHANGES: "The reviewer asked for changes. Read the notes and resubmit.",
    APPROVED: "Your business is verified.",
    REJECTED: "Not approved. Read the reviewer's notes or contact support.",
    SUSPENDED: "On hold. Contact support."
  };

  return [
    {
      id: "profile",
      title: "Complete your business profile",
      summary: "Tell travellers who you are and how to reach you.",
      guide: [
        "Open Settings and add a short description of your business: what you offer and where.",
        "Add your physical address, city and a phone number guests can call.",
        "Upload a logo or cover photo. Businesses with photos get far more enquiries."
      ],
      state: profileFilled === profileFields.length ? "done" : profileFilled > 0 ? "in_progress" : "todo",
      status: `${profileFilled} of ${profileFields.length} profile details added.`,
      href: "/business/settings",
      actionLabel: "Edit profile"
    },
    {
      id: "verify",
      title: "Verify your business",
      summary: "Upload your documents so SafariNexa can approve your business.",
      guide: [
        "Go to Verification & documents and upload your certificate of incorporation or registration.",
        "Add your trading licence or permits, tax documents and an ID for the owner or manager.",
        "Files can be PDF, JPEG or PNG, up to 5 MB each. You'll get a notification when the review is done."
      ],
      state: verificationState,
      status: verificationStatus[verification] ?? "Status unavailable.",
      href: "/business/settings/verification",
      actionLabel: verification === "NEEDS_CHANGES" ? "Fix and resubmit" : verificationState === "todo" ? "Upload documents" : "View status"
    },
    {
      id: "listing",
      title: "Create your first listing",
      summary: "A room, tour, restaurant or transport service travellers can book.",
      guide: [
        "Choose Listings → Create listing and pick the type of service.",
        "Write a clear title and a description of at least 30 characters.",
        "Add the location and directions so guests can find you. You can save a draft and come back."
      ],
      state: first ? "done" : "todo",
      status: first ? `${listings.length} ${listings.length === 1 ? "listing" : "listings"} created.` : "No listings yet.",
      href: first ? "/business/listings" : "/business/listings/new",
      actionLabel: first ? "View listings" : "Create listing"
    },
    {
      id: "photos",
      title: "Add photos and prices",
      summary: "Every listing needs a cover photo and a price before it can be submitted.",
      guide: [
        "Upload a bright, landscape cover photo, then add gallery photos of rooms, vehicles or activities.",
        "Set a base price in UGX. Accommodation needs at least one room type with its own price.",
        "Use real photos of your service. Admins reject stock or unrelated images."
      ],
      state: withPhotos.length ? "done" : first ? "in_progress" : "todo",
      status: first ? `${withPhotos.length} of ${listings.length} listings have a cover photo and price.` : "Create a listing first.",
      href: first ? `/business/listings/${(listings.find((l) => !l.coverImageUrl || l.basePriceMinor <= 0) ?? first).id}/edit` : "/business/listings/new",
      actionLabel: "Add photos"
    },
    {
      id: "availability",
      title: "Set availability",
      summary: "Show which dates you can take bookings, and any seasonal prices.",
      guide: [
        "Open a listing's availability calendar from Listings.",
        "Block dates you're closed or fully booked, and set date-specific prices for peak seasons.",
        "Restaurants and transport take booking requests instead and can skip this step."
      ],
      state: withAvailability.length ? "done" : "todo",
      status: withAvailability.length ? `${withAvailability.length} ${withAvailability.length === 1 ? "listing has" : "listings have"} availability set.` : "Optional for restaurants and transport.",
      href: first ? `/business/listings/${first.id}/availability` : "/business/listings/new",
      actionLabel: "Open calendar"
    },
    {
      id: "submit",
      title: "Preview and submit for approval",
      summary: "Check how travellers will see your listing, then send it to SafariNexa.",
      guide: [
        "Open Preview to see your listing exactly as travellers will.",
        "When it looks right, choose Submit for approval. Your business must be verified first.",
        "An admin checks every photo, price and policy. If they ask for changes, edit and resubmit."
      ],
      state: needsChanges.length ? "in_progress" : submitted.length || published.length ? "done" : withPhotos.length ? "in_progress" : "todo",
      status: needsChanges.length ? `${needsChanges.length} ${needsChanges.length === 1 ? "listing needs" : "listings need"} changes.` : pendingReview.length ? `${pendingReview.length} awaiting review.` : submitted.length ? `${submitted.length} submitted.` : verification !== "APPROVED" ? "Available once your business is verified." : "Nothing submitted yet.",
      href: first ? `/business/listings/${(needsChanges[0] ?? withPhotos[0] ?? first).id}/preview` : "/business/listings/new",
      actionLabel: "Preview listing"
    },
    {
      id: "live",
      title: "Go live",
      summary: "Approved listings appear on SafariNexa and can be booked straight away.",
      guide: [
        "You'll get a notification when a listing is approved and published.",
        "Respond to booking requests quickly. Requests expire if you don't confirm in time.",
        "Track every decision on the Verification page."
      ],
      state: published.length ? "done" : pendingReview.length ? "in_progress" : "todo",
      status: published.length ? `${published.length} ${published.length === 1 ? "listing is" : "listings are"} live.` : "No live listings yet.",
      href: "/business/verification",
      actionLabel: "View outcomes"
    },
    {
      id: "team",
      title: "Invite your team",
      summary: "Give managers and staff their own sign-in. This step is optional.",
      guide: [
        "Open Team and invite people by email.",
        "Choose each person's role so they only see what they need.",
        "Invitations expire after 7 days."
      ],
      state: members > 1 ? "done" : invitations > 0 ? "in_progress" : "todo",
      status: members > 1 ? `${members} people have access.` : invitations > 0 ? `${invitations} ${invitations === 1 ? "invitation" : "invitations"} sent.` : "Only you have access.",
      href: "/business/team",
      actionLabel: "Invite team"
    }
  ];
}
