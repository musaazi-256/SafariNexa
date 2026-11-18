# SafariNexa → Figma (captured from the running app)

Three Figma development plugins, one per surface, that rebuild the real SafariNexa screens as editable layers. They load the latest capture from GitHub `main`, so a pushed capture reaches Figma by running the plugin again — no plugin changes needed.

| Plugin | Figma file | Loads |
|---|---|---|
| `admin/manifest.json` — SafariNexa Admin · captured designs | SafariNexa Admin portal | `design/handoff/admin/admin-captured.json` |
| `business/manifest.json` — SafariNexa Business · captured designs | SafariNexa Business portal | `design/handoff/business/business-captured.json` |
| `customer/manifest.json` — SafariNexa Customer · captured designs | [New customer SafariNexa](https://www.figma.com/design/tWZEUdZ2nYqvhDRrENS8x3) | `design/handoff/customer/customer-captured.json` |

## Run it

1. Open the Figma **desktop app** and the file for that surface.
2. Menu → **Plugins → Development → Import plugin from manifest…** and pick the surface's `manifest.json` (once per computer).
3. Menu → **Plugins → Development → SafariNexa … · captured designs**.

It builds, in the same layout, colours and type as the hand-built plugins (`design/figma-admin-portal`, `design/figma-business-portal`):

- **00 · Cover & flow map**: what was captured and when (with the commit), and every page chained left → right.
- **01, 02, …**: one page per group (`Prototype/scripts/capture/groups.mjs`). Each app page is a section (`07.1 · Bookings`) holding the page at full length and every tab, dialog and menu it opens, each with a numbered caption (`07.1.2 — …`) taken from the page's own heading and intro line.
- **Journeys**: each journey as numbered step cards across the customer website, business portal and admin portal, with the screen at that moment.

Each run replaces the pages it made before, and the hand-built plugin's cover and screen pages it supersedes (matched by name; the hand-built **00 · Design system** page is kept). Every other page is left alone.

## Refresh

```sh
cd Prototype
npm run capture          # records the app into design/handoff (starts next dev if needed)
git add ../design/handoff && git commit && git push   # then run the plugin in Figma
```

Only when `src/plugin.ts` changes: `npm run capture:plugins` (runs `build.mjs`) and re-import the manifests.
