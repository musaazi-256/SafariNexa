# SafariNexa Design System Plan

Version 0.1 - Phase 0 discovery and scope proposal  
Status: Awaiting approval before Figma implementation  
Sources: SafariNexa Mini Brand Guide, SafariNexa product documentation, shadcn/ui, Dice UI

## 1. Purpose

Create a reusable, accessible design system for SafariNexa's marketing website, customer platform, business portal, and admin portal. The Figma library and product code should expose the same semantic tokens, component APIs, states, and naming wherever practical.

The foundations must support desktop/tablet responsive web, mobile responsive web at launch, and a future native mobile application without rebuilding the brand, semantic tokens, or interaction language from zero.

shadcn/ui and Dice UI provide copy-ready React web code. They are not native-mobile component libraries. A future native app should reuse the token contract, anatomy, content rules, accessibility intent, and states while implementing platform-native controls.

The system should make implementation faster by:

- using shadcn/ui as the default component-code reference;
- using Dice UI for advanced accessible components not covered by the core shadcn catalog;
- retaining SafariNexa's visual identity without restyling every copied component independently;
- separating raw brand values from semantic product tokens;
- documenting responsive behavior, states, content rules, and accessibility;
- supporting light and dark modes without requiring dark mode at initial launch.

## 2. Source precedence

When sources conflict, use this order:

1. Approved SafariNexa product and accessibility requirements.
2. Approved SafariNexa semantic tokens and component API.
3. Existing implementation conventions agreed with developers.
4. shadcn/ui or Dice UI component behavior and accessibility.
5. Mini brand-guide styling.

The brand guide controls identity. It does not override usability, contrast, platform states, or component behavior.

## 3. Brand foundations

### 3.1 Confirmed brand assets

- Primary green: Deep Forest Green `#0F8F46`.
- Accent yellow: Safari Gold `#FFCE06`.
- Warm neutral / brand page background: Warm Ivory `#FBFAF5`.
- Logo idea: a road curve containing the SafariNexa S/N monogram.
- Pattern: repeated road/logogram motif.
- Brand attributes: movement, scenic routes, exploration, nature, trust, warmth, and approachability.

### 3.2 Product-use rules

- Green is the primary action, trust, success, and brand anchor.
- The exact brand green with white text is only about 4.17:1 and fails AA for normal text. Use the darker green 600 (`#0C763A`, about 5.73:1 against white) for default primary controls; retain `#0F8F46` as the identity color for larger marks, decorative fields, and contrast-safe compositions.
- Gold is an accent, highlight, rating, celebration, and selected-emphasis color. Do not use gold for small text on light surfaces.
- Ivory is a warm brand surface, not the only application background.
- Use neutral white/stone surfaces for dense forms, tables, dashboards, and comparison views.
- Use the logo pattern sparingly on marketing, cover, onboarding completion, and empty-state illustration surfaces. Avoid it behind dense text.
- Preserve the published logo lockups; do not rebuild or distort the mark inside UI components.

## 4. Typography proposal

### 4.1 Recommended product fonts

- Product UI: Geist Sans.
- Numeric/technical data: Geist Mono, only where alignment or code-like data benefits.
- Brand display accent: Lufga, optional and limited to high-impact marketing headings if licensed files are supplied.
- Fallback: Inter if Geist is unavailable in the development or Figma environment.
- Raleway: retain for brand collateral if desired, but do not use as the primary dense product-interface typeface.

This requires approval before foundations are created.

### 4.2 Type roles

| Role | Size / line | Weight | Use |
|---|---:|---:|---|
| Display | 48 / 56 | 600 | Marketing hero only |
| Heading 1 | 40 / 48 | 600 | Major page title |
| Heading 2 | 32 / 40 | 600 | Page section |
| Heading 3 | 24 / 32 | 600 | Card group or major panel |
| Heading 4 | 20 / 28 | 600 | Card or dialog title |
| Body large | 18 / 28 | 400 | Introductory copy |
| Body | 16 / 24 | 400 | Default reading text |
| Body small | 14 / 20 | 400 | Supporting product copy |
| Label | 14 / 20 | 500 | Form and control labels |
| Caption | 12 / 16 | 400 | Metadata and timestamps |
| Button | 14 / 20 | 500 | Control labels |
| Data large | 28 / 36 | 600 | KPI values and totals |

