# SafariNexa Claude Code Handover Report

**Report date:** 6 July 2026  
**Prepared for:** Claude Code / engineering continuation  
**Project:** SafariNexa Phase 1 MVP  
**Primary status:** UX architecture and Figma wireframe coverage created; final visual redesign still pending  
**Important instruction:** Treat every app screen currently in Figma as a wireframe / structural design, not final production UI.

## 1. Executive handover summary

SafariNexa is a responsive web marketplace MVP for East African travel and tourism. The Phase 1 product is meant to prove the core marketplace loop before larger ecosystem expansion:

1. Customers discover travel options.
2. Customers plan and compare.
3. Customers book accommodation, tours/safaris, restaurant tables, and limited transport.
4. Payments are processed through supported mobile money/card rails.
5. Businesses receive and manage bookings.
6. Admins verify businesses, moderate content, monitor transactions, and support operations.
7. Customers receive notifications, travel support, and post-booking review prompts.

The current Figma work should be used by Claude Code as:

- a screen inventory;
- an information architecture reference;
- a UX-flow map;
- a state-coverage checklist;
- a responsive behavior guide;
- a product-scope handover.

It should not be treated as the final visual design. The user will redesign, refine, and arrange the screens into proper production flows later.

## 2. Source material used

### 2.1 Live proposal

