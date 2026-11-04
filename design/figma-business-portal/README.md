# SafariNexa Business Portal → Figma

A Figma development plugin that draws the whole business portal (every flow, page, state and modal) as editable, auto-layout layers, built from `Prototype/src/app/business/**` and the shared UI components.

Target file: https://www.figma.com/design/BCRiYfkzt8djvVAXAvPj1h/SafariNexa-Business-Portal

## Run it

1. Open the Figma **desktop app** and the *SafariNexa-Business-Portal* file.
2. Menu → **Plugins → Development → Import plugin from manifest…** → pick `design/figma-business-portal/manifest.json` (first time only).
3. Menu → **Plugins → Development → SafariNexa Business Portal Generator**.
4. It takes about 30–90 s and opens **00 · Cover & flow map** when done.

Each run replaces the previous run: it builds a fresh set of pages, then deletes only the pages this plugin generated earlier (marked with plugin data) and puts the new ones in their place. Other pages, such as Figma's default "Page 1", are left alone. Hand edits on generated pages are lost when you re-run.

## What it creates (77 frames, 15 pages)

- **00 · Cover & flow map**, **00 · Design system** (tokens, Button and Status badge component sets, icons, controls, table, stat card, dialog).
- **01** Entry & sign in · **02** Onboarding · **03** Portal shell & navigation · **04** Overview · **05** Listings · **06** Guides · **07** Bookings · **08** Messages · **09** Reviews · **10** Earnings · **11** Notifications · **12** Settings & staff access · **13** Verification & documents.

Every frame matches what the code renders as of 4 Nov 2026 (demo mode on, seeded data). Charts are static drawings of the recharts output.

## Edit / rebuild

Screens live in `src/` (`common.js`, `shell.js`, `screens-a/b/c.js`, `main.js`). Tokens, components and icons are shared with the admin plugin in `../figma-admin-portal/src/lib.js`. Run `node build.mjs` to regenerate `code.js` (don't edit it by hand), then `node mock-run.js code.js` to smoke-test against a mock Figma API (`MOCK_EXISTING=1` simulates a re-run).