Use sentence case. Avoid all caps except compact metadata where accessibility and translation have been reviewed.

## 5. Variable architecture

### 5.1 Figma collections

1. `Primitives` - one mode, hidden from property pickers.
2. `Color` - Light and Dark modes, semantic aliases only.
3. `Spacing` - one mode.
4. `Sizing` - one mode for control heights, icons, and content widths.
5. `Radius` - one mode.
6. `Typography` - one mode for sizes, line heights, weights, and families.
7. `Effects` - one mode for blur and elevation values where variables are supported; Figma effect styles for composed shadows.
8. `Motion` - duration and easing tokens.
9. `Breakpoint` - reference variables for product documentation; responsive behavior remains layout-driven.

Every variable must have a specific Figma scope and WEB code syntax. Semantic variables alias primitives; components never bind directly to raw palette values.

### 5.2 Primitive color ramps

Proposed starting ramps, to be contrast-tested before creation:

| Step | Green | Gold | Neutral stone |
|---:|---|---|---|
| 50 | `#ECF8F1` | `#FFFAE5` | `#FAFAF9` |
| 100 | `#D2EFDE` | `#FFF2B8` | `#F5F5F4` |
| 200 | `#A7DFBF` | `#FFE780` | `#E7E5E4` |
| 300 | `#73CA99` | `#FFD83D` | `#D6D3D1` |
| 400 | `#3AAF6F` | `#FFCE06` | `#A8A29E` |
| 500 | `#0F8F46` | `#E7B900` | `#78716C` |
| 600 | `#0C763A` | `#C39600` | `#57534E` |
| 700 | `#0B5D30` | `#9B7400` | `#44403C` |
| 800 | `#0B4928` | `#755600` | `#292524` |
| 900 | `#0A3C23` | `#543D00` | `#1C1917` |
| 950 | `#052116` | `#302200` | `#0C0A09` |

Additional primitives:

- `brand/ivory = #FBFAF5`
- `base/white = #FFFFFF`
- `base/black = #000000`
- status ramps for red, amber, blue, and green;
- transparent overlays at 4%, 8%, 12%, 16%, 24%, 40%, and 64%.

### 5.3 shadcn-compatible semantic colors

Use the same names in Figma and CSS wherever possible:

- `background`, `foreground`
- `card`, `card-foreground`
- `popover`, `popover-foreground`
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `destructive`, `destructive-foreground`
- `border`, `input`, `ring`
- `success`, `success-foreground`
- `warning`, `warning-foreground`
- `info`, `info-foreground`
- `surface-brand`, `surface-brand-foreground`
- `surface-raised`, `surface-sunken`, `surface-overlay`
- `chart-1` through `chart-5`
- `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-accent`, `sidebar-border`, `sidebar-ring`

Safari Gold should usually alias `accent`, `warning`, selected highlights, or rating fills—not `primary`. White on Safari Gold is only about 1.49:1; use a deep green or near-black foreground instead.

### 5.4 Interaction-state tokens

Define semantic tokens for:

- default;
- hover;
- pressed/active;
- focus-visible;
- selected;
- disabled foreground/background/border;
- loading/skeleton;
- validation error;
- success;
- warning;
- information;
- destructive;
- scrim and modal overlay.

Focus uses a visible 2px ring plus 2px offset and must remain visible against white, ivory, green, gold, and dark surfaces.

### 5.5 Spacing and sizing

Use a 4px base grid.

`0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`

Control heights:

- compact: 32px;
- small: 36px;
- medium/default: 40px;
- large: 44px;
- touch-priority: 48px minimum.

Icon sizes: 12, 16, 20, 24, 32, 40. Use Lucide icons to align with common shadcn implementations; use custom icons only for SafariNexa-specific concepts.

### 5.6 Radius

Set `radius-lg` to 10px as the base implementation token, then derive:

- none: 0;
- sm: 6px;
- md: 8px;
- lg: 10px;
- xl: 14px;
- 2xl: 18px;
- 3xl: 22px;
- 4xl: 26px;
- full: 9999px.

Marketplace media cards may use xl/2xl. Form controls should use md/lg. Avoid making every surface pill-shaped.

### 5.7 Elevation