Source: [SafariNexa MVP Product Design Engagement Proposal](https://musaazi.vercel.app/proposal/safarinexa)

Key proposal facts:

- Engagement: SafariNexa Phase 1 MVP product discovery, UX strategy, UI design, responsive web design, and developer handoff.
- Duration: 6 weeks.
- Work rhythm: 4 hours per day, 6 days per week.
- Total estimated effort: 144 hours.
- Engagement value: UGX 4,500,000.
- Phase 1 MVP focus: months 1-8 roadmap covering core bookings, provider onboarding, payments, reviews, notifications, and supporting travel utilities.

### 2.2 Local project documents

- `DESIGN_SYSTEM_PLAN.md`
- `SAFARINEXA_DESIGN_PROJECT_REPORT.md`
- Figma files listed in Section 3.

### 2.3 Current Figma files

| Area | Figma file |
|---|---|
| Customer App | `https://www.figma.com/design/NNar1EsoBEKuH93WLUV5HF/Customer-App` |
| SafariNexa Design System | `https://www.figma.com/design/L87CNkRRey3IL94we3e9uP/SafariNexa-Design-Sytem` |
| Business Portal | `https://www.figma.com/design/ltl07F6oUOGrWsNAxndJOP/Bussiness-Poatal` |
| Admin Portal | `https://www.figma.com/design/OqhZEfH22Qa3TV9uatLVER/Admin-Portal` |

## 3. Product framing

SafariNexa Phase 1 should be implemented as a focused marketplace MVP, not the full future SafariNexa ecosystem.

### 3.1 Phase 1 included modules

| Module | MVP intent |
|---|---|
| User accounts | Registration, login, profile, saved items, protected actions |
| Accommodation | Hotels, lodges, guesthouses, room selection, booking |
| Safaris & tours | Tour/safari listing, itinerary preview, dates, travellers, booking |
| Payments | MTN Mobile Money, Airtel Money, Visa/Mastercard through Flutterwave |
| Business portal | Business onboarding, verification, listing management, bookings, revenue |
| Admin portal | Listing/business approval, users, payments, reviews, support, reports |
| Reviews | Verified post-booking customer reviews |
| Notifications | Email/SMS/push/in-app confirmations, reminders, alerts |
| Destinations | Kampala and major Ugandan national parks |
| Restaurants | Directory and table reservation/request; no delivery |
| Transport | Airport transfers and Kampala special hire only |
| Trip planner | Basic manual itinerary builder |
| Safety | SOS, emergency directory, advisories |

### 3.2 Explicitly outside Phase 1

Do not accidentally expand the build into these areas:

- restaurant delivery;
- full transport marketplace;
- boda boda, ferry, matatu, or bus marketplace;
- events and ticketing;
- religious tourism;
- nightlife;
- AI trip builder;
- native mobile apps.

Responsive web is in scope. Native mobile app design/build is separate.

## 4. Core product rule: browse first, gate critical actions

The most important customer-side product rule is:

Customers should be able to browse before registration. They should only be required to sign in or create an account when they attempt a critical action.

### 4.1 Guest-access actions

Allow without registration:

- view home/discovery;
- search;
- browse categories;
- view accommodation listings;
- view tour/safari listings;
- view destinations;
- view restaurant profiles and menu previews;
- view transport options;
- compare options;
- view pricing estimates where possible;
- read reviews;
- read destination/safety/advisory content.

### 4.2 Account-gated actions

Require sign-in/account creation:

- book accommodation;
- book tours/safaris;
- reserve/request restaurant table;
- book/request transport;
- pay;
- save/wishlist;
- create or save trip plans;
- message businesses/providers;
- manage bookings;
- cancel booking;
- request refund;
- leave review;
- open customer support cases tied to bookings;
- manage profile/payment preferences.

### 4.3 Context-resume requirement

If a user hits a protected action as a guest:

1. Preserve the current intent and selected data.
2. Send them to authentication.
3. After authentication, return them to the original action.
4. Do not make the user restart search/selection.

Example:

Guest browses tour → selects date/travellers → taps Book → auth gate → creates account → returns to selected tour checkout with date/travellers preserved.

## 4A. Google authentication flow added across all apps

Google authentication has been added to the Figma wireframes for all three app surfaces:

| App surface | Figma location | Google auth behavior |
|---|---|---|
| Customer App | `02 Authentication` | Google sign-in/create-account option that preserves protected-action context and returns users to booking, saving, payment, review, message, support, or trip-planning flows |
| Business Portal | `02 Authentication` | Google authenticates the person, then SafariNexa checks whether the user owns, creates, or is invited to a business profile; verification status still gates publishing/bookings |
| Admin Portal | `01 Admin Login` | Google verifies identity only; SafariNexa must still enforce admin allowlists, active admin user records, roles, permissions, suspension status, and audit logging |

### 4A.1 Customer Google auth rules

- Customers may browse without Google sign-in.
- Google sign-in appears on direct login/register and at protected actions.
- If Google auth is launched from a protected action, preserve the original context.
- First-time Google users should create a lightweight customer profile.
- Existing email/password accounts should be linkable to Google after verification.
- Cancelled/failed Google auth must return users safely without losing browsing or booking context.

### 4A.2 Business Google auth rules

- Google identity alone does not approve a business user.
- After Google callback, check if the email belongs to an existing business owner/staff account.
- If invited, route to join-business flow.
- If new, route to create-business profile flow.
- Business verification remains required before publishing listings or receiving bookings.
- Role/permission records must come from SafariNexa, not Google.

### 4A.3 Admin Google auth rules

- Admin Google auth is not public registration.
- Unknown Google accounts must be denied, not auto-created.
- Authorization requires SafariNexa allowlist/admin-user-table validation.
- Suspended or inactive admin users must be blocked.
- Admin role permissions must be resolved inside SafariNexa.
- Every admin Google auth success/failure/denial should be audit logged.
- Admin sessions should have stricter timeout/security expectations than customer sessions.

## 5. Proposed technical architecture from proposal

The proposal names the following architecture assumptions.

| Layer | Suggested implementation |
|---|---|
| Frontend | Next.js, React, Tailwind CSS |
| UI component strategy | shadcn/ui-inspired components, SafariNexa design tokens |
| API/backend | Node.js / Next.js serverless routes or API gateway backend |
| Database | PostgreSQL for transactional records |
| Cache/search support | Redis for sessions/search/cache where needed |
| Storage | Cloud object storage for images and verification documents |
| Payments | Flutterwave aggregator for MTN Mobile Money, Airtel Money, Visa/Mastercard |
| Maps | Maps API for geocoding, maps, boundaries, pickup/dropoff |
| Notifications | SMS gateway, email service, possibly push/in-app |
| Auth/session | Browser storage/cookies with authenticated API middleware |

These are proposal assumptions, not final engineering decisions. Claude Code should validate the actual repository stack before implementation.

## 6. Design system status

### 6.1 Design system intent

The design system exists to create a reusable language across:

- marketing website;
- customer platform;
- business portal;
- admin portal;
- responsive web launch;
- future native mobile without rebuilding the brand system.

### 6.2 Established brand direction

| Brand element | Direction |
|---|---|
| Primary identity green | Deep Forest Green `#0F8F46` |
| Accessible primary control green | Darker green `#0C763A` |
| Accent | Safari Gold `#FFCE06` |
| Warm surface / brand page background | Warm Ivory `#FBFAF5` |
| Logo idea | Road-curve S/N monogram |
| Brand attributes | movement, scenic routes, exploration, nature, trust, warmth, approachability |

### 6.3 Design system assets already in place

Existing report notes the shared library includes:

- 29 Figma pages;
- 9 variable collections;
- 310 variables;
- 12 text styles;
- 5 elevation styles;
- reusable logo source components;
- published component library;
- foundation documentation;
- component/pattern pages.

### 6.4 Component families already planned/available

Claude Code should expect or create equivalents for:

- buttons;
- inputs;
- text areas;
- select menus;
- checkboxes;
- radio buttons;
- toggles;
- date/time pickers;
- search bars;
- listing cards;
- booking cards;
- filter panels;
- tables;
- tabs;
- breadcrumbs;
- navigation/sidebar;
- modals/dialogs;
- bottom sheets/drawers;
- toast notifications;
- alerts;
- empty states;
- error states;
- loading/skeleton states;
- rating components;
- status chips;
- progress steppers;
- file upload components;
- avatars;
- badges;
- marketplace cards;
- data tables/lists.

### 6.5 Known design-system issues to fix before production polish

The current report identifies malformed CSS variable syntax for:

- `base/white`
- `base/black`
- `base/transparent`

Also resolve typography alignment:

- Design system leans toward Geist.
- Some product-screen content uses Inter.
- Engineering should choose one product UI font convention and implement consistently.

## 7. Current Figma work status

### 7.1 Important status change

All currently generated app screens should now be considered wireframes.

They are useful for:

- feature coverage;
- product logic;
- screen/state naming;
- layout strategy;
- responsive structure;
- handover to implementation planning.

They are not final:

- visual hierarchy;
- final brand styling;
- final flow arrangement;
- component polish;
- spacing;
- imagery;
- copy;
- final interaction/prototype linking.

The user intends to redesign and arrange these into proper flows.

### 7.2 Overall product coverage created so far

Previous design pass created broad screen coverage:

| Product area | Approximate current coverage |
|---|---:|
| Customer App | 91 mobile-first/wireframe screens plus responsive customer coverage |
| Business Portal | 62 wireframe screens |
| Admin Portal | 65 wireframe screens |
| Total | 218 screens/states |

Additionally:

- customer guest-to-account booking prototype exists;
- business verification submission prototype exists;
- admin business-review approval prototype exists;
- developer handoff boards exist on setup pages.

Treat prototypes as flow examples, not production-final interaction design.

## 8. Customer App current Figma status

### 8.1 Customer App pages

| Page | Status |
|---|---|
| 00 Setup & Dependencies | Scaffold / dependency instructions |
| 01 Onboarding - Customer | Wireframes added; responsive rows added |
| 02 Authentication | Wireframes added; responsive rows added |
| 03 Home & Discovery | Mobile wireframes existed; tablet/desktop responsive variants added |
| 04 Search & Results | Mobile/tablet/desktop wireframe rows added |
| 05 Accommodation | Mobile/tablet/desktop wireframe rows added |
| 06 Tours & Safaris | Mobile/tablet/desktop wireframe rows added |
| 07 Destinations | Mobile/tablet/desktop wireframe rows added |
| 08 Restaurants | Mobile/tablet/desktop wireframe rows added |
| 09 Transport | Mobile/tablet/desktop wireframe rows added |
| 10 Booking & Checkout | Mobile/tablet/desktop wireframe rows added |
| 11 Payments | Mobile/tablet/desktop wireframe rows added |
| 12 Trip Planner | Mobile/tablet/desktop wireframe rows added |
| 13 Bookings | Mobile/tablet/desktop wireframe rows added |
| 14 Reviews | Mobile/tablet/desktop wireframe rows added |
| 15 Notifications & Safety | Mobile/tablet/desktop wireframe rows added |
| 16 Profile & Support | Mobile/tablet/desktop wireframe rows added |
| 99 Archive | Reserved |

### 8.2 Responsive coverage added directly to Customer App pages

Each customer page now has or intentionally preserves:

- Mobile 390;
- Tablet 768;
- Desktop 1440.

On `03 Home & Discovery`, existing mobile screens remained in place and missing tablet/desktop rows were added. On the other customer pages, complete mobile/tablet/desktop rows were added directly inside their actual pages.

### 8.3 Customer screen groups and intended implementation meaning

| Page | Screens/states represented |
|---|---|
| Onboarding | Welcome, choose interests, location permission, guest mode, start exploring |
| Authentication | Sign in, create account, forgot password, verify code, Google OAuth entry/callback/profile/linking/context resume/failure states, auth success/context resume |
| Home & Discovery | Home/personalised, explore/categories, featured destinations, recommendation rail, saved-items sign-in gate |
| Search & Results | Search landing, results list, map/list view, filter drawer, no availability |
| Accommodation | Accommodation detail, room selection, amenities & policies, availability calendar, booking gate |
| Tours & Safaris | Tour detail, itinerary preview, guide/operator profile, participants & dates, booking gate |
| Destinations | Destination overview, things to do, where to stay, best time to visit, save destination gate |
| Restaurants | Restaurant detail, menu preview, table reservation, location & hours, reserve table gate |
| Transport | Transport options, airport transfer detail, route selection, fare estimate, book transfer gate |
| Booking & Checkout | Booking summary, account required, traveller details, review booking, confirm booking |
| Payments | Payment method, mobile money instructions, card payment, payment processing, payment receipt |
| Trip Planner | Trip overview, itinerary builder, day plan, cost summary, save trip gate |
| Bookings | My bookings, booking detail, cancellation request, refund status, support handoff |
| Reviews | Review prompt, rating input, review summary, business response, moderation state |
| Notifications & Safety | Notification centre, travel advisory, SOS contacts, emergency detail, safety alert |
| Profile & Support | Profile overview, personal details, saved items, support centre, case detail |

### 8.4 Customer implementation priorities

Recommended implementation order:

1. App shell, routes, responsive layout primitives.
2. Authentication and guest/protected-route model.
3. Discovery/search/listing read flows.
4. Accommodation and tour/safari booking path.
5. Checkout and payment-state handling.
6. Bookings dashboard/detail.
7. Reviews and notifications.
8. Support/profile/safety.
9. Restaurants, transport, trip planner as controlled-support modules if schedule requires phasing.

## 9. Business Portal current Figma status

### 9.1 Intended users

- hotel owners/operators;
- lodge operators;
- tour/safari operators;
- guides;
- restaurant operators;
- transport providers where applicable;
- business staff.

### 9.2 Core responsibilities

| Area | Expected behavior |
|---|---|
| Onboarding | Business account creation and business type setup |
| Verification | Submit business documents and await approval |
| Listings | Create/manage accommodation and tour listings |
| Availability | Manage availability, blocked dates, capacity |
| Bookings | Receive, confirm, cancel, complete bookings |
| Messages | Communicate with customers before/after booking |
| Revenue | View earnings, commission, payouts, transactions |
| Analytics | Listing views, conversion, revenue, reviews |
| Settings | Business profile, staff access, notification preferences |

### 9.3 Current design status

The Business Portal has broad wireframe coverage from the latest design pass:

- onboarding;
- authentication;
- verification;
- listings;
- bookings;
- messages;
- payouts;
- reporting;
- support;
- resilience states.

Approximate count: 62 screens/states.

Use these as UX and IA references, not final dashboards.

## 10. Admin Portal current Figma status

### 10.1 Intended users

- admin team;
- verification/review officers;
- support team;
- finance/revenue monitors;
- super admins.

### 10.2 Core responsibilities

| Area | Expected behavior |
|---|---|
| Dashboard | Operational overview and pending work |
| Users | Manage tourist, business, and admin users |
| Businesses | View business profiles, status, listing performance |
| Verification | Review submitted business documents and approve/reject |
| Bookings | Monitor booking records and statuses |
| Payments | Track payments, refunds, commissions, payouts |
| Reviews | Moderate flagged content and business responses |
| Support | Handle complaints, refunds, service issues |
| Reports | Revenue, active users, conversion, booking trends |
| Settings | Categories, permissions, rules |

### 10.3 Current design status

The Admin Portal has broad wireframe coverage from the latest design pass:

- verification;
- business review;
- evidence review;
- users/access;
- moderation;
- support;
- operations;
- reporting;
- resilience states.

Approximate count: 65 screens/states.

Use these as operational flow references, not final visual/admin dashboards.

## 11. End-to-end marketplace flow

The proposal’s core marketplace flow can be translated into implementation like this:

1. Customer searches.
2. Search results are returned.
3. Customer opens listing.
4. Customer chooses date/service option.
5. If protected action starts and user is guest, auth gate appears.
6. Customer enters traveller/guest details.
7. Customer reviews price, policy, taxes/fees.
8. Customer selects payment method.
9. Payment is initiated.
10. Payment callback returns success/failure/pending.
11. Booking record is created or updated.
12. Business receives booking notification.
13. Business confirms/accepts where manual confirmation is required.
14. Customer receives confirmation.
15. Admin can monitor booking and payment record.
16. Service is completed.
17. Customer receives review prompt.
18. Review is submitted and may be moderated.

## 12. Booking and state model

Design and implementation should define booking states before final UI work.

Suggested booking states:

- draft / selection in progress;
- auth required;
- pending traveller details;
- pending payment;
- payment processing;
- payment failed;
- payment successful;
- booking created;
- awaiting business confirmation;
- confirmed;
- cancelled by customer;
- cancelled by business/admin;
- refund requested;
- refund processing;
- refunded;
- completed;
- review pending;
- reviewed;
- dispute/support case open.

Each state affects:

- customer UI;
- business portal UI;
- admin portal UI;
- notifications;
- payment records;
- support/refund handling.

## 13. Payment architecture and state handling

### 13.1 Supported methods

Phase 1 payment methods:

- MTN Mobile Money;
- Airtel Money;
- Visa/Mastercard;
- Flutterwave as payment aggregator.

### 13.2 Payment screens/states to implement

- payment method selection;
- mobile money instructions;
- card form;
- processing/pending state;
- success state;
- failed state;
- retry payment;
- receipt/invoice;
- refund status.

### 13.3 Open payment questions

Claude Code should not hardcode final payment rules until these are confirmed:

- Are all payment methods always visible, or location/currency dependent?
- Does SafariNexa hold funds before provider payout?
- When are businesses paid?
- What is the refund SLA?
- Are service fees separate?
- Are taxes included?
- Is pricing multi-currency?

## 14. Notification architecture

Notifications influence state counts, badges, dashboards, trust, and support.

| Event | Customer | Business | Admin | Channels |
|---|---|---|---|---|
| Account created | Confirmation | None | None | Email/SMS |
| Business submitted | None | Submission confirmation | Dashboard/admin alert | Email/admin |
| Business approved | None | Approval notice | Dashboard update | Email/SMS |
| Booking created | Pending confirmation | New booking alert | Booking log | Email/SMS/push/in-app |
| Payment successful | Receipt | Paid booking notice | Transaction log | Email/SMS/push/in-app |
| Payment failed | Retry alert | None | Failure log | In-app/SMS |
| Booking confirmed | Confirmation | Calendar update | Status update | Email/SMS/push/in-app |
| Booking cancelled | Cancellation alert | Cancellation alert | Admin log | Email/SMS/push/in-app |
| Refund requested | Refund status | Refund notice | Admin task | Email/in-app |
| Review submitted | Review confirmation | New review alert | Moderation log | Email/in-app |

## 15. Responsive strategy

The proposal defines responsive web as part of the MVP. Native mobile app design is separate.

| Breakpoint | Meaning |
|---|---|
| Mobile | 375-430px; Figma reference uses 390px |
| Tablet | 768-1024px; Figma reference uses 768px |
| Laptop | 1280px |
| Desktop | 1440px+; Figma reference uses 1440px |

### 15.1 Responsive behavior rules

| Pattern | Desktop | Tablet | Mobile |
|---|---|---|---|
| Search filters | Sidebar filters | Collapsible panel | Bottom sheet / full-screen drawer |
| Booking views | Table where dense | Condensed table/cards | Booking cards/timeline |
| Admin dashboards | Multi-column analytics | Reduced grid | Prioritised alerts/actions |
| Listing detail | Multi-column detail + sticky booking card | Split cards/stacked panels | Single-column detail with sticky CTA |
| Checkout | Main form + sticky summary | Two-column or stacked summary | Step-by-step form |
| Navigation | Sidebar/top nav | Collapsible/sidebar hybrid | Bottom nav/menu/drawer |

## 16. Original six-week work plan

The proposal planned 6 weeks at 24 hours/week.

| Week | Phase | Planned outputs |
|---|---|---|
| Week 1 | Discovery and scope lock | Stakeholder workshop, months 1-8 MVP alignment, assumptions register, open questions, feature prioritisation |
| Week 2 | Information architecture and core flows | Sitemap, navigation structure, actor map, accommodation flow, tour flow |
| Week 3 | Support module flows and wireframes | Business onboarding, admin approval, payment flow, restaurant directory, transport and safety flows |
| Week 4 | Design system and MVP UI patterns | Typography, colours, spacing, components, listing/booking/dashboard patterns |
| Week 5 | High-fidelity MVP screens | Customer platform, accommodation, tours, payments, business/admin dashboards |
| Week 6 | Prototype and developer handoff | Clickable prototype, annotations, responsive guidelines, handoff session, final package |

## 17. Day-by-day working plan

The proposal gave a weekly cadence, not a fully detailed daily schedule. The following day-by-day plan reconstructs the intended 4-hours/day, 6-days/week execution model and aligns it with the work now done.

### Week 1 — Discovery and scope lock

| Day | Focus | Output |
|---|---|---|
| Day 1 | Kickoff and product ambition | Confirm Phase 1 boundaries, stakeholders, success criteria |
| Day 2 | Business goals and MVP modules | Scope core vs future modules |
| Day 3 | Actor map | Tourist, business, admin, super admin responsibilities |
| Day 4 | Assumptions register | Payments, verification, listings, support, content assumptions |
| Day 5 | Feature prioritisation | Confirm launch modules and deferred modules |
| Day 6 | Discovery checkpoint | Scope-lock notes and open decision log |

### Week 2 — Information architecture and core flows

| Day | Focus | Output |
|---|---|---|
| Day 1 | Customer sitemap | Home, explore, bookings, trip planner, profile/support |
| Day 2 | Accommodation flow | Search → detail → room/date → checkout → payment → booking → review |
| Day 3 | Safari/tour flow | Browse → detail → itinerary → participants/date → checkout → review |
| Day 4 | Business portal IA | Dashboard, listings, bookings, calendar, revenue, settings |
| Day 5 | Admin portal IA | Dashboard, users, businesses, verification, payments, reviews, support |
| Day 6 | IA review | Align routes, navigation, permissions, data needs |

### Week 3 — Support module flows and wireframes

| Day | Focus | Output |
|---|---|---|
| Day 1 | Business onboarding and verification | Business submission and approval wireflows |
| Day 2 | Admin approval/moderation | Review queues, evidence review, decision states |
| Day 3 | Payment states | Method selection, processing, success/failure, refund |
| Day 4 | Restaurant directory | Directory, detail, reservation request, confirmation |
| Day 5 | Transport and safety | Airport transfer, special hire, SOS/advisories |
| Day 6 | Wireframe review | Confirm edge cases and API/state implications |

### Week 4 — Design system and MVP UI patterns

| Day | Focus | Output |
|---|---|---|
| Day 1 | Foundations | Colour, typography, spacing, radius, elevation |
| Day 2 | Form and control components | Inputs, selects, radio, checkbox, date/time, steppers |
| Day 3 | Marketplace components | Listing cards, booking cards, filters, rating/status |
| Day 4 | Dashboard components | Tables, KPIs, queues, charts, admin/business layouts |
| Day 5 | Responsive patterns | Desktop/tablet/mobile behavior for key flows |
| Day 6 | System review | Component inventory and usage rules |

### Week 5 — MVP screens

| Day | Focus | Output |
|---|---|---|
| Day 1 | Customer discovery/search | Home, explore, search, results, filters |
| Day 2 | Accommodation and tours | Detail, selection, availability, booking gates |
| Day 3 | Checkout/payments/bookings | Account gate, checkout, payment, booking detail |
| Day 4 | Trip/reviews/support | Planner, reviews, notifications, safety, support |
| Day 5 | Business portal screens | Verification, listings, bookings, revenue |
| Day 6 | Admin portal screens | Verification, moderation, payments, reports, support |

### Week 6 — Prototype and developer handoff

| Day | Focus | Output |
|---|---|---|
| Day 1 | Customer prototype | Guest-to-account booking path |
| Day 2 | Business prototype | Business verification/listing submission |
| Day 3 | Admin prototype | Business review/approval flow |
| Day 4 | Responsive QA | Mobile/tablet/desktop behavior notes |
| Day 5 | Developer handoff docs | States, routes, data assumptions, open questions |
| Day 6 | Final review | Handoff package, issue log, next-build priorities |

## 18. Current status against original plan

| Original workstream | Current status |
|---|---|
| Discovery and product scope | Proposal exists and scope is clear enough for MVP planning |
| Information architecture | Broad IA mapped across customer/business/admin |
| Core flows | Customer booking, business verification, admin approval represented |
| Support flows | Payments, notifications, safety, refunds, support represented |
| Design system | Substantial Figma library exists; needs production alignment |
| High-fidelity UI | Reclassified as wireframes; final visual design pending |
| Responsive design | Customer App has direct mobile/tablet/desktop wireframe coverage |
| Developer handoff | This document created for Claude Code; further technical validation needed |

## 19. Suggested Claude Code implementation plan

### 19.1 First pass: repository audit

Claude Code should begin by inspecting the repository, not by assuming the proposal stack is already implemented.

Check:

- package manager;
- framework;
- routing structure;
- existing components;
- Tailwind/shadcn setup;
- auth implementation;
- data layer;
- environment variables;
- API routes;
- database/migrations;
- deployment target.

### 19.2 Second pass: define product contracts

Before building UI pages, define:

- route map;
- auth/session model;
- user roles;
- business roles;
- admin roles;
- protected action behavior;
- booking state enum;
- payment state enum;
- notification event enum;
- review/moderation state enum;
- support/refund state enum.

### 19.3 Third pass: component primitives

Build or confirm:

- app shell;
- responsive container;
- navigation;
- page header;
- cards;
- buttons;
- form fields;
- date picker or date field placeholders;
- filters;
- listing cards;
- booking cards;
- status chips;
- tables;
- drawers/modals;
- toasts/alerts;
- empty/error/loading states.

### 19.4 Fourth pass: customer flows

Recommended build order:

1. Public browsing shell.
2. Auth and context-resume.
3. Search and listing browsing.
4. Accommodation detail and booking.
5. Tour/safari detail and booking.
6. Checkout/payment states.
7. Booking management.
8. Reviews.
9. Notifications/safety.
10. Profile/support.
11. Restaurants/transport/trip planner as support modules.

### 19.5 Fifth pass: business/admin flows

Business:

1. Business onboarding.
2. Verification submission.
3. Listing management.
4. Booking inbox/detail.
5. Revenue/payouts.
6. Messages/support.

Admin:

1. Admin dashboard shell.
2. Business verification queue.
3. Business review detail.
4. Users/businesses.
5. Bookings/payments.
6. Reviews/moderation.
7. Support/reports/settings.

## 20. Suggested route map

This is an implementation suggestion, not a final product decision.

### 20.1 Customer routes

```text
/
/explore
/search
/search/accommodation
/search/tours
/destinations
/destinations/[slug]
/accommodation/[id]
/tours/[id]
/restaurants
/restaurants/[id]
/transport
/transport/[id]
/checkout
/checkout/account-required
/checkout/traveller-details
/checkout/review
/payments
/payments/processing
/payments/receipt
/trip-planner
/bookings
/bookings/[id]
/bookings/[id]/cancel
/bookings/[id]/refund
/reviews/new
/notifications
/safety
/profile
/profile/saved
/support
/support/[caseId]
/auth/sign-in
/auth/create-account
/auth/google
/auth/google/callback
/auth/google/link
/auth/forgot-password
/auth/verify
/auth/success
```

### 20.2 Business routes

```text
/business
/business/onboarding
/business/auth/google
/business/auth/google/callback
/business/verification
/business/dashboard
/business/listings
/business/listings/new
/business/listings/[id]
/business/bookings
/business/bookings/[id]
/business/calendar
/business/messages
/business/revenue
/business/payouts
/business/analytics
/business/settings
/business/support
```

### 20.3 Admin routes

```text
/admin
/admin/auth/google
/admin/auth/google/callback
/admin/auth/access-denied
/admin/dashboard
/admin/users
/admin/businesses
/admin/businesses/[id]
/admin/verification
/admin/verification/[id]
/admin/bookings
/admin/payments
/admin/reviews
/admin/support
/admin/reports
/admin/settings
```

## 21. Suggested data entities

Initial entity list:

- User
- CustomerProfile
- BusinessProfile
- BusinessVerification
- BusinessDocument
- Listing
- AccommodationListing
- TourListing
- RestaurantProfile
- TransportOption
- Destination
- Availability
- Booking
- BookingParticipant
- Payment
- Refund
- Review
- Notification
- SavedItem
- TripPlan
- TripPlanItem
- SupportCase
- SupportMessage
- AdminUser
- Role
- Permission
- AuditLog

## 22. Open decisions for product/engineering

Claude Code should preserve these as open questions until answered:

### 22.1 Search and inventory

- Is search global or category-specific?
- Will listings be manually managed or imported?
- Does availability come from real-time APIs or manual business input?
- Are restaurants bookable immediately or request-to-reserve only?
- Are transport bookings instant price, quote request, or both?

### 22.2 Booking

- Which categories support instant booking?
- Which require business/admin confirmation?
- Can customers cancel online?
- Which cancellation policies apply per category?
- What is the source of truth for booking status?

### 22.3 Payments

- Is Flutterwave confirmed?
- Are mobile money/card both available at launch?
- Who holds funds?
- How are refunds handled?
- Are business payouts automated or manual?

### 22.4 Business operations

- What documents are required for verification?
- Can a business have multiple staff users?
- What listing fields are mandatory?
- Can businesses edit listings after approval?
- Are edits re-moderated?

### 22.5 Admin

- What admin roles exist?
- Does super admin approve permissions?
- Are support cases manually assigned?
- What metrics matter on launch dashboards?

### 22.6 Notifications

- Which SMS/email provider is selected?
- Are push notifications in Phase 1?
- Which events are mandatory?
- Can customers opt out of marketing but keep transactional notices?

### 22.7 Google authentication

- Which auth provider/library will be used in code?
- What Google OAuth client IDs are needed for customer, business, and admin environments?
- Are customer, business, and admin on the same domain/app or separate subdomains?
- Should Google accounts be linked to existing email/password accounts automatically or only after verification?
- What email domains, groups, or allowlists define admin access?
- Does admin Google auth require additional MFA or step-up verification?
- Can business staff join by Google email alone, or only through invitation links?
- What user data from Google is stored: email, name, avatar, provider ID?
- How are deleted/revoked Google accounts handled?
- What is the session duration per app surface?

## 23. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Treating wireframes as final UI | Poor visual product quality | User will redesign and arrange final flows before visual handoff |
| Scope creep into future modules | MVP delay | Keep Phase 1 boundaries strict |
| Payment ambiguity | Checkout rework | Confirm Flutterwave and refund/payout rules early |
| Verification ambiguity | Business onboarding rework | Confirm required docs and approval process |
| Unclear availability model | Booking engine complexity | Decide manual vs real-time availability |
| Role/permission ambiguity | Admin/business security risk | Define roles before admin implementation |
| Notification under-design | State and trust gaps | Define event map early |
| Design-token mismatch | UI inconsistency | Align code tokens with design system before production polish |

## 24. Immediate next steps

### 24.1 For product/design

1. Review wireframe coverage.
2. Rearrange screens into proper flows.
3. Redesign visual UI using the actual SafariNexa design language.
4. Confirm final navigation for customer/business/admin.
5. Confirm protected-action and auth-resume behavior.
6. Confirm payment/refund/business verification decisions.
7. Mark which wireframes are MVP build priority vs later.

### 24.2 For Claude Code / engineering

1. Audit the repository.
2. Report actual tech stack and gaps.
3. Create a build plan from this handover.
4. Implement foundational layout/components first.
5. Implement data/state contracts before deep UI.
6. Build the guest browsing + protected action auth model.
7. Build customer core booking path first.
8. Then build business/admin operational flows.

## 25. Final instruction to Claude Code

Do not interpret the current Figma screens as final UI designs.

Use them as:

- wireframes;
- route/state references;
- functional scope;
- responsive coverage;
- product logic;
- a checklist of required pages and states.

The correct engineering posture is:

1. Preserve the product logic.
2. Respect Phase 1 scope.
3. Build flexible components and routes.
4. Expect final design polish and flow arrangement to change.
5. Keep the customer rule central: browse freely, gate critical actions, preserve context after authentication.
