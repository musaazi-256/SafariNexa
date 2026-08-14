# SafariNexa Design Project Recovery Report

**Report date:** 5 July 2026  
**Latest handoff update:** 6 July 2026  
**Status:** Recovered project assessment plus updated Figma handoff status  
**Scope:** SafariNexa shared design system, Customer App, Business Portal, and Admin Portal

## 1. Executive summary

### 1.0 Current handoff note — 6 July 2026

This document began as a recovery report, so some early sections describe the state of the Figma files before the latest design pass. The current handoff status is now substantially fuller:

- Customer App: 91 mobile-first designed screens across browsing, discovery, detail, planning, booking, account-gated checkout, trips, reviews, support, and resilience states, plus dedicated tablet and desktop responsive variants for the core customer journey.
- Business Portal: 62 designed screens across onboarding, verification, listings, bookings, messages, payouts, reporting, support, and resilience states.
- Admin Portal: 65 designed screens across verification, business review, evidence review, users/access, moderation, support, operations, reporting, and resilience states.
- Total product coverage: 218 designed screens across the three product files.
- Critical prototypes have been added for customer guest-to-account booking, business verification submission, and admin business-review approval.
- Developer handoff boards have been added to the setup pages of the Customer App, Business Portal, and Admin Portal.

The original recovery findings are retained because they explain the origin and reasoning of the project. The later sections should be treated as the current implementation handoff.

SafariNexa is being designed as a multi-sided East African travel marketplace. The product ecosystem serves travelers, tourism businesses, and internal administrators through three separate product files supported by one shared Figma design-system library.

The shared design system is substantially more mature than the original recovered plan suggests. Its foundations, documentation, tokens, styles, and first sixteen component or pattern families are already in place. It contains 29 pages, nine variable collections, 310 variables, twelve text styles, five elevation styles, reusable logo artwork, and a published component library.

The product applications are at an earlier and uneven stage:

- The Customer App has implemented onboarding and a large authentication flow, while discovery, trip planning, and bookings remain empty canvases.
- The Business Portal has implemented onboarding and authentication, while verification, listings, bookings, and messaging remain empty.
- The Admin Portal has implemented authentication and a verification-queue dashboard, while business review, user/access management, and system operations remain empty.

The clearest interpretation is that the project first established shared foundations, then proved their use through onboarding/authentication and one operational admin screen. The next intended step was to continue through marketplace discovery, booking, trip, verification, business, and administrative workflows using the shared library.

The main risks are not a lack of design-system structure, but unfinished product coverage, inconsistent use of Geist and Inter, hardcoded product-screen styling, three malformed CSS variable mappings, missing source-code alignment, and the need to confirm current edit/publish access before changing the library.

## 2. Evidence reviewed

This report is based on:

- `DESIGN_SYSTEM_PLAN.md`, the recovered Phase 0 proposal;
- the SafariNexa Design System Figma file;
- the Customer App Figma file;
- the Business Portal Figma file;
- the Admin Portal Figma file;
- the published SafariNexa Figma library inventory;
- nine recovered brand-guide page renders in `tmp/pdfs/`;
- recoverable Git/Codex checkpoints in the project folder.

The original verbatim conversation is no longer available. Statements about intent are therefore reconstructed from the plan, Figma documentation, component descriptions, page architecture, and implemented screens.

## 3. Product vision

The recovered plan describes SafariNexa as a reusable product ecosystem spanning:

- a marketing website;
- a traveler/customer platform;
- a business/provider portal;
- an internal administration portal;
- responsive web at launch;
- future native-mobile delivery without rebuilding the design language.

The central product promise is captured on the Figma cover:

> Travel confidently. Build consistently.

The library is described as a mobile-ready marketplace system for East African travel. Its architecture suggests a platform intended to support accommodations, tours, guides, restaurants, transport, activities, bookings, payments, verification, reviews, itineraries, and business operations.

## 4. Brand direction already established

### 4.1 Core identity

The design language uses:

- Deep Forest Green as the brand and trust anchor;
- Safari Gold for highlights, ratings, celebration, and selected emphasis;
- Warm Ivory `#FBFAF5` as the brand page background and distinctive brand surface;
- dark blue/charcoal surfaces for dense operational navigation;
- a road-curve S/N monogram and repeated road motif;
- visual themes of movement, scenic routes, nature, trust, warmth, and approachability.

### 4.2 Color decisions

The original identity green is `#0F8F46`, but the plan correctly identified that white text on this color is insufficient for normal-sized AA text. The darker green 600, `#0C763A`, was therefore selected for default primary controls.

The intended product rules were:

- use green for primary actions, trust, success, and brand anchoring;
- reserve gold for accent and emphasis rather than primary button backgrounds;
- avoid white text on gold;
- use ivory selectively rather than as the only application background;
- use white/stone surfaces for forms, tables, dashboards, and comparison-heavy screens;
- preserve official logo lockups rather than redrawing the mark in product components.

### 4.3 Logo system

The design-system file includes nine reusable logo source components:

- horizontal and stacked arrangements;
- green, deep, white, gold, and cream backgrounds;
- green, gold, and light mark treatments.

These are already used as instances in the design-system documentation and product files.

## 5. Shared design system: what already exists

### 5.1 Overall maturity

The shared library contains:

| Asset | Current inventory |
|---|---:|
| Figma pages | 29 |
| Variable collections | 9 |
| Variables | 310 |
| Text styles | 12 |
| Effect/elevation styles | 5 |
| Foundation documentation pages | 10 plus Getting Started |
| Component/pattern pages | 16 |
| Published library | Yes |

This is not an empty or early-stage library. Foundations, documentation structure, and a broad core component layer have already been produced.

### 5.2 Variable architecture

| Collection | Modes | Variables | Purpose |
|---|---|---:|---|
| Primitives | Value | 57 | Brand, neutral, status, and overlay colors |
| Color | Light, Dark | 76 | Semantic, shadcn-compatible color roles |
| Spacing | Value | 16 | Four-pixel-grid spacing scale |
| Sizing | Value | 100 | Controls, icons, content widths, and other dimensions |
| Radius | Value | 9 | Corner-radius scale |
| Typography | Value | 26 | Font families, sizes, line heights, and weights |
| Effects | Value | 7 | Effect-related values |
| Motion | Value | 10 | Durations and easing values |
| Breakpoint | Value | 9 | Responsive documentation references |

Positive findings:

- Semantic colors have Light and Dark modes.
- Primitive variables are hidden from normal property pickers using empty scopes.
- Semantic variables have explicit scopes rather than `ALL_SCOPES`.
- Every inspected variable has WEB code syntax.
- Naming broadly follows shadcn/CSS semantics such as `background`, `foreground`, `primary`, `border`, `ring`, `sidebar`, and status roles.

Known defects:

- `base/white` maps to `var(--ba-e-white)`.
- `base/black` maps to `var(--ba-e-black)`.
- `base/transparent` maps to `var(--ba-e-tran-parent)`.

These should be corrected to the intended `--base-*` spellings before code synchronization.

### 5.3 Typography and elevation styles

Text styles already present:

- Display
- Heading/1 through Heading/4
- Body/Large, Body/Default, and Body/Small
- Label/Default
- Caption
- Button
- Data/Large

Effect styles already present:

- Elevation/0 through Elevation/4

The library components use Geist. Some product-screen content—most visibly the Admin verification dashboard—uses hardcoded Inter. This creates a live typography conflict that should be resolved before further screen production.

### 5.4 Foundation documentation

| Page | What is documented |
|---|---|
| Getting Started | Library use, semantic-variable guidance, touch targets, focus, responsive behavior |
| Brand | Logo components, brand mood, tone, usage, and do/don't guidance |
| Color | Brand and semantic palettes, primary/accent use, swatches |
| Typography | Type roles, specimens, and form examples |
| Elevation & Layers | Base through modal/raised layers and approved usage |
| Iconography | Icon rules, grid, sizing, and optical guidance |
| Labels & Status | Status chips, labels, and communication patterns |
| Grid & Spacing | Desktop/tablet/mobile grids and spacing demonstrations |
| Radius & Motion | Radius scale and motion principles |
| Responsive & Mobile | Breakpoints, responsive behavior, and mobile foundations |

The documentation is unusually strong for this stage: it includes written usage rules and accessibility intent, not only visual specimens.

### 5.5 Component and pattern pages

| Family | Evidence already in place |
|---|---|
| Button | Primary/secondary, three sizes, five interaction states, 44–48px touch guidance |
| Icons & Icon Button | Reusable Lucide-compatible icons and ghost/primary icon-button sets |
| Badge & Status | Metadata and system-status treatments separated from interactive chips |
| Avatar | Image/initial/icon fallbacks, size and presence states |
| Skeleton & Spinner | Layout-preserving loading and reduced-motion guidance |
| Utilities | Separator, progress, and tooltip families |
| Selection Controls | Checkbox, radio, switch, toggle, and mobile label-row guidance |
| Form Inputs | Input states, persistent labels, assistive text, and error behavior |
| Cards | Core surface/padding/state combinations |
| Overlays | Dialogs and bottom sheets with responsive and accessibility rules |
| Navigation | Desktop/mobile presentation and navigation items |
| Menus & Popovers | Dropdown, selection, keyboard, dismissal, and mobile-sheet behavior |
| Date & Time | Calendar days, date constraints, ranges, timezone, unavailable states |
| Search & Filters | Filter chips/bar, desktop/mobile behavior, persistence, empty results |
| Marketplace Cards | Accommodation, tour, and guide configurations in vertical/horizontal layouts |
| Data Tables & Lists | Accommodation, booking, payment, and verification presets plus loading/empty/selection states |

Published library search confirms reusable assets including Button/Core, Icon Button/Ghost, Icon Button/Primary, Select, Date Picker Trigger, navigation icons, and text styles.

## 6. Customer App: recovery snapshot before latest design pass

### 6.1 Intended scope

The Customer App is intended to support traveler onboarding, account creation, discovery, planning, booking, payment, trip management, and later reviews/communication.

### 6.2 Page maturity

| Page | Status | Evidence |
|---|---|---|
| Setup & Dependencies | Scaffolded | Shared-library instructions and readiness card |
| Onboarding - Customer | Implemented | Mobile welcome flow, logo, illustration, and 10 library instances |
| Authentication | Substantially implemented | Large multi-screen flow; 1,751 indexed nodes, 656 frames, 476 instances |
| Home & Discovery | Empty in recovery snapshot | Page existed with no canvas content before the later screen-production pass |
| Trip Planning | Empty in recovery snapshot | Page existed with no canvas content before the later screen-production pass |
| Bookings | Empty in recovery snapshot | Page existed with no canvas content before the later screen-production pass |
| Archive | Empty in recovery snapshot | Reserved page |