- `shadow/0`: none.
- `shadow/1`: subtle border-lift for controls and cards.
- `shadow/2`: hover card and sticky toolbar.
- `shadow/3`: popover and dropdown.
- `shadow/4`: dialog, drawer, and floating panel.
- `shadow/focus`: focus ring is separate from elevation.

Default dashboards should rely more on surface and border hierarchy than heavy shadows.

### 5.8 Motion

- instant: 0ms;
- fast: 100ms;
- standard: 150ms;
- moderate: 200ms;
- slow: 300ms;
- enter emphasis: 400-500ms only for meaningful transitions.

Easing: standard, enter, exit, and emphasized. Respect `prefers-reduced-motion`; never make task completion depend on animation.

### 5.9 Breakpoints

Implementation breakpoints align with Tailwind defaults:

- `sm`: 640px;
- `md`: 768px;
- `lg`: 1024px;
- `xl`: 1280px;
- `2xl`: 1536px.

Figma reference canvases:

- mobile: 390px;
- tablet: 768px;
- laptop: 1280px;
- desktop: 1440px.

Components should be intrinsically responsive rather than duplicated at every breakpoint.

### 5.10 Responsive grid specification

| Canvas | Columns | Margin | Gutter | Max content |
|---|---:|---:|---:|---:|
| Mobile 360-430 | 4 | 16px | 16px | Fluid |
| Large mobile / small tablet | 4 or 8 | 24px | 16px | Fluid |
| Tablet 768-1023 | 8 | 32px | 24px | Fluid |
| Laptop 1024-1279 | 12 | 40px | 24px | 1200px |
| Desktop 1280+ | 12 | 64-80px | 24px | 1280px |

Document 12-, 6-, 4-, 3-, and 2-column desktop compositions; 8-column tablet; and 4-column mobile. Components use layout constraints and container behavior rather than fixed widths copied from documentation frames.

### 5.11 Mobile layout foundations

- Safe-area tokens: top, bottom, inline start, and inline end.
- Sticky mobile action area with safe-area padding.
- Minimum touch target: 44x44px; preferred primary controls: 48px high.
- Page padding: 16px default; 20-24px for spacious editorial layouts.
- Card gaps: 12-16px; section gaps: 24-32px.
- Single-column forms by default.
- Do not place critical actions only inside hover behavior.
- Support software-keyboard resizing, input visibility, and scroll-to-error.
- Allow text scaling without clipping or fixed-height cards.
- Use bottom sheets or full-screen flows for dense mobile selection tasks.
- Respect reduced motion, orientation changes, and low-connectivity states.

### 5.12 Layer and elevation model

Adopt the screenshot's useful layer hierarchy, but express it semantically:

| Layer | Token | Typical use |
|---:|---|---|
| -1 | `layer/inset` | Recessed input well or sunken canvas |
| 0 | `layer/base` | Page background, disabled fields |
| 1 | `layer/card` | Cards and pressed controls |
| 2 | `layer/control` | Buttons and notification badges |
| 3 | `layer/sticky` | App bar, bottom action bar, navigation |
| 4 | `layer/raised` | Raised cards and menus |
| 5 | `layer/popover` | Picker, combobox, popover |
| 6 | `layer/modal` | Dialog, sheet, blocking overlay |

Pair this with z-index tokens. On mobile, prefer borders and surface contrast over large shadows.

## 6. Component architecture

### 6.1 Component API convention

Default properties:

- `Variant`: Default, Primary, Secondary, Outline, Ghost, Destructive, Link where relevant.
- `Size`: Compact, Small, Medium, Large, Icon where relevant.
- `State`: Default, Hover, Pressed, Focus, Disabled, Loading.
- `Icon start`: Boolean plus instance swap.
- `Icon end`: Boolean plus instance swap.
- `Label`: Text property.

Do not create unmanageable variant matrices. Split visual variant, size, and state into subcomponents when combinations exceed 30.

Add `Platform` or `Presentation` properties only where behavior truly differs. Do not create Web/Mobile variants for every component. Dialog/Sheet, Filter Sidebar/Sheet, Data Table/Card List, Navigation, Date Picker, and action bars require responsive presentation variants.

### 6.2 Tier 1 - Core primitives

- Button and Button Group
- Icon Button
- Link
- Badge and Status Badge
- Avatar
- Separator
- Skeleton and Spinner
- Tooltip
- Kbd
- Toggle and Toggle Group
- Aspect Ratio
- Progress

