# Cards, frames and controls — 4 November 2026

## Surface scale

- Main cards, table frames, banners and dialogs: 16px corners.
- Nested panels, media frames, upload areas and form fields: 12px corners. Small icon containers retain smaller corners; avatars and action pills remain circular/pill-shaped.
- Neutral surface outline: 1px, shared `border` token (`#e2e8f0`). Softer internal separators retain slate-100.
- Cards use a subtle card shadow; floating dialogs and menus use the floating shadow. Removed oversized 20–32px corners and heavy card shadows.
- Upload outlines remain dashed at 1px. Semantic selected/error borders, custom checkboxes and calendar selection remain meaningful exceptions.

## Controls

`form-control`, `form-control-compact`, `form-textarea`, `filter-select` and `field-shell` in `src/app/globals.css` provide a shared contract for native and React controls.

- Ordinary input/select: 44px height. Compact search/filter controls: 44px mobile, 36px desktop.
- Corners: 12px. Input outline: 1px `input` token (`#94a3b8`), distinct from noneditable cards.
- Background: white; disabled/readonly surfaces can use a muted tint. Text: foreground; placeholder: muted foreground at full opacity.
- Focus: primary outline with a restrained 2px ring; invalid controls use destructive outline/ring; disabled controls retain native semantics.
- Textareas: minimum 112px with vertical resizing where appropriate. Short verification notes have an 80px minimum and three rows, replacing the cramped single-line area.
- Input/select text: 16px on mobile, 14px desktop. Grouped date/guest/search inputs keep their icon space and use focus around the container.
- Hidden/file inputs, checkbox/radio controls and the existing message composer retain their appropriate specialised layouts.

Shared Input, Textarea and SelectTrigger and native text/select controls use the same foundation. Caller overrides that weakened borders or introduced conflicting field corners/shadows were removed. Data submission, validation, field names, event handlers and simulation behavior remain unchanged.

Reference components: [shadcn Input](https://ui.shadcn.com/docs/components/input) and [Card](https://ui.shadcn.com/docs/components/card). The exact sizing above is SafariNexa's local scale, not a claimed universal premium-product standard.

## Validation

TypeScript, ESLint, 200 tests across 41 suites and isolated production build. Visually checked the live verification cards and multiline reviewer notes. This is not an individual screenshot check of every route/viewport.

## Oversized panel correction

Customer/business inboxes had hardcoded 750px/780px frames and 600px empty states. They now scale to viewport height (`75svh`, capped at 680px with a 440px minimum); empty panels use `60svh`, capped at 520px with a 320px minimum. This keeps room for messages while reducing the unusually tall panels on common screens. The 168px module cards and 160px statistics cards are intentionally compact, consistent minimums. The onboarding wizard retains its taller content area because its multi-step form needs it.