At recovery time, the customer work was concentrated in entry and identity flows. The later handoff pass expanded this into 91 designed customer screens; see Section 19 for the current status.

## 7. Business Portal: recovery snapshot before latest design pass

### 7.1 Intended scope

The Business Portal is meant for accommodation operators, tour operators, guides, restaurants, transport providers, and activity providers. Its planned responsibilities include onboarding, identity/verification, listings, availability, bookings, messaging, payouts, and operational reporting.

### 7.2 Page maturity

| Page | Status | Evidence |
|---|---|---|
| Setup & Dependencies | Scaffolded | Shared-library instructions and readiness card |
| Onboarding - Business | Implemented | Desktop onboarding overview and shared-library instances |
| Authentication | Implemented | Business-owner account flow; 137 indexed nodes and 47 instances |
| Verification | Empty in recovery snapshot | Page existed with no canvas content before the later screen-production pass |
| Listings | Empty in recovery snapshot | Page existed with no canvas content before the later screen-production pass |
| Bookings & Messages | Empty in recovery snapshot | Page existed with no canvas content before the later screen-production pass |
| Archive | Empty in recovery snapshot | Reserved page |

At recovery time, the portal had a credible entrance flow but no complete provider-management workspaces. The later handoff pass expanded this into 62 designed business-portal screens; see Section 19 for the current status.

## 8. Admin Portal: recovery snapshot before latest design pass

### 8.1 Intended scope

The Admin Portal is designed for internal verification, moderation, business review, user/access control, bookings oversight, and system operations.

### 8.2 Page maturity

| Page | Status | Evidence |
|---|---|---|
| Setup & Dependencies | Scaffolded | Shared-library instructions and readiness card |
| Admin Login | Implemented | Invitation/account flow; 125 indexed nodes and 43 instances |
| Verification Queue | Implemented concept screen | 1,440×900 dashboard with sidebar, KPIs, queue table, and shared buttons |
| Business Review | Empty in recovery snapshot | Page existed with no canvas content before the later screen-production pass |
| Users & Access | Empty in recovery snapshot | Page existed with no canvas content before the later screen-production pass |
| System Operations | Empty in recovery snapshot | Page existed with no canvas content before the later screen-production pass |
| Archive | Empty in recovery snapshot | Reserved page |

### 8.3 Verification Queue design

The implemented queue contains:

- a dark sidebar with SafariNexa logo;
- Verification, Businesses, Bookings, Users, and Settings navigation;
- Export and Assign Review actions;
- Pending, Approved Today, and Needs Info KPI cards;
- a business-submission table;
- sample accommodation, tour-operator, and guide submissions;
- status and Review actions.

This page demonstrates the intended operational visual language but also exposes the principal implementation inconsistency: library buttons use Geist and semantic variables, while much of the surrounding screen uses hardcoded Inter, colors, dimensions, and absolute positioning.

## 9. What the original plan was

### 9.1 Design-system goal

The plan was to create one reusable, accessible system whose Figma tokens and component APIs align with product code wherever practical. The default web implementation reference was shadcn/ui, with Dice UI proposed for advanced accessible controls and SafariNexa-specific composition for marketplace, booking, trip, verification, and operations.

### 9.2 Platform strategy

The planned delivery model was:

- responsive web first;
- mobile-responsive behavior documented from the beginning;
- semantic tokens and component anatomy reusable by a future native app;
- no assumption that shadcn web components could simply be copied into native mobile;
- Light and Dark token architecture even if Dark mode did not launch immediately.

### 9.3 Accessibility target

The project targeted WCAG 2.2 AA with:

- 4.5:1 normal-text contrast and 3:1 large-text/component contrast;
- visible keyboard focus;
- logical focus order;
- persistent labels;
- actionable error recovery;
- status communicated with text/icon as well as color;
- 44×44px minimum touch targets where feasible;
- reduced-motion support;
- usable mobile alternatives for data tables.

### 9.4 Original phased sequence

| Phase | Planned work | Current interpretation |
|---|---|---|
| 0. Discovery | Inspect files, confirm scope, font, modes, code framework, and access | Recovered and repeated in this assessment |
| 1. Foundations | Variables, aliases, syntax, scopes, type/effect styles, contrast | Largely completed; repair and audit remain |
| 2. Documentation | Brand, color, type, elevation, icons, spacing, radius, motion, responsive/mobile | Largely completed |
| 3. Components | Core controls through product-specific patterns | Core and several marketplace/data patterns completed; major product families remain |
| 4. Integration & QA | Code Connect, accessibility, binding, naming, responsive audits | Not demonstrably completed; blocked by missing code repository and remaining inconsistencies |

## 10. Recovery gaps that drove the later design pass

### 10.1 Search and marketplace

At recovery time, shared search/filter and listing-card patterns existed, but customer discovery pages were not yet populated. The later design pass added screen-level coverage for destination browsing, results, details, date/guest selection, map/list views, active filters, sorting, and empty/no-availability states.