### 6.3 Tier 2 - Forms

- Field, Label, Helper Text, Error Text
- Input and Input Group
- Textarea
- Native Select and Select
- Combobox / Command picker
- Checkbox
- Radio Group
- Switch
- Slider
- Input OTP
- Date Picker, Date Range Picker, Calendar
- Time input
- Quantity Stepper
- Search Input
- File Upload and Document Upload (Dice UI)
- Multi-step Stepper (Dice UI)

Form components require default, hover, focus, filled, disabled, read-only, error, success, loading, and required/optional states.

Mobile form requirements:

- persistent labels above fields;
- correct keyboard/input mode documented;
- 48px preferred field height;
- assistive and error text never hidden behind the keyboard;
- password visibility, country code, OTP, date, and currency behaviors documented;
- clear buttons retain accessible names and touch targets;
- no side-by-side fields below the width required for readable labels and values.

### 6.4 Tier 3 - Feedback and overlays

- Alert and Inline Message
- Toast / Sonner
- Empty
- Dialog and Alert Dialog
- Drawer and Sheet
- Popover and Hover Card
- Dropdown Menu and Context Menu
- Collapsible and Accordion
- Loading overlay
- Confirmation pattern

Responsive overlay rule:

- desktop: centered dialog for short decisions, side sheet for contextual detail;
- tablet: dialog or sheet according to content length;
- mobile: bottom sheet for short selection/action flows, full-screen sheet for forms and multi-step tasks, and alert dialog only for genuinely blocking destructive confirmation;
- actions stack when labels no longer fit comfortably;
- modal content remains usable with the software keyboard open.

### 6.5 Tier 4 - Navigation

- Header / Top Navigation
- Sidebar
- Mobile Bottom Navigation
- Breadcrumb
- Tabs
- Pagination
- Navigation Menu
- Command Menu
- Step navigation
- User menu

Mobile navigation additions:

- compact app bar with title, back action, and no more than two trailing actions;
- bottom navigation limited to 3-5 primary destinations;
- overflow menu for secondary actions;
- sticky bottom primary action for booking and onboarding where appropriate;
- web sidebar collapses to a sheet/drawer rather than a tiny fixed rail by default.

### 6.6 Tier 5 - Data display

- Card foundation
- Item / list row
- Table
- Data Table with sorting, selection, filtering, pagination, and responsive card fallback
- Metric / KPI card
- Chart container and legend
- Timeline
- Calendar cell and event
- Media gallery
- Description list
- Key-value row

Responsive transformations:

- tables become task-focused cards, or horizontal scrollers only when column comparison must be preserved;
- KPI grids collapse from four/three columns to two and then one;
- timelines use a vertical mobile presentation;
- chart legends move below charts;
- media galleries provide swipe/scroll plus visible non-gesture controls;
- truncation is a last resort for booking, payment, and identity data.

## 7. SafariNexa product components

### 7.1 Marketplace cards

Build one `Listing Card` family with composition slots, then configure category patterns:

- Accommodation Card
- Tour Card
- Tour Guide Card
- Restaurant Card
- Transport Card
- Activity Card

Required properties and states:

- layout: vertical, horizontal, compact;
- media ratio: 4:3, 3:2, 16:9;
- verification badge;
- rating and review count;
- location and distance;
- price prefix, amount, currency, and unit;
- availability cue;
- promotion badge;
- save action: off/on/loading;
- states: default, hover, selected, unavailable, sold out, draft, pending approval, suspended, loading, and missing image.

Mobile card behavior:

- vertical cards use full container width;
- horizontal compact cards preserve a minimum 96-120px image width;
- save, verification, and promotion badges do not collide with media-safe areas;
- the full card may be a link, but nested save/menu actions require correct event and focus behavior;
- price and primary availability remain visible without hover;
- horizontal scrollers are for optional discovery rails, not the sole path to essential results.

### 7.2 Search and discovery

- Global Search Bar
- Destination Search
- Date and Guest Picker
- Category Switcher
- Filter Chip
- Filter Sidebar
- Mobile Filter Sheet
- Sort Menu
- Active Filters Summary
- Search Result Summary
- Map/List Switcher
- Recommendation Rail
- Destination Card

### 7.3 Trust and verification

