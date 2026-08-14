# SafariNexa — Phase 1 MVP

East African travel marketplace: browse before you sign in, then book accommodation, safaris/tours, restaurant
reservations, and limited transport (airport transfer, Kampala special hire), with a business portal and an
admin portal. Next.js 14 (App Router) + TypeScript + Tailwind + Prisma/PostgreSQL + NextAuth v5 (Auth.js).

## Status

This build has completed **Phase 1 (foundations)** and **Phase 2 (auth)** from the implementation plan. The
marketplace, booking/payment, business portal, and admin portal *screens* exist as routes with realistic mock
data and SafariNexa-branded UI, but their read/write DB wiring (Phases 3–8) is the next chunk of work. See
[Open questions / next phases](#open-questions--next-phases) below.

## Stack

- **Next.js 14** (App Router, TypeScript, server actions)
- **Tailwind CSS** + a small shadcn/ui-style component library (`src/components/ui`) built on Radix primitives
- **Prisma** + **PostgreSQL** — full Phase 1 data model in `prisma/schema.prisma`
- **NextAuth v5 (Auth.js)** — Credentials (email/password) + Google, DB-driven authorization, split edge/Node
  config so middleware never bundles Prisma/bcrypt
- **Flutterwave** payment integration is stubbed (env vars present, no live calls yet)

## Run locally

```bash
cd Prototype
npm install
cp .env.example .env   # already done for you in dev — fill in real values as needed
```

You need a local PostgreSQL database. Point `DATABASE_URL` at it, then:

```bash
npm run db:push     # create tables from prisma/schema.prisma (or npm run db:migrate for real migrations)
npm run db:seed     # demo customer, business owner, and admin accounts
npm run dev
```

Demo accounts created by the seed (password for all: `Passw0rd!`):

| Role | Email | Notes |
|---|---|---|
| Customer | `customer@safarinexa.test` | Has one completed + one pending booking |
| Business owner | `owner@safarinexa.test` | Owns "Murchison River Lodge", verification APPROVED |
| Admin | `admin@safarinexa.test` | ACTIVE, Super Admin role |

Other useful scripts: `npm run build`, `npm run typecheck`, `npm run lint`.

## Environment variables

See `.env.example`. Google OAuth is used **twice** — once for customer/business (`google` provider id) and
once for admin (`google-admin` provider id), both against the same Google Cloud OAuth client. Register **both**
redirect URIs on that client:

```
{AUTH_URL}/api/auth/callback/google
{AUTH_URL}/api/auth/callback/google-admin
```

Without `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, Google buttons render but sign-in will fail — email/password
auth works independently.

## Product rules this build enforces

**Browse before registration.** Guests can view home/discovery, search, categories, accommodation/tour listings,
destinations, restaurants, transport, and reviews with no account. Account is required only for the protected
actions: book, pay, save, message, review, manage/cancel bookings, request refunds, open support cases, manage
profile. `src/middleware.ts` enforces this at the route level for the always-protected pages (checkout,
bookings, profile, notifications, support, trip planner); `ProtectedAction`
(`src/components/protected-action.tsx`) enforces it at the action level for things like "Book" buttons on
otherwise-public listing pages.

**Context resume.** A guest hitting a protected action is sent to `/auth/sign-in?returnTo=<path>`; every sign-in
path (credentials form, Google button, create-account, google/link) threads `returnTo` through as NextAuth's
`callbackUrl`/`redirectTo`, so the framework itself lands the user back on the exact page after auth — no custom
session-stashing needed.

**Google is an identity provider, not an authorization source.** `src/auth.ts`'s `signIn` callback is where every
DB decision happens:

- *Customer/business* (`google` provider): existing linked `Account` → sign in. Existing `User` by email but no
  linked `Account` → **deny the automatic sign-in** and redirect to `/auth/google/link`, where the user proves
  ownership with their password before we create the `Account` row (see `PendingProviderLink` in the schema —
  it bridges the denied attempt to the link step). No matching `User` → allow; the Prisma adapter creates a
  lightweight customer profile.
- *Admin* (`google-admin` provider, same OAuth client but a distinct provider id/callback): sign-in fails
  outright unless a `User` **and** an `AdminUser` row with `status = ACTIVE` already exist. Admins are never
  created from this flow. Every attempt (success/deny) is written to `AuditLog`.
- Business membership resolution (existing member → dashboard; pending `BusinessInvitation` → auto-accept;
  neither → `/business/onboarding`) happens in `src/app/business/auth/google/callback/page.tsx` after the
  session is established.

**Admin credentials are separate and stricter too.** The `admin-credentials` provider (`src/auth.ts`) refuses to
authenticate unless `AdminUser.status === "ACTIVE"`, independent of the Google path.

## Architecture notes

- `src/auth.config.ts` — edge-safe NextAuth config (Google providers only, no adapter/Credentials/bcrypt). Used
  by `src/middleware.ts` so the Edge bundle never pulls in Prisma or bcrypt.
- `src/auth.ts` — full Node-runtime config: adds both Credentials providers and `PrismaAdapter`, plus all the
  DB-driven callback logic above. Import this everywhere except middleware.
- `src/middleware.ts` — route guards for customer-protected paths, `/business/*`, and `/admin/*` (role-checked
  via `session.user.isAdmin`).
- `prisma/schema.prisma` — the full Phase 1 entity model (User/Account/Session through
  Booking/Payment/Refund/Review/Notification/SupportCase), matching the enums in the handover doc
  (`BookingStatus`, `PaymentStatus`, `VerificationStatus`, etc.) as closely as Prisma's model-naming
  constraints allow. Two adaptations worth knowing:
  - `AuthProviderAccount` from the spec is modeled as `Account` (NextAuth/`@auth/prisma-adapter` requires that
    exact model name to generate `prisma.account.*`).
  - `PendingProviderLink` isn't in the original entity list; it's the short-lived bridge for the Google
    ownership-verification flow described above.
- `src/components/ui/` — Tailwind + Radix component library (Button, Card, Badge, Input, Select, Dialog, Sheet,
  Tabs, Table, Dropdown, Avatar, StatusBadge, Rating/ScoreBadge). `src/lib/status.ts` centralizes the
  booking/payment/verification/admin-access status → label/color mapping so every surface renders the same
  state consistently.
- Pages not yet migrated to the component library still render on-brand via a compatibility shim in
  `globals.css` (`.container`/`.card`/`.button`/`.grid`) — safe to remove class-by-class as each page gets
  rebuilt with real data in the next phase.
- Booking.com was used as the UI benchmark for information density: see `SearchBar` (pill search with category
  tabs), `ListingRow` (horizontal search-result card), and `ScoreBadge` (numeric rating chip) — all in
  SafariNexa's green/gold palette rather than Booking's blue.

## Open questions / next phases

- **Phases 3–8 (marketplace data, booking/payment engine, business portal actions, admin actions,
  notifications/support/reviews)** are not wired to the DB yet — those pages render from `src/lib/data.ts` mock
  arrays. The schema is ready for this; it's the next milestone.
- **Admin Google step-up verification**: the spec asks that even a *legitimate* pre-provisioned admin require
  step-up verification (OTP/super-admin approval) before their first Google link, not just an allowlist check.
  This build enforces the allowlist (the security-critical half — unknown/inactive accounts are always denied)
  but auto-links Google for an already-ACTIVE admin on first attempt rather than adding a separate step-up flow,
  since that needs a real email/SMS provider. Flagged here rather than silently simplified.
- **Password reset / email verification** (`/auth/forgot-password`, `/auth/verify`) are UI placeholders — no
  email provider is configured, so OTP/reset-link delivery isn't wired up.
- **Payments** (Flutterwave) and **notifications** (email/SMS) are placeholders per the brief's instruction to
  use env-var-gated stubs when real credentials aren't available.