### 10.2 Booking and payments

At recovery time, the following were planned but not yet visible as a complete screen family. They are now represented in the current handoff coverage:

- price breakdown;
- booking summary;
- availability and participant selectors;
- booking status timeline;
- payment method and mobile-money instructions;
- processing, receipt, refund, payout, and commission states.

### 10.3 Trip and itinerary

At recovery time, the Trip Planning page was empty. The later pass expanded the customer set to include trip cards, date ranges, itinerary days and activities, travel segments, conflict warnings, cost summaries, sharing, and empty-trip states.

### 10.4 Trust, verification, and moderation

At recovery time, verification and data-table primitives existed, but end-to-end provider verification and admin review were incomplete. The later pass added provider verification, admin evidence review, decision panels, rejection/request-info paths, audit timelines, and document-viewer coverage.

### 10.5 Reviews and communication

Rating input/summary, review cards, business responses, moderation, notifications, and message previews were identified as gaps in the recovery pass and then represented in the broader product-page architecture.

### 10.6 Business and admin operations

The recovery pass identified missing provider and internal workflows for listing management, availability, booking queues, business review, users/access, reports, payouts/revenue, and system operations. These areas are now covered at design-handoff level; final production behavior still depends on owner decisions and engineering integration.

## 11. Design and implementation issues found

### 11.1 Typography conflict

- The recovered plan recommends Geist as the product UI family.
- Shared components use Geist.
- Existing Admin screen content uses Inter extensively.

Recommendation: make Geist the default product family, reserve approved brand-display fonts for marketing, and migrate hardcoded Inter screen layers to shared text styles unless the team explicitly chooses Inter instead.

### 11.2 Hardcoded product-screen styling

The Admin queue includes semantic variable-backed component instances but hardcoded colors, radii, type, and absolute layouts around them. This weakens theme switching and code parity.

Recommendation: refactor product screens toward shared components, semantic variables, text styles, and auto layout before treating them as implementation-ready.

### 11.3 Malformed code syntax

Correct the three `ba-e`/`tran-parent` WEB syntax typos before exporting or mapping tokens.

### 11.4 Naming quality

The supplied file names contain visible spelling errors:

- `SafariNexa Design Sytem`
- `Bussiness Poatal`

Recommendation: rename to `SafariNexa Design System` and `Business Portal` after checking whether external references or integrations depend on the current names.

### 11.5 Missing code source of truth

No application repository is present in this workspace. Code Connect, React API matching, production-token verification, and implementation status cannot be validated from Figma alone.

### 11.6 Access uncertainty

The recovered plan recorded missing Figma edit access as the blocker. Read-only and plugin inspection now work, but a Phase 1 write should still begin with an explicit permission check and a small reversible change only after approval.

## 12. Recommended continuation plan

### Stage A — Stabilize the library

1. Confirm Figma edit and publish access.
2. Confirm Geist as the UI font and whether Lufga is licensed for digital display use.
3. Correct malformed WEB code syntax.
4. Audit all variables for alias integrity, scopes, and Light/Dark values.
5. Audit all component pages for hardcoded fills, spacing, radii, and typography.
6. Confirm publication status and product-file subscriptions.

### Stage B — Normalize existing product designs

1. Migrate Customer, Business, and Admin entry flows to shared text styles and semantic variables.
2. Replace hardcoded screen-level controls with library instances.
3. Convert brittle absolute layouts to responsive auto-layout structures where appropriate.
4. Validate desktop, tablet, and mobile behavior.
5. Add loading, empty, error, permission, offline, and validation states.

### Stage C — Complete the customer journey

Recommended order:

1. Home and discovery.
2. Search results and filters.
3. Listing details.
4. Date, guest, and availability selection.
5. Booking and payment.
6. Booking confirmation and management.
7. Trip planning and itinerary.
8. Reviews and communication.

### Stage D — Complete business operations

Recommended order:

1. Verification submission and status.
2. Listing creation/editing.
3. Availability and pricing.
4. Booking queue and booking detail.
5. Messages and notifications.
6. Payouts, commission, and reporting.

### Stage E — Complete administration

Recommended order:

1. Business-review detail and document viewer.
2. Decision/rejection workflows.
3. Users and access control.
4. Booking/moderation oversight.
5. System operations, audit history, and reporting.

### Stage F — Integration and QA

1. Connect the production repository.
2. Map components and variables through Code Connect.
3. Run WCAG contrast and keyboard/focus audits.
4. Run token-binding and naming audits.
5. Verify responsive transformations and touch targets.
6. Validate Light/Dark behavior.
7. Publish only after owner review.

## 13. Decisions still required

1. Confirm Geist or choose Inter as the single product UI family.
2. Confirm whether Lufga is licensed and in scope.
3. Confirm whether Dark mode ships now or remains prepared but deferred.
4. Confirm the web base: shadcn with Radix or Base UI.
5. Confirm Lucide as the icon source.
6. Supply the production code repository.
7. Confirm Figma edit and publish permissions.
8. Confirm whether mobile means responsive web only for this phase or includes native components.
9. Approve the order of customer, business, and admin workflow completion.
10. Confirm whether messaging remains in the first release.

## 14. Overall assessment from the original recovery pass