- Verification Badge
- Business Verification Status
- Document Status Row
- Trust Summary
- Policy Summary
- Report Content Action
- Moderation Status
- Admin Decision Panel
- Audit Timeline

### 7.4 Booking and payments

- Price Breakdown
- Booking Summary Card
- Availability Selector
- Guest/Participant Selector
- Booking Status Badge
- Booking Status Timeline
- Payment Method Card
- Mobile Money Instruction Panel
- Payment Processing State
- Receipt Summary
- Refund Status
- Payout Status
- Commission Breakdown

### 7.5 Trip and itinerary

- Trip Card
- Trip Header
- Trip Service Item
- Add-to-Trip Action
- Trip Date Range
- Trip Cost Summary
- Itinerary Day
- Itinerary Activity
- Travel Segment
- Conflict Warning
- Empty Trip State
- Share Trip Panel

### 7.6 Reviews and communication

- Rating Input
- Rating Summary
- Review Card
- Review Response
- Review Moderation Row
- Notification Item
- Notification Group
- Message Thread preview if messaging remains in scope

### 7.7 Business and admin operations

- Dashboard KPI Card
- Action Required Card
- Listing Status Card
- Availability Calendar
- Booking Queue Row
- Verification Queue Row
- User/Business Summary Row
- Document Viewer Toolbar
- Decision and Rejection Panel
- Revenue Summary
- Report Filter Bar
- Responsive Admin Table/Card pattern

## 8. State standard

Every interactive component documents applicable states from this master set:

- default;
- hover;
- pressed;
- focus-visible;
- selected/checked;
- open/expanded;
- disabled;
- read-only;
- loading;
- skeleton;
- empty;
- error/invalid;
- success;
- warning;
- destructive;
- offline/retry where relevant;
- permission denied where relevant.

Every product record component also documents lifecycle states: draft, pending, under review, approved/verified, rejected, published, archived, suspended, cancelled, completed, refunded, disputed, or removed as applicable.

### 8.1 Labels, badges, and notification counters

Use distinct component families:

- `Badge` for category or metadata;
- `Status Badge` for lifecycle state;
- `Notification Badge` for counts and unread indicators;
- `Tag/Chip` for removable filters and selections.

Required presentations include info, success, warning, danger, unavailable, offline, primary, neutral, and custom category. Avoid all-caps by default. Counters display 1-99 and `99+`; dot-only indicators require an accessible label.

### 8.2 Selection controls

Checkbox, Radio, and Switch document unchecked/off, hover, focus-visible, checked/on, indeterminate where supported, disabled unchecked/checked, error, and label/description/message compositions.

On mobile, the label row—not only the small control glyph—is the touch target.

## 9. Accessibility standard

- WCAG 2.2 AA target.
- Text contrast at least 4.5:1; large text at least 3:1.
- Component boundaries and meaningful graphics at least 3:1.
- Keyboard access and logical focus order for every action.
- Visible focus that is not color-only.
- Minimum 44x44px touch target where feasible; never below platform requirements.
- Labels remain visible; placeholder text is not a label.
- Error text explains recovery and links to the field.
- Status uses text/icon in addition to color.
- Reduced-motion behavior is documented.
- Screen-reader names, roles, states, and live-region behavior map to the implementation component.
- Responsive tables provide a usable mobile alternative.

## 10. Figma file structure

Recommended pages:

1. `00 Cover`
2. `01 Getting Started`
3. `02 Foundations - Brand`
4. `03 Foundations - Color`
5. `04 Foundations - Typography`
6. `05 Foundations - Elevation & Layers`
7. `06 Foundations - Iconography`
8. `07 Foundations - Labels & Status`
9. `08 Foundations - Grid & Spacing`
10. `09 Foundations - Radius & Motion`
11. `10 Foundations - Responsive & Mobile`
12. `--- Components ---`
13. One page per core component family
14. `--- Product Patterns ---`
15. Marketplace Cards
16. Search & Filters
17. Booking & Payments
18. Trip & Itinerary
19. Verification & Moderation
20. Business & Admin Data
21. Responsive Transformations
22. `99 Utilities & QA`

Each component page contains purpose, anatomy, variants, states, responsive behavior, content rules, accessibility, do/don't examples, implementation mapping, and changelog.

### 10.1 Documentation examples inspired by the references

