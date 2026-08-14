# SafariNexa Code Analysis Report

**Reviewed:** 10 August 2026  
**Scope:** `Prototype/` application source, configuration, Prisma schema, and local quality checks.  
**Codebase:** Next.js 14 App Router, TypeScript, Tailwind/Radix UI, Auth.js/NextAuth v5 beta, Prisma/PostgreSQL.

## Executive assessment

SafariNexa is a well-structured **MVP/prototype**, not yet production-ready. It has a broad product surface (about 70 user-facing routes), a substantial Prisma domain model, and thoughtful authentication/authorization design. The core marketplace, booking, payment, messaging, safety, and notification experience still has important implementation gaps. Most urgently, payment completion is currently simulated by a publicly reachable authenticated server action; this would let a legitimate customer mark their own payment successful without a provider webhook.

## What is in place

- 195 TypeScript/TSX files and approximately 17,353 lines under `src/`.
- Public discovery for accommodation, tours, restaurants, transport, destinations, and guides.
- Customer, business, and administrator portals; middleware separates public, customer, business, and admin route areas.
- Prisma schema models users, businesses, listings, room inventory, bookings, orders, payments/refunds, reviews, notifications, support, and audit logs.
- Credentials and Google sign-in, including a sensible rule that an existing password account cannot silently have a Google identity linked.
- Server-side ownership checks are present in the sampled booking, payment, support, review, and business-listing actions.
- The app uses real database reads/writes in many routes; only the home-page protected-action copy still imports `src/lib/data.ts`.

## Release blockers

| Priority | Finding | Evidence and impact | Recommended action |
|---|---|---|---|
| Critical | Payment success can be simulated in any environment | `src/app/payments/processing/page.tsx` exposes `simulateOutcome`; the rendered forms submit `outcome=success` and update payment/order/booking status with no Flutterwave/Stripe verification. | Remove the simulation action from production builds. Implement provider checkout/tokenization plus signed webhook verification and idempotency before changing booking/payment states. |
| High | Production build fails when Google Fonts is unreachable | `src/app/layout.tsx` calls `next/font/google` for Inter. `npm run build` failed after three `fonts.googleapis.com` DNS failures. | Self-host the font or make CI/build networking explicit and reliable. Validate an offline/container build. |
| High | Lint gate fails | `npm run lint` fails on `src/app/safety/page.tsx:111` (`We're`). | Escape the apostrophe or alter the JSX, then make lint required in CI. |
| High | Development auth can make every signed-in user an admin | With `AUTH_DEV_MODE=true`, `src/auth.ts` auto-provisions an active admin and both `src/auth.ts` and `src/auth.config.ts` set `isAdmin` for every session. The `.env.example` warns about this, but it is not technically impossible in production. | Make dev mode return false when `NODE_ENV === "production"`; fail startup if it is enabled in production. Add an automated authorization test. |

## Important gaps and risks

| Priority | Finding | Evidence and impact | Recommended action |
|---|---|---|---|
| High | No live payment integration or webhook/reconciliation path | Flutterwave keys are declared only in `.env.example`; payment helper code is display/simulation logic. Stripe is also offered as a method but has no integration. | Complete one provider end-to-end first, including webhook signature checks, duplicate-event handling, refunds, failure handling, and audit events. Do not show unsupported methods. |
| High | Safety/SOS controls are visual only | The `Call Police`, medical, tourism police, hotel, and support-chat buttons in `src/app/safety/page.tsx` have no `href`, event handler, or support integration. A static October 2026 advisory is also embedded in the page. | Use `tel:` links and a real support route; source advisories from managed, timestamped content and show jurisdiction/source. |
| High | No automated test suite | No unit, integration, or end-to-end test files were found, and `package.json` has no `test` script. Authentication, authorization, booking availability, and payment state transitions are therefore unprotected against regressions. | Add unit tests for domain helpers, integration tests for server actions/routes, and E2E coverage for customer/business/admin authorization and checkout. |
| Medium | Database migration history is absent | `prisma/` contains only `schema.prisma` and `seed.ts`; there is no `prisma/migrations/` directory. | Create and commit an initial migration; deploy with `prisma migrate deploy`, not schema push. Prevent production seed execution. |
| Medium | Card data is collected by the app form before a gateway is integrated | `src/components/payments/payment-method-form.tsx` collects PAN, expiry, and CVV. The current action masks the number rather than persisting it, which is good, but an application should not receive raw card fields without a compliant provider/tokenization design. | Replace with provider-hosted fields/checkout. Keep raw card values out of application logs, analytics, and server actions. |
| Medium | Registration endpoint is minimally protected | `src/app/api/auth/register/route.ts` has a basic 8-character password requirement and returns a different response for an existing email. No rate limiting, verification delivery, or abuse controls are visible. | Add rate limiting/anti-automation, stronger password policy or breach checks, email verification, and neutral account-creation responses where appropriate. |
| Medium | Search and image performance need attention | Lint reported 16 `@next/next/no-img-element` warnings across public listing and room components. | Use `next/image` where image dimensions and remote hosts can be controlled; define image sizes and responsive loading strategy. |
| Low | Booking reference collision resistance is weak | `src/lib/booking.ts` uses a short `Date.now()` + `Math.random()` token. | Enforce a unique database constraint and use a cryptographically secure/random or sequence-based reference generator. |
| Low | Repository provenance is not established | The Git worktree has no commits and all project files are untracked. | Create an initial reviewed commit, establish branch protection, CI, and a release/change-log process. |

## Verification results

| Check | Result |
|---|---|
| `npx prisma validate` | Passed — schema is valid. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Failed — one ESLint error, plus 16 image optimization warnings. |
| `npm run build` | Failed — build-time Google Fonts fetch could not resolve in this environment. |
| Automated tests | None found. |

The build failure is environmental (DNS/network access), but it remains a deployment-portability concern because the build depends on an external font fetch.

## Architecture observations

The application has a good separation of concerns for an MVP: database access is centralized through `src/lib/db.ts`, business rules are partly extracted into libraries such as `src/lib/listings.ts` and `src/lib/booking.ts`, and middleware intentionally uses an edge-safe auth configuration. The Prisma model is broad enough to support the planned marketplace.

The main architectural gap is transactional integrity around booking and payment workflows. Payment, booking, order, and notification records are updated in separate operations. Production flows should use transactions where state changes must succeed or fail together, an explicit state-transition layer, idempotency keys, provider event records, and concurrency protection for scarce room inventory.

## Recommended delivery order

1. Close the release blockers: remove production payment simulation, enforce a production-safe auth mode, fix lint, and make builds independent of Google Font availability.
2. Implement payment gateway/tokenization and verified webhooks, then make payment/order/booking transitions transactional and idempotent.
3. Add migration history, configuration validation, CI, logging/error monitoring, backups, and a deployment runbook.
4. Add automated tests for access control, provider callback/webhook behavior, availability conflicts, checkout, refunds, and principal customer/business/admin journeys.
5. Replace visual-only safety/support controls and static advisories with live, owned integrations/content.
6. Address performance/accessibility polish: optimized images, semantic actionable elements, and responsive verification of the high-traffic listing pages.

## Bottom line

The app is a promising and unusually complete prototype with a sound domain model and a strong start on access control. It should be treated as a staging/demo system until the payment simulation, production auth guard, build/lint failures, migrations, and automated tests are resolved.
