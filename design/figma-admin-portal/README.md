# SafariNexa Admin Portal → Figma

A Figma development plugin that draws the whole admin portal (every flow, page, state and modal) as editable, auto-layout layers. The screens are built from `Prototype/src/app/admin/**` and the shared UI components.

## Run it

1. Open the Figma **desktop app** and open the file *SafariNexa-Admin-portal*.
2. Menu → **Plugins → Development → Import plugin from manifest…** and pick `design/figma-admin-portal/manifest.json`.
3. Menu → **Plugins → Development → SafariNexa Admin Portal Generator**.
4. It takes about 30–90 s. When it finishes it opens **00 · Cover & flow map**.

Each run replaces the previous run: it builds a fresh set of pages, then deletes the pages an earlier run generated (marked with plugin data, or matching the generated page names exactly) and puts the new ones in their place. Any other page, such as "00 · Start here", is left alone. Edits you made by hand on generated pages are lost when you re-run.

## What it creates

- **00 · Cover & flow map**: every flow as a chain of numbered screens.
- **00 · Design system**: colour and type tokens, the **Button** and **Status badge** component sets, lucide icon components, form controls, table, stat card and dialog.
- **01–16**: one page per flow. Each route gets a section, with numbered 1440-wide frames and a caption that explains the state.
- Confirmation modals (reject, fraud hold, suspend, refund, publish, hide, close, sign out) were proposed here and built in code on 4 Nov 2026 (`ConfirmSubmit`). Every frame matches what the code renders as of 4 Nov 2026, including the prefilled demo sign-in and compact dashboard stat cards.

## Edit / rebuild

Change the files in `src/`, then run `node build.mjs`, which regenerates `code.js`. Don't edit `code.js` by hand.