- Color: primitives, semantic pairs, light/dark modes, status ramps, contrast results, and controlled gradients. Gradients are not default control styling.
- Typography: display, heading, lead, body, quote, label, small, and tiny specimens at desktop and mobile widths.
- Elevation: layer number, semantic token, shadow preview, z-index, and approved usage.
- Icons: Lucide essentials, status icons, loaders, sizes, optical alignment, and custom SafariNexa icons.
- Labels: badges, status badges, chips, and notification counters.
- Grid: desktop, tablet, and mobile columns plus spacing usage examples.
- Components: anatomy, icon positions, states, assistive text, validation, responsive transformations, and realistic SafariNexa examples.

## 11. Developer alignment

### 11.1 Mapping rules

- Figma semantic variable names map to shadcn CSS variables.
- WEB code syntax uses `var(--token-name)`.
- Component and property names should mirror React APIs where practical.
- Use Lucide icon names in instance-swap labels and developer notes.
- Record whether each component comes from shadcn/ui, Dice UI, a wrapped derivative, or SafariNexa custom code.
- Do not detach code-reference components in Figma merely to restyle them; wrap or rebuild against shared tokens.

### 11.2 Source map

| Pattern | Preferred source |
|---|---|
| Core controls, overlays, navigation, tables | shadcn/ui |
| Field, Item, Empty, Input Group, Button Group, Spinner | shadcn/ui |
| File upload, stepper, advanced editable/compound controls | Dice UI |
| Marketplace, trip, verification, booking, payout patterns | SafariNexa composition using core primitives |

### 11.3 Cross-platform token delivery

- Web: CSS custom properties exposed to Tailwind/shadcn.
- Figma: variable aliases with Light/Dark modes and explicit scopes.
- Future native mobile: export the same primitive and semantic names to a platform-neutral token artifact; map to React Native, Flutter, iOS, or Android after the mobile stack is confirmed.
- Web-only states such as hover are not mandatory native states. Native maps pressed, focused, selected, disabled, loading, and platform feedback to the same intent.

## 12. Build sequence and checkpoints

### Phase 0 - Discovery and scope lock

- Inspect existing Figma pages, variables, components, styles, and subscribed libraries.
- Confirm fonts and license files.
- Confirm light-only launch versus light/dark implementation.
- Confirm component inventory and code framework with developers.
- Approve this plan.

Checkpoint: explicit approval before any Figma writes.

### Phase 1 - Foundations

- Create variable collections and aliases.
- Add code syntax and scopes.
- Create typography and effect styles.
- Run contrast audit.

Checkpoint: approve token summary before pages/components.

### Phase 2 - Documentation structure

- Create page skeleton.
- Document brand, color, typography, elevation, labels, spacing, radius, effects, icons, motion, grid, responsive transformations, and mobile foundations.

Checkpoint: approve page structure and foundation screenshots.

### Phase 3 - Components

Build and validate one family at a time in dependency order:

1. Button, link, icon, badge, avatar.
2. Form foundations and inputs.
3. Feedback and overlays.
4. Navigation.
5. Cards, items, and tables.
6. Search and filters.
7. Marketplace cards.
8. Booking and payment.
9. Trip and itinerary.
10. Business/admin operational patterns.

Checkpoint after every family; no batch approval by silence.

### Phase 4 - Integration and QA

- Code Connect where the repository is available.
- Accessibility, naming, token-binding, responsiveness, and state audits.
- Verify no unresolved hardcoded component values.
- Publish only after owner approval.

## 13. Decisions required before implementation

1. Approve Geist Sans, or select Inter/Raleway/another UI family.
2. Confirm whether licensed Lufga files are available and whether it may be used digitally.
3. Confirm light and dark mode scope.
4. Confirm developer base: shadcn Radix or Base UI.
5. Confirm icon package; recommendation is Lucide.
6. Confirm whether the repository already has shadcn tokens or components to preserve.
7. Confirm Figma edit access for the connected account.
8. Approve the proposed primitive ramps after contrast review.
9. Approve the v1 component inventory and phased build order.
10. Clarify whether “mobile” means mobile-responsive web only for Phase 1, or whether native-mobile components must also be produced during this engagement. The plan currently makes foundations native-ready while keeping component-code delivery web-first.

## 14. Current blocker

The connected Figma account does not currently have edit access to the supplied SafariNexa Design System file. No Figma changes have been made. Grant editor access before Phase 1.
