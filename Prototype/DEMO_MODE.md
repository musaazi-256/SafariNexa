# SafariNexa demo mode

This prototype defaults to demo mode in development and deployed builds. Set `SAFARINEXA_DEMO_MODE=false` to select live integrations explicitly. The header portal switches and all simulation actions are controlled on the server by this flag.

A running database with the seeded accounts is still required. Demo mode uses real database bookings, availability, receipts, notifications, roles, and portal data. It does not require Google, Stripe, mobile money, or email credentials.

- Use the header portal buttons to switch between the seeded customer, business (all four businesses), and admin identities. Switching replaces the current session; role checks remain active.
- Demo bookings respect each listing’s booking mode. Request-to-book listings go to the business for acceptance before simulated payment; instant listings proceed directly to payment. Restaurant reservations remain free and await business acceptance.
- Select MTN, Airtel, or a card method and choose a successful or declined simulation. Declined attempts can be retried. Successful payments confirm paid bookings and carry a `DEMO-` reference.
- Manage customer payments and full/partial refunds in Business → Payments & refunds or a booking’s payment panel. Admin booking details expose the same refund tools for support.
- Admin → Payments also simulates settlement for eligible `DEMO-` payments. Combined orders allocate the net amount to each verified business. Pending refunds hold settlement, and repeated settlement does not create duplicate payouts. Historical/live provider records are excluded.
- General admin preferences save on the device. Commission fields display the actual shared backend rate instead of storing editable fee previews that do not affect calculations.
- Verification-document links identify a saved document record. Old type-only links ask the user to select a submission when several match. Seeded example.com URLs have no uploaded file and show an unavailable-file state; no certificate is generated. Actual uploads retain the private document flow.
- Business Settings collects a logo, cover photo, registration number and contact details. Saved business imagery is used by the overview, featured business cards and conversation identity; absent images are not replaced with unrelated stock photography.
- Product-facing copy uses normal sign-in, booking, payment and refund wording. The demo flag, seeded account switching, simulated result controls and third-party-free processing remain available internally.
- Invitation, verification, and password-reset messages appear in the footer’s Demo email inbox. Links work without email delivery.
- Demo uploads use local private storage when no persistent directory is configured. A deployed host must permit local writes; use mounted directories for persistence across restarts.

Existing historical bookings retain their recorded states and policies. New demo bookings respect the listing’s request or instant booking mode. Live provider payments are never converted into simulated refunds.

Demo access and the demo inbox are intentionally available to anyone visiting the demo. Disable demo mode before using real customer data.
