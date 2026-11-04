# Listing location and restaurant fields

All four business listing categories use the same location control on create and edit. Destination is removed from the form; a hidden value preserves any existing destination assignment when editing.

Type a location and choose a suggestion, or paste coordinates or a Google Maps, Apple Maps, or OpenStreetMap pin. Both coordinates fill automatically. Changing the location clears the previous coordinates until another result or pin is chosen. City/town can be corrected manually. Directions/nearby landmark is a separate optional field (250 characters), saved as `Listing.locationDirections`, included in revision snapshots, and shown beside the customer-facing map.

Search uses Photon with an optional `PHOTON_BASE_URL` environment variable. The default public instance is suitable for moderate prototype traffic; use a dedicated instance for production volume. See [Photon API documentation](https://github.com/komoot/photon/blob/master/docs/api-v1.md) and [public service terms](https://github.com/komoot/photon#demo-server). Requests debounce, cancel stale searches, cache provider responses, and keep pasted coordinates usable when reverse geocoding is unavailable. Map-link resolution validates every redirect against an HTTPS provider allowlist.

Migration `20261104000000_listing_location_directions` adds a nullable column. The local database uses an existing schema without recorded migrations, so only this new additive SQL was executed locally. Deploy through the project's usual migration/baselining process. Regenerate Prisma and restart running development servers after the schema update.

Restaurant cuisine types are multi-select checkboxes. Repeated form values are deduplicated and saved as comma-separated cuisine values in the existing field, preserving custom legacy values on edit. Price/price range is a manual text entry with no predefined selection; existing values are retained.

Verified all four create forms, live location search, coordinate parsing, mobile layout, cuisine selection/deselection and submitted restaurant form values without creating listings.