The project has a strong design-system foundation and a coherent product thesis. The difficult foundational decisions—semantic color architecture, responsive principles, accessible component behavior, marketplace composition, and operational data patterns—have mostly been addressed.

At the original recovery point, the project was not yet a complete product design. It was best described as:

- **Design system:** advanced foundation / mid component build;
- **Customer App:** onboarding and authentication prototype;
- **Business Portal:** onboarding and authentication prototype;
- **Admin Portal:** authentication plus one operational dashboard concept;
- **Code integration:** unverified;
- **Production readiness:** not yet ready for full handoff.

That recovery recommendation drove the later work: complete one end-to-end customer booking journey, widen into business/admin operations, add resilience states, and prepare developer handoff boards. Section 19 onward should be used for the current handoff assessment.

## 15. Source links

- [SafariNexa Phase 1 MVP proposal](https://musaazi.vercel.app/proposal/safarinexa)
- [Customer App](https://www.figma.com/design/NNar1EsoBEKuH93WLUV5HF/Customer-App)
- [SafariNexa Design System](https://www.figma.com/design/L87CNkRRey3IL94we3e9uP/SafariNexa-Design-Sytem)
- [Business Portal](https://www.figma.com/design/ltl07F6oUOGrWsNAxndJOP/Bussiness-Poatal)
- [Admin Portal](https://www.figma.com/design/OqhZEfH22Qa3TV9uatLVER/Admin-Portal)

## 16. Original commercial proposal and engagement frame

The live proposal adds an important layer of context: the work was not commissioned only as a Figma library. It was positioned as a **Product Discovery, UX Strategy, and Design Engagement** for the SafariNexa Phase 1 MVP.

### 16.1 Engagement facts

| Item | Proposal commitment |
|---|---|
| Client | GIT |
| Prepared by | Ignatius Musaazi, Senior Product Designer / Product Design Strategist |
| Proposal date | June 2026 |
| Engagement value | UGX 4,500,000 |
| Duration | 6 weeks |
| Weekly effort | 24 hours |
| Daily cadence | 4 hours per day, 6 days per week |
| Total estimated effort | 144 hours |
| Effective hourly rate | UGX 31,250 |
| Effective daily rate | UGX 125,000 |
| Effective weekly rate | UGX 750,000 |

The six-week engagement was intended to design the foundation for the product's months 1–8 MVP roadmap. The months 1–8 period describes the product launch roadmap; it does not mean that all product design work was expected to last eight months.

### 16.2 Services included

The proposal covered:

- product discovery;
- UX strategy;
- feature prioritisation;
- user journeys and operational flows;
- information architecture;
- design-system creation;
- responsive UI design;
- prototyping;
- developer handoff and implementation guidance.

Its stated value was risk reduction: decide the flows, system states, operational rules, and reusable patterns before engineering committed to expensive implementation paths.

### 16.3 Payment milestones

| Milestone | Amount | Trigger |
|---|---:|---|
| Project kickoff | 40% / UGX 1,800,000 | Due before commencement |
| UX architecture approval | 30% / UGX 1,350,000 | After IA, flows, and wireframes were approved |
| Final design handoff | 30% / UGX 1,350,000 | Before final high-fidelity, prototype, and documentation handoff |

## 17. Phase 1 MVP scope from the proposal

### 17.1 Product thesis

The proposal framed SafariNexa as a connected marketplace with four actors:

- Tourist / Customer
- Business Provider
- Admin Team
- External Integrations

The key system relationship was:

> Customer booking → Business Portal booking → Admin monitoring → Payment reporting

This matters because the intended deliverable was not a collection of isolated screens. Every customer action was meant to create corresponding business, administrative, payment, and notification effects.

### 17.2 Travel lifecycle

The customer experience was organized around six stages:

1. Discover
2. Plan
3. Book
4. Travel
5. Review
6. Return

### 17.3 Core MVP modules

| Module | Phase 1 interpretation |
|---|---|
| User accounts | Registration, login, profile, and wishlists |
| Accommodation | Hotels and guesthouses with instant booking |
| Payments | MTN, Airtel, Visa, and Mastercard through Flutterwave |
| Safaris & tours | Top operators and priority Ugandan destinations |
| Business Portal | Hotel/operator self-onboarding and management |
| Admin Portal | Listing approval, users, and revenue monitoring |
| Basic trip planner | Manual itinerary builder |
| Reviews | Post-booking reviews for Phase 1 categories |
| Destinations | Kampala and major national parks |
| Restaurants | Directory and table reservation; no delivery |
| Transport | Airport transfers and Kampala special hire only |
| Safety | SOS, emergency directory, and advisories |
| Notifications | Push/SMS confirmations and reminders |

### 17.4 Deliberately excluded expansion modules

The proposal explicitly parked:

- restaurant delivery;
- a full transport marketplace;
- boda boda, ferry, matatu, and broader bus services;
- events and ticketing;
- religious tourism;
- nightlife;
- AI trip planning;
- native mobile applications.

Commercial exclusions also included development, hosting, QA testing, full copywriting, photography/content creation, payment-provider setup, API documentation, legal policies, full brand identity, and long-term product management.

### 17.5 Proposed technical architecture

The proposal assumed:

- Next.js, React, and Tailwind CSS for responsive web clients;
- Node.js / Next.js serverless services or an API gateway;
- REST endpoints, authentication middleware, rate limits, and domain modules;
- PostgreSQL for transactions;
- Redis for sessions and search-related caching;
- cloud object storage for images and verification documents;
- Flutterwave, maps, SMS, email, and analytics integrations.

This architecture was an assumption to validate with developers, not evidence that a production implementation already existed.

## 18. Discovery workshops and collaboration model

### 18.1 Workshop plan

| Workshop | Participants and focus | Intended output |
|---|---|---|
| Business Strategy and MVP Scope | 2–3 hours with management, product owner, lead designer, and development lead | MVP decision, revenue assumptions, priority features, scope boundaries |
| Customer and Business Journeys | 2–3 hours on tourist booking, provider operations, support, and refunds | User journeys, actor responsibilities, operational gaps |
| Technical and Integration Alignment | 2–3 hours with design and development | Technical assumptions, API dependencies, integration risks |
| UX Validation and Handoff Review | 2 hours | Approved flows, implementation priorities, handoff notes, open-issue log |

### 18.2 Developer collaboration checkpoints

The plan expected developers to be involved throughout:

- after discovery: confirm technical feasibility and integrations;
- after information architecture: confirm routes, data models, and permissions;
- after wireframes: confirm API requirements and edge cases;
- before high-fidelity UI: confirm component strategy and reusable patterns;
- during handoff: review responsive behavior, states, and implementation notes.

## 19. Current Figma design handoff status

### 19.1 Product files

| Figma file | Current role | Current handoff status |
|---|---|---|
| Customer App | Traveler-facing marketplace and booking experience | Full screen architecture, high-fidelity screen set, protected booking flow, prototype, states, and developer handoff board |
| Business Portal | Provider onboarding and operations workspace | Full screen architecture, verification/listing/booking/message/payout coverage, prototype, states, and developer handoff board |
| Admin Portal | Internal verification, moderation, operations, and support tooling | Full screen architecture, business-review prototype, support/operations coverage, states, and developer handoff board |
| SafariNexa Design System | Shared brand, tokens, foundations, components, and UI guidance | Existing shared library used as the visual and interaction foundation |

### 19.2 Designed-screen inventory

| Product | Designed screens | Additional handoff coverage |
|---|---:|---|
| Customer App | 91 | Guest browsing, account-gated critical actions, checkout continuation, trip management, reviews, support, loading/empty/error/offline/session states |
| Business Portal | 62 | Verification submission, listing operations, booking management, messaging, payouts, reporting, support, loading/empty/error/offline/session states |
| Admin Portal | 65 | Verification queue, business review, evidence review, decision flow, users/access, moderation, support, operations, reporting, loading/empty/error/offline/session states |
| Total | 218 | End-to-end project coverage across customer, provider, and internal operations |

### 19.3 Critical prototype flows

| Flow | Purpose | Handoff behavior |
|---|---|---|
| Guest booking → account → checkout | Demonstrates that customers can browse before registration but must authenticate before booking/payment | Preserves selected item, dates, guests, and checkout step after sign-in or account creation |
| Business verification → submission → decision | Demonstrates provider onboarding and verification review readiness | Covers form progress, document submission, status, and decision outcome |
| Admin business review → evidence → approval | Demonstrates internal review and approval workflow | Covers queue triage, evidence inspection, risk notes, decision panel, and audit outcome |

### 19.4 Account and access rules

Customer browsing remains open before registration:

- browse destinations, listings, tours, stays, restaurants, transport, and experiences;
- search, filter, sort, compare, and inspect details;
- view reviews, availability hints, policies, maps, and public provider details.

Critical actions require an account:

- book, reserve, or pay;
- save to wishlist;
- message a provider;
- submit a review;
- manage trips, cancellations, refunds, or support cases;
- access personal itinerary, traveler profile, payment methods, and notifications.

When a guest is interrupted by an account gate, the design must restore the original context after authentication:

- listing or product ID;
- selected dates;
- guests/participants;
- room, tour, transport, or restaurant option;
- price quote;
- checkout step;
- pending coupon or promo code, if any.

## 20. Six-week delivery plan from the proposal

The proposal defined a six-week engagement at 24 hours per week, structured as 4 hours per day for 6 days per week. The practical rhythm below turns that commercial plan into a design and handoff delivery plan.

### 20.1 Weekly breakdown

| Week | Theme | Intended outcome |
|---|---|---|
| Week 1 | Discovery, scope, product model, and IA | Confirm MVP boundaries, actors, route map, user journeys, and system responsibilities |
| Week 2 | Design-system foundations and wireframe architecture | Establish tokens, core components, navigation models, and low-fidelity screen coverage |
| Week 3 | Customer App high-fidelity flows | Complete discovery, details, guest browsing, booking/account gate, checkout, trips, reviews, and support |
| Week 4 | Business Portal high-fidelity flows | Complete provider verification, listings, bookings, messaging, payouts, reporting, and support |
| Week 5 | Admin Portal high-fidelity flows | Complete verification queue, business review, evidence review, users/access, moderation, operations, and support |
| Week 6 | Prototyping, responsive/state QA, and developer handoff | Link critical prototypes, document states, add responsive guidance, finalize acceptance criteria, and prepare handoff |

### 20.2 Day-by-day work plan

| Week | Day | 4-hour focus | Output |
|---|---:|---|---|
| 1 | Day 1 | Kickoff, stakeholder goals, commercial model, MVP assumptions | Confirmed project brief and decision log |
| 1 | Day 2 | Actor mapping and marketplace lifecycle | Tourist, business, admin, and integration responsibility map |
| 1 | Day 3 | Customer journey mapping | Discover → Plan → Book → Travel → Review → Return journey |
| 1 | Day 4 | Business and admin operations mapping | Provider onboarding, listing, booking, payout, verification, and support flows |
| 1 | Day 5 | Information architecture | Product sections, route groups, navigation, and page inventory |
| 1 | Day 6 | Scope review and approval | Approved MVP screen architecture and open questions |
| 2 | Day 1 | Design-system audit and token decisions | Color, type, spacing, radius, elevation, motion, breakpoint baseline |
| 2 | Day 2 | Component inventory | Core controls, forms, cards, navigation, filters, tables, overlays |
| 2 | Day 3 | Marketplace patterns | Listing cards, search, filters, availability, reviews, price breakdowns |
| 2 | Day 4 | Operational patterns | Verification tables, document rows, decision panels, audit timelines |
| 2 | Day 5 | Wireframe rails | Low-fidelity screen groups for customer, business, and admin |
| 2 | Day 6 | Wireframe review | Approved flow logic before high-fidelity production |
| 3 | Day 1 | Customer home, discovery, search, filters | Browsable public marketplace entry points |
| 3 | Day 2 | Listing/detail flows | Accommodation, tour, guide, restaurant, transport, and activity detail coverage |
| 3 | Day 3 | Booking path and account gate | Guest-to-account transition and checkout continuation |
| 3 | Day 4 | Checkout, confirmation, trips | Payment, receipt, trip detail, itinerary, cancellation/support |
| 3 | Day 5 | Reviews, profile, notifications | Post-booking feedback and account-management surfaces |
| 3 | Day 6 | Customer QA pass | Customer states, accessibility notes, and prototype checkpoints |
| 4 | Day 1 | Business onboarding and verification | Provider profile, documents, submission, status, resubmission |
| 4 | Day 2 | Listings and inventory | Create/edit listings, media, pricing, availability, policies |
| 4 | Day 3 | Booking operations | Queue, booking detail, accept/decline, calendar conflicts |
| 4 | Day 4 | Messaging and support | Customer/provider communication, disputes, support escalation |
| 4 | Day 5 | Payouts and reporting | Earnings, commissions, payout status, statements, analytics |
| 4 | Day 6 | Business QA pass | Provider states, permissions, responsive notes, prototype checkpoints |
| 5 | Day 1 | Admin dashboard and verification queue | Triage dashboard, KPIs, filters, review routing |
| 5 | Day 2 | Business review and evidence | Document viewer, risk signals, profile comparison, notes |
| 5 | Day 3 | Decision workflows | Approve, reject, request info, suspend, audit history |
| 5 | Day 4 | Users, access, and moderation | Roles, permissions, user status, content/review moderation |
| 5 | Day 5 | Operations, support, reporting | Tickets, incidents, revenue, booking oversight, system health |
| 5 | Day 6 | Admin QA pass | Internal states, auditability, permissions, prototype checkpoints |
| 6 | Day 1 | End-to-end prototype linking | Customer booking, business verification, admin review flows |
| 6 | Day 2 | Resilience states | Loading, empty, error, offline, permission, disabled, expired-session states |
| 6 | Day 3 | Responsive handoff | Mobile/tablet/desktop rules and breakpoint behavior |
| 6 | Day 4 | Accessibility and content review | Contrast, focus, labels, touch targets, errors, reduced motion |
| 6 | Day 5 | Developer handoff boards | Implementation order, acceptance criteria, analytics/audit notes |
| 6 | Day 6 | Final handover | Walkthrough, sign-off checklist, remaining risks, next sprint plan |

## 21. Recommended engineering implementation order

The design work should be implemented in vertical slices rather than by building every static page first.

### 21.1 Slice 1 — Shared shell and design-system integration

Build:

- app shells for customer, business, and admin;
- shared navigation, layout, typography, color tokens, forms, buttons, cards, tables, dialogs, and status components;
- authentication primitives;
- responsive breakpoints and base accessibility behavior.

Acceptance:

- all apps use the same token source;
- buttons, inputs, cards, tables, and dialogs match Figma;
- keyboard focus is visible;
- mobile touch targets meet the documented minimums.

### 21.2 Slice 2 — Customer discovery and listing details

Build:

- public browsing;
- home/discovery;
- search results;
- filters and sorting;
- listing detail pages;
- availability/pricing preview.

Acceptance:

- guest users can browse without an account;
- empty/no-result/loading/error states exist;
- listing detail pages expose the data needed for booking.

### 21.3 Slice 3 — Account-gated booking and checkout

Build:

- account gate from booking CTA;
- sign-in/create-account continuation;
- traveler details;
- review booking;
- payment initiation;
- confirmation/receipt.

Acceptance:

- unauthenticated users cannot book/pay;
- selected listing, dates, guests, and checkout step survive authentication;
- failed payment, expired session, and unavailable inventory states are handled.

### 21.4 Slice 4 — Business verification and listing operations

Build:

- provider registration;
- verification submission;
- listing creation/editing;
- availability and pricing;
- booking queue.

Acceptance:

- unverified providers have limited access;
- verification status is visible and actionable;
- listings cannot go live until required approval rules are satisfied.

### 21.5 Slice 5 — Admin verification and operations

Build:

- verification queue;
- business review detail;
- document/evidence review;
- decision workflows;
- audit log;
- users/access basics.

Acceptance:

- every admin decision creates an audit record;
- request-info, approve, reject, and suspend outcomes are distinct;
- admin permissions prevent unsafe actions.

### 21.6 Slice 6 — Trips, reviews, messaging, support, and reporting

Build:

- customer trip management;
- reviews;
- messaging;
- provider/customer/admin support;
- payouts, revenue, and operational reports.

Acceptance:

- post-booking lifecycle is complete;
- reviews are tied to eligible completed bookings;
- support cases can move between customer, business, and admin contexts.

## 22. Final handoff checklist

Before engineering treats the design package as implementation-ready, confirm:

- Figma links are shared with edit/comment access for the product, engineering, and stakeholder groups.
- The shared design system is published and product files are subscribed to the correct library version.
- Product file names are corrected to `SafariNexa Design System` and `Business Portal` if no external dependency prevents renaming.
- Token syntax typos for `base/white`, `base/black`, and `base/transparent` are corrected.
- Geist vs Inter is resolved as a single UI typography decision.
- Responsive behavior is verified at 390, 768, and 1440px.
- Every critical action has loading, empty, error, permission, offline, disabled, and expired-session handling.
- Analytics events are mapped for search, listing view, account gate, booking start, payment attempt, booking confirmation, verification submission, admin decision, and support escalation.
- Admin and business actions include audit-log requirements.
- Payment, SMS, email, maps, storage, and analytics integrations have named owners.
- Legal/privacy, cancellation, refund, and provider terms content is supplied before final launch UI copy is frozen.

## 23. Remaining recommended Figma enhancements

The core screen package is now broad enough for handoff. The remaining Figma refinements are:

1. Extend the new Customer Responsive Variants board beyond the core customer journey only if the team wants every secondary/account/support screen represented at tablet and desktop.
2. Add one consolidated project roadmap board, preferably in the Design System file or on each product setup page, summarizing the week-by-week delivery plan in Section 20.
3. Add an analytics/audit-event matrix board for engineering and product review.
4. Add final stakeholder sign-off stamps after review.
5. If development starts immediately, add Code Connect mappings once the production repository and component names are available.

## 24. Open questions and owner decisions

The design package is now broad enough for implementation planning, but these decisions still need product, business, or engineering ownership:

| Area | Decision needed | Suggested owner |
|---|---|---|
| Search | Global search vs category-specific search behavior, ranking, and filters | Product + Engineering |
| Availability | Real-time inventory sync vs manually managed availability | Product + Engineering |
| Payments | Confirm Flutterwave setup, mobile money, cards, refunds, failed payments, and payout rules | Business + Engineering |
| Provider verification | Required documents per provider category and expiry/reverification rules | Operations + Legal |
| Admin permissions | Role model for reviewer, support, finance, super admin, and read-only access | Operations + Engineering |
| Messaging | Whether provider/customer messaging is first release or staged after booking | Product |
| Notifications | SMS, email, and push provider choices plus message templates | Product + Engineering |
| Legal content | Terms, privacy, cancellation, refund, safety, and provider policies | Legal/Business |
| Content | Sample listings, photos, destination descriptions, amenity taxonomy, and category copy | Content/Marketing |
| Analytics | Final event taxonomy and dashboard ownership | Product + Engineering |

## 25. Proposal commitments compared with current handoff evidence

| Proposal area | Current evidence after design pass | Assessment |
|---|---|---|
| Discovery and scope | Detailed proposal plus recovered design-system plan | Strong evidence of completion |
| Product ecosystem and architecture | Customer, Business, Admin files and documented cross-system model | Defined and represented in Figma |
| Information architecture | Product files have full page architecture and screen rails | Completed for handoff purposes |
| Core booking flows | Customer guest-to-account booking prototype and designed booking screens | Completed as primary handoff flow |
| Support-module flows | Customer, business, and admin support states represented | Designed at handoff level; detailed policy still needs owners |
| Design system | Shared library with variables, styles, components, foundations, and documentation | Substantially completed; a few token/name fixes remain |
| Customer high-fidelity | 91 designed screens | Broad handoff coverage completed |
| Business high-fidelity | 62 designed screens | Broad handoff coverage completed |
| Admin high-fidelity | 65 designed screens | Broad handoff coverage completed |
| Responsive specification | Breakpoint contract documented; responsive examples still recommended for highest-risk booking screens | Mostly ready; add explicit variant boards if time allows |
| Clickable prototype | Three critical prototypes added | Ready for stakeholder/developer walkthrough |
| Developer handoff | Handoff boards added to product setup pages and this report updated | Ready for review; Code Connect depends on production repository |

The current project story is therefore: the original discovery and system work has been extended into a broad multi-portal Figma handoff. The remaining work is no longer basic screen coverage; it is refinement, stakeholder sign-off, responsive variant depth, production-code alignment, and implementation governance.
