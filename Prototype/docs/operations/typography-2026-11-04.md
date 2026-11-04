# Typography consistency — 4 November 2026

The audit covered customer pages, business and admin portals, shared navigation, forms, checkout, notifications, messaging, tables and charts. Changes preserve the existing layouts and data/interaction behaviour.

## Hierarchy

Use the shared `type-*` classes in `src/app/globals.css`. Keep colour separate so image banners retain white text.

| Role | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `type-display` | 36 → 48 → 60px / 1.1 | 600 | Marketing hero |
| `type-page` | 24 → 30px / 1.25 | 600 | Portal and account page title |
| `type-section` | 20 → 24px / 1.375 | 600 | Major sections |
| `type-card` | 18px / 1.375 | 600 | Card heading |
| `type-body` | 16px / 1.625 | 400 | Reading content |
| `type-body-sm` | 14px / 1.625 | 400 | Dense product content and messages |
| `type-label` | 14px / 20px | 500 | Form labels and controls |
| `type-caption` | 12px / 20px | 400 | Dates and supporting information |
| `type-eyebrow` | 12px / 20px | 500 | Short contextual labels only |

Existing statistics cards retain their 24px / 600 values, 18px compact values and tabular numerals. Tables retain their calm regular-weight cells, 12px headers/statuses and underlined green links. Shared Input/Textarea text is 16px on small screens, 14px at desktop, to avoid focus zoom on mobile.

## Audit corrections

- Removed 9–11px application labels and chart ticks in favour of 12px captions.
- Replaced 800/900 weights and reduced heavy labels/actions to medium weight.
- Consolidated arbitrary 12/13/14/15/16/19/20px text utilities into the Tailwind scale.
- Raised faint neutral text on light surfaces from slate/gray 400 to 500; decorative icons remain independent.
- Set readable placeholders, regular message bodies, and consistent page headings.
- Preserved semantic status colours, white text on image/dark surfaces, explicit monetary formatting, and real data sources.

The approach follows [shadcn's context-dependent typesetting](https://ui.shadcn.com/docs/typeset) and [WCAG contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). The contrast guidance calls for at least 4.5:1 for ordinary text. This change is not a full accessibility conformance certification; image backgrounds and future content still need contextual checks.

## Validation

TypeScript, ESLint, 200 tests across 41 suites, and an isolated production build passed. Visually reviewed the live admin verification and dashboard screens. Shared typography and responsive utilities cover other screens; this was not a screenshot audit of every route at every viewport.
